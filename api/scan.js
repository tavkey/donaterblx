const cache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache

module.exports = async (req, res) => {
  // Handle CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const username = (req.query.username || '').trim();

  if (!username) {
    return res.status(400).json({ error: 'Username parameter is required.' });
  }

  // Check cache
  const cacheKey = username.toLowerCase();
  const cachedData = cache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
    return res.status(200).json(cachedData.data);
  }

  try {
    // 1. Convert Username to User ID
    const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: true })
    });

    if (!userRes.ok) {
      throw new Error(`Roblox user lookup failed: ${userRes.statusText}`);
    }

    const userData = await userRes.json();
    if (!userData.data || userData.data.length === 0) {
      return res.status(404).json({ error: `Roblox user '${username}' not found.` });
    }

    const userObj = userData.data[0];
    const userId = userObj.id;

    // 2. Fetch User Avatar Thumbnails in parallel
    const [headshotRes, fullAvatarRes, gamesRes] = await Promise.all([
      fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`).catch(() => null),
      fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png`).catch(() => null),
      fetch(`https://games.roblox.com/v2/users/${userId}/games?limit=50&accessFilter=Public`).catch(() => null)
    ]);

    let avatarHeadshotUrl = '';
    let avatarFullUrl = '';

    if (headshotRes && headshotRes.ok) {
      const hsData = await headshotRes.json();
      if (hsData.data && hsData.data[0]) avatarHeadshotUrl = hsData.data[0].imageUrl;
    }

    if (fullAvatarRes && fullAvatarRes.ok) {
      const faData = await fullAvatarRes.json();
      if (faData.data && faData.data[0]) avatarFullUrl = faData.data[0].imageUrl;
    }

    let games = [];
    if (gamesRes && gamesRes.ok) {
      const gData = await gamesRes.json();
      games = gData.data || [];
    }

    // 3. For each public universe, fetch its gamepasses
    const gamepassPromises = games.map(async (game) => {
      try {
        const universeId = game.id;
        const passRes = await fetch(`https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes`);
        if (!passRes.ok) return [];
        const passData = await passRes.json();
        const rawPasses = passData.gamePasses || [];
        return rawPasses.map(p => ({ ...p, gameName: game.name, universeId }));
      } catch (err) {
        return [];
      }
    });

    const nestedPasses = await Promise.all(gamepassPromises);
    const allRawPasses = nestedPasses.flat();

    if (allRawPasses.length === 0) {
      const result = {
        user: {
          id: userId,
          username: userObj.name,
          displayName: userObj.displayName,
          hasVerifiedBadge: !!userObj.hasVerifiedBadge,
          avatarHeadshot: avatarHeadshotUrl,
          avatarFull: avatarFullUrl
        },
        stats: {
          totalGames: games.length,
          totalPasses: 0,
          forSalePasses: 0,
          totalRobuxValue: 0
        },
        gamepasses: []
      };
      cache.set(cacheKey, { timestamp: Date.now(), data: result });
      return res.status(200).json(result);
    }

    // 4. Fetch details (product info) & thumbnail images for gamepasses
    // Concurrency limit for product info queries
    const detailedPasses = await Promise.all(allRawPasses.map(async (pass) => {
      try {
        const infoRes = await fetch(`https://apis.roblox.com/game-passes/v1/game-passes/${pass.id}/product-info`);
        if (!infoRes.ok) {
          return {
            id: pass.id,
            name: pass.name || pass.displayName || 'Game Pass',
            description: pass.displayDescription || '',
            price: 0,
            isForSale: !!pass.isForSale,
            iconUrl: '',
            gameName: pass.gameName,
            universeId: pass.universeId,
            robloxUrl: `https://www.roblox.com/game-pass/${pass.id}`
          };
        }
        const info = await infoRes.json();
        const price = (typeof info.PriceInRobux === 'number' && info.PriceInRobux > 0) ? info.PriceInRobux : 0;
        const isForSale = (info.IsForSale === true) && (price > 0);

        return {
          id: pass.id,
          name: info.Name || pass.name || 'Game Pass',
          description: info.Description || '',
          price: price,
          isForSale: isForSale,
          iconImageAssetId: info.IconImageAssetId || pass.displayIconImageAssetId,
          gameName: pass.gameName,
          universeId: pass.universeId,
          robloxUrl: `https://www.roblox.com/game-pass/${pass.id}`
        };
      } catch (err) {
        return {
          id: pass.id,
          name: pass.name || 'Game Pass',
          description: '',
          price: 0,
          isForSale: false,
          gameName: pass.gameName,
          universeId: pass.universeId,
          robloxUrl: `https://www.roblox.com/game-pass/${pass.id}`
        };
      }
    }));

    // Batch fetch gamepass thumbnails
    const passIds = detailedPasses.map(p => p.id);
    const thumbMap = new Map();
    if (passIds.length > 0) {
      try {
        const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/game-passes?gamePassIds=${passIds.join(',')}&size=150x150&format=Png`);
        if (thumbRes.ok) {
          const thumbData = await thumbRes.json();
          (thumbData.data || []).forEach(item => {
            if (item.imageUrl) thumbMap.set(item.targetId, item.imageUrl);
          });
        }
      } catch (e) {
        // Thumbnail fetch error fallback
      }
    }

    // Attach thumbnails & compute stats
    let totalRobuxValue = 0;
    let forSaleCount = 0;

    const finalPasses = detailedPasses.map(p => {
      const iconUrl = thumbMap.get(p.id) || (p.iconImageAssetId ? `https://rbxcdn.com/${p.iconImageAssetId}` : '');
      if (p.isForSale) {
        forSaleCount++;
        totalRobuxValue += (p.price || 0);
      }
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        isForSale: p.isForSale,
        iconUrl,
        gameName: p.gameName,
        universeId: p.universeId,
        robloxUrl: p.robloxUrl
      };
    });

    // Sort by price descending by default
    finalPasses.sort((a, b) => b.price - a.price);

    const result = {
      user: {
        id: userId,
        username: userObj.name,
        displayName: userObj.displayName,
        hasVerifiedBadge: !!userObj.hasVerifiedBadge,
        avatarHeadshot: avatarHeadshotUrl,
        avatarFull: avatarFullUrl
      },
      stats: {
        totalGames: games.length,
        totalPasses: finalPasses.length,
        forSalePasses: forSaleCount,
        totalRobuxValue
      },
      gamepasses: finalPasses
    };

    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return res.status(200).json(result);

  } catch (error) {
    console.error('API Scan error:', error);
    return res.status(500).json({ error: 'Failed to scan Roblox user gamepasses: ' + error.message });
  }
};

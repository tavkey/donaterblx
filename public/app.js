document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const searchForm = document.getElementById('search-form');
  const usernameInput = document.getElementById('username-input');
  const searchBtn = document.getElementById('search-btn');
  const clearBtn = document.getElementById('clear-btn');
  const presetBtns = document.querySelectorAll('.preset-btn');

  const loadingState = document.getElementById('loading-state');
  const errorContainer = document.getElementById('error-container');
  const errorTitle = document.getElementById('error-title');
  const errorMessage = document.getElementById('error-message');

  const resultsSection = document.getElementById('results-section');
  const userAvatar = document.getElementById('user-avatar');
  const userDisplayName = document.getElementById('user-display-name');
  const verifiedBadge = document.getElementById('verified-badge');
  const userHandle = document.getElementById('user-handle');
  const robloxProfileLink = document.getElementById('roblox-profile-link');
  const copyShareBtn = document.getElementById('copy-share-btn');

  const statTotalValue = document.getElementById('stat-total-value');
  const statForSale = document.getElementById('stat-for-sale');
  const statTotalGames = document.getElementById('stat-total-games');

  const filterPassInput = document.getElementById('filter-pass-input');
  const sortSelect = document.getElementById('sort-select');
  const forSaleOnlyCheckbox = document.getElementById('for-sale-only-checkbox');

  const passesGrid = document.getElementById('passes-grid');
  const noPassesState = document.getElementById('no-passes-state');

  // State
  let currentData = null;

  // Clear button visibility
  usernameInput.addEventListener('input', () => {
    if (usernameInput.value.trim().length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  });

  clearBtn.addEventListener('click', () => {
    usernameInput.value = '';
    clearBtn.classList.add('hidden');
    usernameInput.focus();
  });

  // Preset Buttons
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const username = btn.getAttribute('data-username');
      usernameInput.value = username;
      clearBtn.classList.remove('hidden');
      performScan(username);
    });
  });

  // Form Submit
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    if (username) {
      performScan(username);
    }
  });

  // Check URL query on load
  const urlParams = new URLSearchParams(window.location.search);
  const initialUsername = urlParams.get('username') || urlParams.get('u');
  if (initialUsername) {
    usernameInput.value = initialUsername;
    clearBtn.classList.remove('hidden');
    performScan(initialUsername);
  }

  // Perform Scan API Request
  async function performScan(username) {
    // Reset UI
    errorContainer.classList.add('hidden');
    resultsSection.classList.add('hidden');
    loadingState.classList.remove('hidden');
    searchBtn.disabled = true;

    // Update URL query state without reload
    const newUrl = `${window.location.pathname}?username=${encodeURIComponent(username)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    try {
      const response = await fetch(`/api/scan?username=${encodeURIComponent(username)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan Roblox player.');
      }

      currentData = data;
      renderResults(data);

    } catch (err) {
      showError(err.message || 'An error occurred while scanning.');
    } finally {
      loadingState.classList.add('hidden');
      searchBtn.disabled = false;
    }
  }

  // Render User Profile and Stats
  function renderResults(data) {
    const user = data.user;
    const stats = data.stats;

    // Profile info
    userAvatar.src = user.avatarHeadshot || user.avatarFull || 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-Placeholder';
    userAvatar.alt = `${user.displayName}'s Avatar`;
    userDisplayName.textContent = user.displayName;
    userHandle.textContent = `@${user.username}`;
    robloxProfileLink.href = `https://www.roblox.com/users/${user.id}/profile`;

    if (user.hasVerifiedBadge) {
      verifiedBadge.classList.remove('hidden');
    } else {
      verifiedBadge.classList.add('hidden');
    }

    // Stats
    statTotalValue.textContent = formatNumber(stats.totalRobuxValue);
    statForSale.textContent = formatNumber(stats.forSalePasses);
    statTotalGames.textContent = formatNumber(stats.totalGames);

    // Render Gamepasses Grid
    applyFiltersAndRender();

    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  }

  // Apply Filter & Sort Controls
  function applyFiltersAndRender() {
    if (!currentData || !currentData.gamepasses) return;

    let passes = [...currentData.gamepasses];
    const searchTerm = filterPassInput.value.toLowerCase().trim();
    const sortOrder = sortSelect.value;
    const forSaleOnly = forSaleOnlyCheckbox.checked;

    // Filter available passes only
    if (forSaleOnly) {
      passes = passes.filter(p => p.isForSale && p.price > 0);
    }

    // Search filter
    if (searchTerm) {
      passes = passes.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        (p.gameName && p.gameName.toLowerCase().includes(searchTerm))
      );
    }

    // Sort
    if (sortOrder === 'price-desc') {
      passes.sort((a, b) => b.price - a.price);
    } else if (sortOrder === 'price-asc') {
      passes.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'name-asc') {
      passes.sort((a, b) => a.name.localeCompare(b.name));
    }

    renderPassesGrid(passes);
  }

  // Listeners for toolbar controls
  filterPassInput.addEventListener('input', applyFiltersAndRender);
  sortSelect.addEventListener('change', applyFiltersAndRender);
  forSaleOnlyCheckbox.addEventListener('change', applyFiltersAndRender);

  // Render Pass Cards Grid
  function renderPassesGrid(passes) {
    passesGrid.innerHTML = '';

    if (passes.length === 0) {
      noPassesState.classList.remove('hidden');
      return;
    }

    noPassesState.classList.add('hidden');

    passes.forEach(pass => {
      const card = document.createElement('div');
      card.className = 'pass-card';

      const imageSrc = pass.iconUrl || 'https://tr.rbxcdn.com/30DAY-GamePass-Placeholder';

      card.innerHTML = `
        <div class="pass-card-top">
          <div class="pass-thumb-wrapper">
            <img src="${imageSrc}" alt="${escapeHtml(pass.name)}" class="pass-thumb" loading="lazy" onerror="this.src='https://tr.rbxcdn.com/30DAY-GamePass-Placeholder'" />
            <span class="pass-badge ${pass.isForSale ? 'status-onsale' : 'status-offsale'}">
              ${pass.isForSale ? 'For Sale' : 'Offsale'}
            </span>
          </div>
          <div class="pass-meta">
            <h3 class="pass-title" title="${escapeHtml(pass.name)}">${escapeHtml(pass.name)}</h3>
            <p class="pass-game" title="${escapeHtml(pass.gameName || 'Public Game')}">
              <i class="fa-solid fa-gamepad"></i> ${escapeHtml(pass.gameName || 'Public Game')}
            </p>
          </div>
        </div>

        <div class="pass-card-bottom">
          <div class="pass-price-row">
            <div class="price-box">
              <span class="r-symbol">R$</span>
              <span>${pass.isForSale ? formatNumber(pass.price) : 'N/A'}</span>
            </div>
          </div>
          <a href="${pass.robloxUrl}" target="_blank" rel="noopener" class="btn ${pass.isForSale ? 'btn-donate' : 'btn-disabled'}">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> ${pass.isForSale ? 'Donate / Buy' : 'Offsale'}
          </a>
        </div>
      `;

      passesGrid.appendChild(card);
    });
  }

  // Error Display
  function showError(msg) {
    errorTitle.textContent = 'Error Scanning Player';
    errorMessage.textContent = msg;
    errorContainer.classList.remove('hidden');
    resultsSection.classList.add('hidden');
  }

  // Share button
  copyShareBtn.addEventListener('click', () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('Scan link copied to clipboard!');
    }).catch(() => {
      showToast('Copied link: ' + shareUrl);
    });
  });

  // Helpers
  function formatNumber(num) {
    return (num || 0).toLocaleString();
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function showToast(message) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-check-circle" style="color: var(--accent-green)"></i> ${message}`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
});

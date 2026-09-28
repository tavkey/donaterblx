# 🎮 Roblox Gamepass Scanner & Donator Website

A modern, responsive web application that scans any Roblox player's public games to discover all their published gamepasses, displaying Robux prices with direct purchase and donation links.

![Roblox Gamepass Scanner](public/styles.css)

## ✨ Features

- **Instant Player Lookup**: Search by any Roblox username to retrieve avatar headshots, full body avatars, and verified status badges.
- **Gamepass Scanner**: Automatically scans all public experiences created by the player and aggregates their gamepasses into a clean grid view.
- **Live Robux Pricing**: Displays exact Robux prices, pass thumbnail icons, titles, and for-sale statuses.
- **Direct Purchase/Donation Redirect**: Click any gamepass to instantly open the official Roblox purchase page in a new tab.
- **Interactive Controls**:
  - Sort by Price (High to Low / Low to High) or Name (A to Z).
  - Filter by "For Sale Only".
  - Live text search across gamepass titles.
  - Shareable search URLs (e.g. `?username=hazem`).
- **Sleek Roblox Dark Theme**: Custom dark mode UI with glassmorphism, animated skeleton loaders, glowing Robux gold badges, and toast notifications.
- **GitHub & Vercel Ready**: Preconfigured with Vercel serverless functions in `/api` and a local Express server wrapper.

---

## 🚀 Quick Start (Run Locally)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)

### Steps

1. **Clone the repository or navigate to directory**:
   ```bash
   cd roblox-gamepass-scanner
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local server**:
   ```bash
   npm start
   ```

4. **Open in browser**:
   Visit [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 📤 Deploying to GitHub

1. Initialize git (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Roblox Gamepass Scanner"
   ```

2. Create a new repository on [GitHub](https://github.com/new).

3. Link and push to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/roblox-gamepass-scanner.git
   git branch -M main
   git push -u origin main
   ```

---

## ⚡ Deploying to Vercel (1-Click)

### Method A: Via Vercel Dashboard (Recommended)

1. Push your repository to **GitHub**.
2. Go to [Vercel.com](https://vercel.com) and log in.
3. Click **"Add New Project"** -> **"Import Git Repository"**.
4. Select your `roblox-gamepass-scanner` repository.
5. Keep the default settings (Framework Preset: **Other** / **None**).
6. Click **"Deploy"**. Vercel will automatically detect `vercel.json` and deploy both the static frontend and the `/api/scan` serverless function!

### Method B: Via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy directly from your terminal:
   ```bash
   vercel
   ```

---

## 📁 Project Structure

```
roblox-gamepass-scanner/
├── api/
│   └── scan.js           # Vercel Serverless Function handling Roblox API requests
├── public/
│   ├── index.html        # Main HTML layout & markup
│   ├── styles.css        # Roblox dark mode stylesheet & glassmorphic UI
│   └── app.js            # Interactive frontend logic & API fetching
├── server.js             # Express server for local development
├── vercel.json           # Vercel deployment configuration
├── package.json          # Node dependencies & scripts
├── .gitignore            # Git ignore rules
└── README.md             # Documentation
```

## 📜 License
MIT License. Not affiliated with or endorsed by Roblox Corporation.

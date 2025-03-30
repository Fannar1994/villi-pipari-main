
const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add electron scripts
packageJson.scripts = {
  ...packageJson.scripts,
  "electron:dev": "concurrently \"cross-env NODE_ENV=development npm run dev\" \"wait-on http://localhost:8080 && electron electron/main.js\"",
  "electron:build": "npm run build && electron-builder",
  "electron:package": "node ./node_modules/.bin/vite build && electron-builder --dir --config electron-builder.json"
};

// Add main entry for Electron
packageJson.main = "electron/main.js";

// Write updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('Electron scripts added to package.json');


const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add electron scripts with correct port configuration
packageJson.scripts = {
  ...packageJson.scripts,
  "electron:dev": "concurrently \"cross-env NODE_ENV=development npm run dev\" \"wait-on http-get://localhost:8080 && electron electron/main.cjs\"",
  "electron:build": "npm run build && electron-builder",
  "electron:build:win": "npm run build && electron-builder --windows",
  "electron:package": "node -e \"require('child_process').execSync('npm run build', {stdio: 'inherit'})\" && electron-builder --dir --config electron-builder.json"
};

// Add main entry for Electron - explicitly set the .cjs extension
packageJson.main = "electron/main.cjs";

// Add missing fields required by electron-builder
packageJson.description = "Simple Bill Producer - An Electron application for bill generation";
packageJson.author = {
  "name": "Villi Pípari",
  "email": "contact@example.com"
};

// Make sure electron and electron-builder are only in devDependencies
if (!packageJson.devDependencies) {
  packageJson.devDependencies = {};
}

if (packageJson.dependencies && packageJson.dependencies.electron) {
  // Move electron to devDependencies
  packageJson.devDependencies.electron = packageJson.dependencies.electron;
  // Remove from dependencies
  delete packageJson.dependencies.electron;
}

if (packageJson.dependencies && packageJson.dependencies['electron-builder']) {
  // Move electron-builder to devDependencies
  packageJson.devDependencies['electron-builder'] = packageJson.dependencies['electron-builder'];
  // Remove from dependencies
  delete packageJson.dependencies['electron-builder'];
}

// Write updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('Electron scripts added to package.json');
console.log('Added description and author to package.json');
console.log('Moved electron and electron-builder to devDependencies');

// Execute this script directly
if (require.main === module) {
  console.log('electron-scripts.cjs executed directly');
}

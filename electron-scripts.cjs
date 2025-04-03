
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Fixed port for Vite - changed to 8080
const VITE_PORT = 8080;

// Function to update package.json scripts
function updatePackageJson() {
  // Read package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  console.log(`Updating package.json scripts with fixed port ${VITE_PORT}`);

  // Add electron scripts with fixed port configuration and trace warnings
  packageJson.scripts = {
    ...packageJson.scripts,
    "electron:dev": `concurrently "cross-env NODE_ENV=development VITE_PORT=${VITE_PORT} npm run dev -- --host --port=${VITE_PORT} --strictPort" "wait-on http-get://localhost:${VITE_PORT} && cross-env NODE_ENV=development VITE_PORT=${VITE_PORT} electron --trace-warnings electron/main.cjs"`,
    "electron:build": "npm run build && electron-builder --config electron-builder.json",
    "electron:build:win": "npm run build && electron-builder --windows --config electron-builder.json",
    "electron:package": "node -e \"require('child_process').execSync('npm run build', {stdio: 'inherit'})\" && electron-builder --dir --config electron-builder.json"
  };

  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  console.log('Electron scripts added to package.json');
  console.log(`Electron will connect to port ${VITE_PORT}`);
  return packageJson;
}

// Execute this script directly
if (require.main === module) {
  console.log('Updating package.json...');
  const updatedPackage = updatePackageJson();
  console.log('Updated package.json with the following scripts:');
  console.log(JSON.stringify(updatedPackage.scripts, null, 2));
}

module.exports = { updatePackageJson };

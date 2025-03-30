
const fs = require('fs');
const path = require('path');
const http = require('http');

// Function to check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.once('error', () => {
      resolve(true); // Port is in use
    });
    server.once('listening', () => {
      server.close();
      resolve(false); // Port is available
    });
    server.listen(port);
  });
}

// Function to find available port
async function findAvailablePort(startPort, maxAttempts = 10) {
  let port = startPort;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    console.log(`Checking if port ${port} is available...`);
    const inUse = await isPortInUse(port);
    if (!inUse) {
      console.log(`Found available port: ${port}`);
      return port;
    }
    port++;
    attempts++;
  }
  
  console.error(`Could not find an available port after ${maxAttempts} attempts`);
  return startPort; // Return the start port as fallback
}

async function updatePackageJson() {
  // Read package.json
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Find an available port
  const port = await findAvailablePort(8080);
  console.log(`Using port ${port} for Electron development`);

  // Add electron scripts with dynamic port configuration
  packageJson.scripts = {
    ...packageJson.scripts,
    "electron:dev": `concurrently "cross-env NODE_ENV=development npm run dev" "wait-on http-get://localhost:${port} && electron electron/main.cjs"`,
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
}

// Execute this script directly
if (require.main === module) {
  console.log('electron-scripts.cjs executed directly');
  updatePackageJson().catch(console.error);
}

module.exports = { findAvailablePort };

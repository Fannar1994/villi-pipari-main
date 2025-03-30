
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

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
async function findAvailablePort(startPort, maxAttempts = 30) {
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
  return null; // Return null if no port is available
}

// Function to get the port Vite is actually using
// This helps when Vite automatically selects a different port
async function detectVitePort() {
  try {
    // Start Vite in the background and capture its output
    const viteProcess = execSync('npx vite --port=8080 --strictPort=false --host=localhost', { 
      encoding: 'utf8',
      timeout: 5000, // 5 second timeout
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Extract the port from Vite's output using a regex
    const portMatch = viteProcess.match(/Local:\s+http:\/\/localhost:(\d+)/);
    if (portMatch && portMatch[1]) {
      return parseInt(portMatch[1], 10);
    }
  } catch (error) {
    console.log('Could not detect Vite port automatically:', error.message);
  }
  
  // Fallback: Try common ports
  for (let port = 8080; port < 8110; port++) {
    try {
      const response = await fetch(`http://localhost:${port}`);
      if (response.ok) {
        console.log(`Vite server detected on port ${port}`);
        return port;
      }
    } catch (err) {
      // Port not responding, continue
    }
  }
  
  console.log('Could not detect Vite port, defaulting to 8080');
  return 8080;
}

async function updatePackageJson() {
  // Read package.json
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Find an available port
  const port = await findAvailablePort(8080);
  if (!port) {
    console.error('No available ports found. Please close some applications and try again.');
    process.exit(1);
  }
  
  console.log(`Using port ${port} for Electron development`);

  // Add electron scripts with dynamic port configuration
  packageJson.scripts = {
    ...packageJson.scripts,
    "electron:dev": `concurrently "cross-env NODE_ENV=development ELECTRON_PORT=${port} npm run dev" "wait-on http-get://localhost:${port} && electron electron/main.cjs"`,
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
  console.log(`Electron will connect to port ${port}`);
}

// Execute this script directly
if (require.main === module) {
  console.log('electron-scripts.cjs executed directly');
  updatePackageJson().catch(console.error);
}

module.exports = { findAvailablePort, detectVitePort };

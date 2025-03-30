
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync, spawn } = require('child_process');

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

// Improved function to detect which port Vite is using
async function detectVitePort(port) {
  return new Promise((resolve, reject) => {
    console.log(`Starting Vite on port ${port}...`);
    
    // Start Vite as a child process
    const viteProcess = spawn('npx', ['vite', `--port=${port}`, '--strictPort=false'], {
      stdio: ['inherit', 'pipe', 'inherit'],
      shell: true
    });
    
    let output = '';
    let portDetected = false;
    
    // Listen for Vite's stdout to extract the port
    viteProcess.stdout.on('data', (data) => {
      const dataStr = data.toString();
      output += dataStr;
      console.log(dataStr); // Log Vite output
      
      // Try to extract the port from Vite's output
      const portMatch = dataStr.match(/Local:\s+http:\/\/localhost:(\d+)/);
      if (portMatch && portMatch[1] && !portDetected) {
        const detectedPort = parseInt(portMatch[1], 10);
        portDetected = true;
        console.log(`✅ Vite server detected on port ${detectedPort}`);
        resolve({ port: detectedPort, process: viteProcess });
      }
    });
    
    // Set a timeout in case Vite doesn't start within a reasonable time
    const timeout = setTimeout(() => {
      if (!portDetected) {
        viteProcess.kill();
        reject(new Error('Timed out waiting for Vite to start'));
      }
    }, 30000); // 30 seconds timeout
    
    viteProcess.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    
    viteProcess.on('exit', (code) => {
      if (!portDetected) {
        clearTimeout(timeout);
        reject(new Error(`Vite process exited with code ${code} before port was detected`));
      }
    });
  });
}

async function updatePackageJson() {
  // Read package.json
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Find an available port
  const port = await findAvailablePort(3000);
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

// Function to run in development mode
async function runDevelopment() {
  try {
    // Find an available port
    const startPort = 3000;
    const port = await findAvailablePort(startPort);
    
    if (!port) {
      console.error('No available ports found. Please close some applications and try again.');
      process.exit(1);
    }
    
    console.log(`Found available port: ${port}`);
    
    // Start Vite on the available port
    const { port: actualPort, process: viteProcess } = await detectVitePort(port);
    
    console.log(`Starting Electron with ELECTRON_PORT=${actualPort}`);
    
    // Start Electron with the correct port
    const electronProcess = spawn('electron', ['electron/main.cjs'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        ELECTRON_PORT: actualPort.toString()
      }
    });
    
    // Handle process termination
    const cleanup = () => {
      console.log('Terminating processes...');
      if (viteProcess) viteProcess.kill();
      if (electronProcess) electronProcess.kill();
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    electronProcess.on('exit', () => {
      console.log('Electron process exited, cleaning up...');
      cleanup();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error running in development mode:', error);
    process.exit(1);
  }
}

// Execute this script directly
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('run')) {
    console.log('Running in development mode...');
    runDevelopment().catch(console.error);
  } else {
    console.log('Updating package.json...');
    updatePackageJson().catch(console.error);
  }
}

module.exports = { findAvailablePort, detectVitePort, runDevelopment };

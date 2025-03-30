
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync, spawn } = require('child_process');

// Fixed port for Vite - changed to 8080
const VITE_PORT = 8080;

// Function to run in development mode
async function runDevelopment() {
  try {
    console.log(`Starting Vite on port ${VITE_PORT}...`);
    
    // Start Vite on the fixed port with host option to listen on all interfaces
    const viteProcess = spawn('npx', ['vite', `--port=${VITE_PORT}`, '--host', '--strictPort'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        VITE_PORT: VITE_PORT.toString()
      }
    });
    
    // Wait a moment for Vite to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if the server is actually running
    try {
      const response = await fetch(`http://localhost:${VITE_PORT}`);
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      console.log(`Vite server is running and responding on port ${VITE_PORT}`);
    } catch (err) {
      console.warn(`Warning: Could not connect to Vite server: ${err.message}`);
      console.log('Continuing anyway as server might still be starting...');
    }
    
    console.log(`Starting Electron with port=${VITE_PORT} and trace warnings enabled`);
    
    // Start Electron with the correct port and trace warnings enabled
    const electronProcess = spawn('electron', ['--trace-warnings', 'electron/main.cjs'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        VITE_PORT: VITE_PORT.toString()
      }
    });
    
    // Handle process termination
    const cleanup = () => {
      console.log('Terminating processes...');
      if (viteProcess && !viteProcess.killed) viteProcess.kill();
      if (electronProcess && !electronProcess.killed) electronProcess.kill();
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    electronProcess.on('exit', (code) => {
      console.log(`Electron process exited with code ${code}, cleaning up...`);
      cleanup();
      process.exit(code || 0);
    });
    
  } catch (error) {
    console.error('Error running in development mode:', error);
    process.exit(1);
  }
}

async function updatePackageJson() {
  // Read package.json
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  console.log(`Using fixed port ${VITE_PORT} for Electron development`);

  // Add electron scripts with fixed port configuration and trace warnings
  packageJson.scripts = {
    ...packageJson.scripts,
    "electron:dev": `concurrently "cross-env NODE_ENV=development VITE_PORT=${VITE_PORT} npm run dev -- --host --port=${VITE_PORT} --strictPort" "wait-on http-get://localhost:${VITE_PORT} && cross-env NODE_ENV=development VITE_PORT=${VITE_PORT} electron --trace-warnings electron/main.cjs"`,
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
  console.log(`Electron will connect to port ${VITE_PORT}`);
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

module.exports = { runDevelopment };

import fs from 'fs';
import { exec } from 'child_process';
import { executeCommand, findAvailablePort} from '../../utils/index.js';

export async function serveClonedWebsite(outputDir = '', port = 8080) {
  try {
    // Check if directory exists
    if (!fs.existsSync(outputDir)) {
      return `Error: Directory ${outputDir} does not exist. Please clone a website first.`;
    }
    
    // Check if port is available, if not find next available port
    const availablePort = await findAvailablePort(port);
    
    // Start HTTP server
    const command = `http-server "${outputDir}" -p ${availablePort} -c-1 --cors`;
    
    return new Promise((resolve) => {
      const serverProcess = exec(command, (error, stdout, stderr) => {
        if (error) {
          resolve(`Error starting server: ${error.message}`);
        }
      });
      
      // Wait a bit for server to start
      setTimeout(() => {
        const portMessage = availablePort !== port ? 
          `(Port ${port} was busy, using ${availablePort} instead)` : '';
        
        resolve(`HTTP server started successfully! ${portMessage}
📡 Server running at: http://localhost:${availablePort}
📁 Serving directory: ${outputDir}
🌐 You can now view the cloned website in your browser.

To stop the server, press Ctrl+C in the terminal.`);
      }, 2000);
    });
  } catch (error) {
    return `Error serving website: ${error.message}`;
  }
}


export async function openWebsiteInBrowser(url = 'http://localhost:8080') {
  try {
    const openCommand = process.platform === 'darwin' ? 'open' : 
                      process.platform === 'win32' ? 'start' : 'xdg-open';
    
    await executeCommand(`${openCommand} ${url}`);
    return `Opened ${url} in your default browser.`;
  } catch (error) {
    return `Error opening browser: ${error.message}`;
  }
}

export async function checkHttpServerInstalled() {
  try {
    const result = await executeCommand('http-server --version');
    return `http-server is installed: ${result.trim()}`;
  } catch (error) {
    return `http-server is not installed. Please install it using: npm install -g http-server`;
  }
}
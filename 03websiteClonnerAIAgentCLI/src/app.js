import { exec } from 'child_process';
import { processWebsite } from './tools/websiteClonner/websiteClonner.js';
import path from 'path';
import fs from 'fs';

async function executeCommand(cmd = '') {
  return new Promise((res, rej) => {
    exec(cmd, (error, data) => {
      if (error) {
        return res(`Error running command: ${error.message}`);
      } else {
        res(data);
      }
    });
  });
}

async function cloneWebsite(websiteUrl = '', outputDir = '', maxPages = 5) {
  try {
    // Validate URL
    new URL(websiteUrl);
    
    // Set default output directory if not provided
    if (!outputDir) {
      const urlObj = new URL(websiteUrl);
      const domain = urlObj.hostname.replace(/\./g, '_');
      outputDir = `./cloned_${domain}`;
    }
    
    console.log(`Starting to clone ${websiteUrl} to ${outputDir} with max ${maxPages} pages...`);
    
    // Use the existing processWebsite function
    await processWebsite(websiteUrl, maxPages, outputDir);
    
    return `Successfully cloned ${websiteUrl} to ${outputDir}. You can now serve it using http-server.`;
  } catch (error) {
    return `Error cloning website: ${error.message}`;
  }
}

async function serveClonedWebsite(outputDir = '', port = 8080) {
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

async function findAvailablePort(startPort = 8080) {
  const net = await import('net');
  
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', () => {
      // Port is busy, try next one
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

async function openWebsiteInBrowser(url = 'http://localhost:8080') {
  try {
    const openCommand = process.platform === 'darwin' ? 'open' : 
                      process.platform === 'win32' ? 'start' : 'xdg-open';
    
    await executeCommand(`${openCommand} ${url}`);
    return `Opened ${url} in your default browser.`;
  } catch (error) {
    return `Error opening browser: ${error.message}`;
  }
}

async function checkHttpServerInstalled() {
  try {
    const result = await executeCommand('http-server --version');
    return `http-server is installed: ${result.trim()}`;
  } catch (error) {
    return `http-server is not installed. Please install it using: npm install -g http-server`;
  }
}

async function listClonedWebsites() {
  try {
    const currentDir = process.cwd();
    const items = fs.readdirSync(currentDir);
    const clonedDirs = items.filter(item => {
      const fullPath = path.join(currentDir, item);
      return fs.statSync(fullPath).isDirectory() && item.startsWith('cloned_');
    });
    
    if (clonedDirs.length === 0) {
      return 'No cloned websites found in the current directory.';
    }
    
    return `Found ${clonedDirs.length} cloned websites:\n${clonedDirs.map(dir => `- ${dir}`).join('\n')}`;
  } catch (error) {
    return `Error listing cloned websites: ${error.message}`;
  }
}

const TOOL_MAP = {
  executeCommand: executeCommand,
  cloneWebsite: cloneWebsite,
  serveClonedWebsite: serveClonedWebsite,
  openWebsiteInBrowser: openWebsiteInBrowser,
  checkHttpServerInstalled: checkHttpServerInstalled,
  listClonedWebsites: listClonedWebsites,
  findAvailablePort: findAvailablePort,
};

async function main(aiClient, modelName) {
  const SYSTEM_PROMPT = `
    You are an AI assistant specialized in website cloning and local development server management.
    You work on START, THINK and OUTPUT format. For a given user query, first think and breakdown 
    the problem into sub problems. You should always keep thinking before giving the actual output.
    
    Also, before outputting the final result to user you must check once if everything is correct.
    You have access to tools that can help clone websites and serve them locally.
    
    For every tool call that you make, wait for the OBSERVATION from the tool which is the
    response from the tool that you called.

    Available Tools:
    - executeCommand(command: string): Takes a linux / unix command as arg and executes the command on user's machine and returns the output
    - cloneWebsite(websiteUrl: string, outputDir?: string, maxPages?: number): Clones a website to local directory. If outputDir not provided, creates cloned_[domain] folder. Default maxPages is 5.
    - serveClonedWebsite(outputDir: string, port?: number): Starts an HTTP server to serve a cloned website. Default port is 8080. Automatically finds available port if requested port is busy.
    - openWebsiteInBrowser(url?: string): Opens a URL in the default browser. Default is http://localhost:8080
    - checkHttpServerInstalled(): Checks if http-server is installed globally
    - listClonedWebsites(): Lists all cloned websites in the current directory
    - findAvailablePort(startPort?: number): Finds an available port starting from the given port number

    Tool Input Formats:
    For single argument tools:
    - Use: "input": "single_value"
    
    For multiple argument tools, you can use either:
    1. JSON array format: "input": "[\"arg1\", \"arg2\", \"arg3\"]"
    2. Comma-separated format: "input": "arg1, arg2, arg3"
    
    Examples:
    - cloneWebsite with just URL: "input": "https://hitesh.ai"
    - cloneWebsite with URL and output: "input": "[\"https://hitesh.ai\", \"./my-clone\"]"
    - cloneWebsite with all args: "input": "[\"https://hitesh.ai\", \"./my-clone\", \"10\"]"
    - serveClonedWebsite with port: "input": "[\"./cloned_site\", \"3000\"]"

    Website Cloning Workflow:
    1. First check if http-server is installed
    2. Clone the website using cloneWebsite tool
    3. Serve the cloned website using serveClonedWebsite tool
    4. Optionally open the website in browser using openWebsiteInBrowser tool

    Rules:
    - Strictly follow the output JSON format
    - Always follow the output in sequence that is START, THINK, OBSERVE and OUTPUT.
    - Always perform only one step at a time and wait for other step.
    - Always make sure to do multiple steps of thinking before giving out output.
    - For every tool call always wait for the OBSERVE which contains the output from tool
    - When cloning websites, be helpful and suggest serving the website after cloning
    - Always provide clear instructions and next steps to the user
    - Use JSON array format for multiple arguments when possible

    Output JSON Format:
    { "step": "START | THINK | OUTPUT | OBSERVE | TOOL" , "content": "string", "tool_name": "string", "input": "string" }

    Examples:
    
    Example 1 - Basic cloning:
    User: Clone hitesh.ai and show it to me
    ASSISTANT: { "step": "START", "content": "The user wants to clone hitesh.ai website and view it locally" } 
    ASSISTANT: { "step": "THINK", "content": "I need to first check if http-server is installed, then clone the website, serve it, and open it in browser" } 
    ASSISTANT: { "step": "TOOL", "input": "", "tool_name": "checkHttpServerInstalled" }
    DEVELOPER: { "step": "OBSERVE", "content": "http-server is installed: 14.1.1" }
    ASSISTANT: { "step": "THINK", "content": "Great! http-server is installed. Now I can proceed to clone the website" }
    ASSISTANT: { "step": "TOOL", "input": "https://hitesh.ai", "tool_name": "cloneWebsite" }
    DEVELOPER: { "step": "OBSERVE", "content": "Successfully cloned https://hitesh.ai to ./cloned_hitesh_ai" }
    ASSISTANT: { "step": "THINK", "content": "Website cloned successfully. Now I should serve it on a local server" }
    ASSISTANT: { "step": "TOOL", "input": "./cloned_hitesh_ai", "tool_name": "serveClonedWebsite" }
    DEVELOPER: { "step": "OBSERVE", "content": "HTTP server started at http://localhost:8080" }
    ASSISTANT: { "step": "THINK", "content": "Server is running. Now I should open it in the browser for the user" }
    ASSISTANT: { "step": "TOOL", "input": "http://localhost:8080", "tool_name": "openWebsiteInBrowser" }
    DEVELOPER: { "step": "OBSERVE", "content": "Opened http://localhost:8080 in your default browser" }
    ASSISTANT: { "step": "OUTPUT", "content": "Perfect! I've successfully cloned hitesh.ai and it's now running locally. The website has been opened in your browser at http://localhost:8080. You can explore the cloned website offline! 🚀" }
    
    Example 2 - Custom output and pages:
    User: Clone piyushgarg.dev with 15 pages to ./piyush-site
    ASSISTANT: { "step": "START", "content": "The user wants to clone piyushgarg.dev with 15 pages to a custom directory" }
    ASSISTANT: { "step": "THINK", "content": "I need to use the cloneWebsite tool with all three parameters: URL, output directory, and max pages" }
    ASSISTANT: { "step": "TOOL", "input": "[\"https://piyushgarg.dev\", \"./piyush-site\", \"15\"]", "tool_name": "cloneWebsite" }
    DEVELOPER: { "step": "OBSERVE", "content": "Successfully cloned https://piyushgarg.dev to ./piyush-site with 15 pages" }
    ASSISTANT: { "step": "OUTPUT", "content": "Successfully cloned piyushgarg.dev with 15 pages to ./piyush-site! You can now serve it using the serveClonedWebsite tool." }
    
    Example 3 - Port conflict handling:
    User: Serve my cloned website on port 8080
    ASSISTANT: { "step": "START", "content": "The user wants to serve a cloned website on port 8080" }
    ASSISTANT: { "step": "THINK", "content": "I need to first check what cloned websites are available" }
    ASSISTANT: { "step": "TOOL", "input": "", "tool_name": "listClonedWebsites" }
    DEVELOPER: { "step": "OBSERVE", "content": "Found 1 cloned websites:\n- cloned_hitesh_ai" }
    ASSISTANT: { "step": "THINK", "content": "I found cloned_hitesh_ai. Now I'll serve it on port 8080. The serveClonedWebsite function will automatically handle port conflicts." }
    ASSISTANT: { "step": "TOOL", "input": "[\"./cloned_hitesh_ai\", \"8080\"]", "tool_name": "serveClonedWebsite" }
    DEVELOPER: { "step": "OBSERVE", "content": "HTTP server started successfully! (Port 8080 was busy, using 8081 instead)\n📡 Server running at: http://localhost:8081\n📁 Serving directory: ./cloned_hitesh_ai" }
    ASSISTANT: { "step": "THINK", "content": "Great! The server started successfully. Port 8080 was busy so it automatically used 8081. Now I should open it in the browser." }
    ASSISTANT: { "step": "TOOL", "input": "http://localhost:8081", "tool_name": "openWebsiteInBrowser" }
    DEVELOPER: { "step": "OBSERVE", "content": "Opened http://localhost:8081 in your default browser" }
    ASSISTANT: { "step": "OUTPUT", "content": "Perfect! Your cloned website is now running on http://localhost:8081 (port 8080 was busy, so I used the next available port). The website has been opened in your browser! 🚀" }
  `;

  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('🤖 Website Cloning AI Assistant Ready!');
  console.log('💡 You can ask me to clone any website and serve it locally.');
  console.log('📝 Examples:');
  console.log('   - "Clone hitesh.ai and show it to me"');
  console.log('   - "Clone piyushgarg.dev with 10 pages"');
  console.log('   - "List my cloned websites"');
  console.log('   - "Serve my cloned website from ./cloned_example_com"');
  console.log('');

  while (true) {
    const userInput = await new Promise((resolve) => {
      rl.question('👤 You: ', resolve);
    });

    if (userInput.toLowerCase() === 'exit' || userInput.toLowerCase() === 'quit') {
      console.log('👋 Goodbye!');
      rl.close();
      break;
    }

    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: userInput,
      },
    ];

    try {
      while (true) {
    // Use the AI to generate the website cloning agent response
    const response = await aiClient.chat.completions.create({
      model: modelName,
      messages: messages,
    });        const rawContent = response.choices[0].message.content;
        const parsedContent = JSON.parse(rawContent);

        messages.push({
          role: 'assistant',
          content: JSON.stringify(parsedContent),
        });

        if (parsedContent.step === 'START') {
          console.log(`🔥 ${parsedContent.content}`);
          continue;
        }

        if (parsedContent.step === 'THINK') {
          console.log(`\t🧠 ${parsedContent.content}`);
          continue;
        }

        if (parsedContent.step === 'TOOL') {
          const toolToCall = parsedContent.tool_name;
          if (!TOOL_MAP[toolToCall]) {
            messages.push({
              role: 'developer',
              content: `There is no such tool as ${toolToCall}`,
            });
            continue;
          }

          let toolInput = parsedContent.input || '';
          console.log(`🛠️ ${toolToCall}(${toolInput})`);
          
          // Handle multiple arguments by parsing JSON array or comma-separated values
          let responseFromTool;
          try {
            // Try to parse as JSON array first
            const parsedInput = JSON.parse(toolInput);
            if (Array.isArray(parsedInput)) {
              responseFromTool = await TOOL_MAP[toolToCall](...parsedInput);
            } else {
              responseFromTool = await TOOL_MAP[toolToCall](parsedInput);
            }
          } catch (jsonError) {
            // If not valid JSON, try comma-separated values for multi-argument functions
            if (toolToCall === 'cloneWebsite' && toolInput.includes(',')) {
              const args = toolInput.split(',').map(arg => arg.trim());
              responseFromTool = await TOOL_MAP[toolToCall](
                args[0] || '', // websiteUrl
                args[1] || '', // outputDir
                parseInt(args[2]) || 5 // maxPages
              );
            } else if (toolToCall === 'serveClonedWebsite' && toolInput.includes(',')) {
              const args = toolInput.split(',').map(arg => arg.trim());
              responseFromTool = await TOOL_MAP[toolToCall](
                args[0] || '', // outputDir
                parseInt(args[1]) || 8080 // port
              );
            } else {
              // Single argument
              responseFromTool = await TOOL_MAP[toolToCall](toolInput);
            }
          }
          
          console.log(`📋 Result: ${responseFromTool}`);
          
          messages.push({
            role: 'developer',
            content: JSON.stringify({ step: 'OBSERVE', content: responseFromTool }),
          });
          continue;
        }

        if (parsedContent.step === 'OUTPUT') {
          console.log(`🤖 ${parsedContent.content}`);
          console.log('');
          break;
        }
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      console.log('');
    }
  }
}

// Export the main function for use in the CLI
export { main };
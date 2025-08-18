# Website Cloner AI Agent CLI

A powerful CLI tool that uses AI to clone websites for offline viewing with an intelligent conversational interface.

## Features

- 🤖 **AI-Powered**: Choose between OpenAI (GPT-4o-mini) or Google Gemini (gemini-2.5-pro)
- 🌐 **Website Cloning**: Download entire websites with assets and dependencies
- 🔧 **Smart Tools**: AI can use various tools to clone, serve, and manage websites
- 💬 **Conversational Interface**: Natural language commands to interact with the AI
- 🚀 **Local Server**: Automatically serve cloned websites on localhost
- 📁 **Directory Management**: Organized file structure for cloned websites

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 03websiteClonnerAIAgentCLI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (Optional)
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

## Usage

### Start the CLI Tool

```bash
node index.js
# or
npm start
```

### Choose Your AI Provider

When you start the tool, you'll be prompted to choose:
1. **OpenAI (GPT-4o-mini)** - Requires OpenAI API key
2. **Google Gemini (gemini-2.5-pro)** - Requires Google API key

### Example Commands

Once the AI assistant is running, you can use natural language commands:

```
👤 You: Clone piyushgarg.dev and show it to me
👤 You: Clone hitesh.ai with 10 pages
👤 You: List my cloned websites
👤 You: Serve my cloned website from ./cloned_example_com
👤 You: Clone google.com to ./my_websites directory
```

## Available Tools

The AI has access to these tools:

- **`cloneWebsite(url, outputDir, maxPages)`** - Clone a website to a directory
- **`serveClonedWebsite(outputDir, port)`** - Serve a cloned website on localhost
- **`listClonedWebsites(directory)`** - List all cloned websites in a directory
- **`checkUrlAccessibility(url)`** - Check if a URL is accessible

## API Keys

### Option 1: Environment Variables
Create a `.env` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### Option 2: Interactive Input
If no API key is found in environment variables, the CLI will prompt you to enter it when you start the tool.

## Configuration

You can customize the behavior by setting these environment variables:

```env
# Optional: Set different models
OPENAI_MODEL=gpt-4o-mini
GEMINI_MODEL=gemini-2.5-pro

# Optional: Set custom timeout for website cloning (in milliseconds)
CLONE_TIMEOUT=60000

# Optional: Set default port for HTTP server
DEFAULT_PORT=8080
```

## How It Works

1. **AI Provider Selection**: Choose between OpenAI or Gemini using their OpenAI-compatible APIs
2. **Agentic AI Pattern**: The AI follows a structured thinking process:
   - **START**: Analyzes your request
   - **THINK**: Plans the approach
   - **TOOL**: Executes necessary tools
   - **OBSERVE**: Reviews tool results
   - **OUTPUT**: Provides final response
3. **Tool Execution**: AI automatically calls the appropriate tools to fulfill your request
4. **Conversational Loop**: Continues until you type 'exit' or 'quit'

## Examples

### Basic Website Cloning
```
👤 You: Clone example.com
🧠 I'll help you clone example.com website...
🛠️ cloneWebsite(example.com)
📋 Result: Successfully cloned website to ./cloned_example_com
🛠️ serveClonedWebsite(./cloned_example_com, 8080)
📋 Result: Server started at http://localhost:8080
🤖 I've successfully cloned example.com and it's now available at http://localhost:8080
```

### Advanced Options
```
👤 You: Clone piyushgarg.dev with 15 pages to ./my_sites directory
🧠 I'll clone piyushgarg.dev with 15 pages to the specified directory...
🛠️ cloneWebsite(piyushgarg.dev, ./my_sites/cloned_piyushgarg_dev, 15)
📋 Result: Successfully cloned 15 pages to ./my_sites/cloned_piyushgarg_dev
🤖 Successfully cloned piyushgarg.dev with 15 pages to ./my_sites/cloned_piyushgarg_dev
```

## Troubleshooting

- **API Key Issues**: Make sure your API key is valid and has sufficient credits
- **Network Issues**: Check your internet connection and ensure the target website is accessible
- **Port Conflicts**: The tool automatically finds available ports if the default is in use
- **Large Websites**: Use the `maxPages` parameter to limit the scope of cloning

## Exit

To exit the CLI tool, type:
- `exit`
- `quit`
- `bye`
- Press `Ctrl+C`

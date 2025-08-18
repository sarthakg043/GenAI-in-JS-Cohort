# Next.js Website Cloner CLI 🚀

A powerful command-line tool to clone Next.js websites for offline viewing. This advanced tool downloads HTML pages, JavaScript chunks, CSS files, fonts, and images with complete dependency resolution.

## ✨ Features

- **Complete Next.js Support** - Handles webpack chunks, CSS, fonts, and static assets
- **Intelligent Directory Structure** - Preserves Next.js `_next/static/` folder organization
- **Recursive Chunk Discovery** - Automatically finds and downloads missing JavaScript dependencies
- **Multiple Discovery Methods** - Uses regex patterns, directory listing, and build manifests
- **Asset Optimization** - Downloads Next.js optimized images and fonts
- **Background Image Support** - Extracts and downloads CSS background images
- **Configurable Output** - Custom output directories and page limits
- **Local Server Integration** - Automatically serves cloned websites
- **🤖 AI Agent Interface** - Conversational AI assistant for website cloning

## 🛠️ Installation

### Step 1: Prerequisites
Make sure you have Node.js installed (version 14 or higher):
```bash
node --version
npm --version
```

### Step 2: Clone the Repository
```bash
git clone <repository-url>
cd 03websiteClonnerAIAgentCLI
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Install Global HTTP Server (for serving cloned sites)
```bash
npm install -g http-server
```

### Step 5: Setup Environment Variables (for AI Agent)
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

## 🚀 Usage

### 🤖 AI Agent Mode (Recommended)
The AI agent provides a conversational interface for website cloning:

```bash
npm run start:ai
```

**Example conversations:**
```
👤 You: Clone hitesh.ai and show it to me
🤖 AI: I'll clone hitesh.ai, serve it locally, and open it in your browser!

👤 You: Clone piyushgarg.dev with 10 pages to ./piyush-site
🤖 AI: I'll clone piyushgarg.dev with 10 pages to your custom directory!

👤 You: List my cloned websites
🤖 AI: Here are all your cloned websites...

👤 You: Serve my cloned website from ./cloned_hitesh_ai
🤖 AI: Starting HTTP server for your cloned website...
```

### 📋 Manual CLI Mode
For direct command-line usage:

```bash
node src/tools/websiteClonner/index.js <website-url> [output-path] [max-pages]
```

### Arguments
- `website-url` (required): The URL of the website to clone
- `output-path` (optional): Custom output directory (default: "./output")
- `max-pages` (optional): Maximum number of pages to clone (default: 5)

## 📝 Examples

### Example 1: Clone Hitesh Choudhary's Website
```bash
# Basic clone with defaults
node src/tools/websiteClonner/index.js https://hitesh.ai

# Custom output directory
node src/tools/websiteClonner/index.js https://hitesh.ai ./hitesh-clone

# Custom output and page limit
node src/tools/websiteClonner/index.js https://hitesh.ai ./hitesh-clone 10
```

### Example 2: Clone Piyush Garg's Website
```bash
# Basic clone with defaults
node src/tools/websiteClonner/index.js https://piyushgarg.dev

# Custom output directory
node src/tools/websiteClonner/index.js https://piyushgarg.dev ./piyush-clone

# Custom output and page limit
node src/tools/websiteClonner/index.js https://piyushgarg.dev ./piyush-clone 8
```

### Example 3: Other Websites
```bash
# Clone any Next.js website
node src/tools/websiteClonner/index.js https://nextjs.org ./nextjs-clone 5

# Clone with default output folder
node src/tools/websiteClonner/index.js https://vercel.com
```

## 🌐 Serving Cloned Websites

After cloning, serve the website locally to view it:

```bash
# Navigate to the cloned directory
cd ./cloned_hitesh_ai  # or your custom output directory

# Serve with http-server
http-server . -p 8080 -c-1

# Or serve from parent directory
http-server ./cloned_hitesh_ai -p 8080 -c-1
```

Then open your browser and go to `http://localhost:8080`

## 🔧 Advanced Methods

### 1. Regex-Based Chunk Discovery
- Scans JavaScript content for `/_next/static/chunks/` references
- Handles webpack chunk IDs and dynamic imports
- Preserves nested directory structure (e.g., `app/`, `pages/`)

### 2. Directory Listing Discovery
- Attempts to browse server directories directly
- Downloads entire static folders when possible
- Discovers files not referenced in HTML

### 3. Build Manifest Discovery
- Fetches Next.js build manifests (`build-manifest.json`)
- Downloads all chunks listed in webpack manifests
- Ensures complete dependency coverage

### 4. Recursive Dependency Resolution
- Analyzes downloaded chunks for additional references
- Continues until all dependencies are satisfied
- Prevents duplicate downloads with intelligent tracking

## 📁 Output Structure

The tool creates a comprehensive directory structure:

```
cloned_hitesh_ai/
├── index.html                 # Main HTML files
├── about.html
├── contact.html
├── _next/
│   └── static/
│       ├── chunks/           # JavaScript chunks
│       │   ├── main-app.js
│       │   ├── webpack.js
│       │   └── app/          # Nested chunk directories
│       │       └── page.js
│       ├── css/              # Stylesheets
│       │   └── styles.css
│       └── media/            # Fonts and static assets
│           ├── font.woff2
│           └── images.jpg
├── images/                   # Regular images
│   ├── logo.png
│   └── banner.jpg
└── js/                       # Non-Next.js scripts
    └── analytics.js
```

## 🎯 What Gets Downloaded

### ✅ Fully Supported Assets
- HTML pages with preserved structure
- JavaScript chunks (with dependency resolution)
- CSS files (with background image extraction)
- Fonts (WOFF, WOFF2, TTF, OTF)
- Images (PNG, JPG, SVG, WebP)
- Next.js optimized images
- Webpack runtime files
- Dynamic imports and lazy-loaded chunks

### 🔄 Advanced Processing
- **CSS Background Images** - Extracted and downloaded from stylesheets
- **Next.js Image API** - Handles `/_next/image?url=...` optimization
- **Preload Links** - Downloads preloaded fonts and scripts
- **Chunk Dependencies** - Recursive discovery of referenced chunks
- **Directory Preservation** - Maintains original folder structure

## ⚙️ Configuration Options

### Environment Variables
```bash
# Set custom timeout (default: 30 seconds)
export CLONE_TIMEOUT=60000

# Enable debug logging
export DEBUG=true
```

### Command Line Flags
```bash
# Show help
node src/tools/websiteClonner/index.js --help

# Get version info
node src/tools/websiteClonner/index.js --version
```

## 🚨 Troubleshooting

### Common Issues

1. **Missing Chunks**: The tool now uses multiple discovery methods to find all chunks
2. **Network Timeouts**: Increase timeout or check internet connection
3. **Permission Errors**: Ensure write permissions in output directory
4. **Large Websites**: Use smaller page limits for better performance

### Debug Information
The tool provides detailed logging:
- Asset discovery progress
- Download success/failure status
- Chunk reference scanning results
- Directory creation notifications

## 🏗️ Technical Architecture

### Core Technologies
- **Node.js** with ES Modules
- **Axios** for HTTP requests with retry logic
- **Cheerio** for HTML parsing and manipulation
- **File System** operations with recursive directory creation

### Key Algorithms
1. **Multi-Pattern Regex Scanning** - 5 different patterns for chunk detection
2. **Queue-Based Processing** - Efficient handling of recursive dependencies
3. **Duplicate Prevention** - Set-based tracking of downloaded assets
4. **Error Recovery** - Graceful handling of failed downloads

## 📊 Performance

- **Concurrent Downloads** - Parallel processing of multiple assets
- **Memory Efficient** - Streams large files without loading into memory
- **Bandwidth Optimized** - Conditional downloads based on file existence
- **Progress Tracking** - Real-time status updates during cloning

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source. Feel free to use and modify as needed.

## 🔗 Related Projects

- [Next.js](https://nextjs.org/) - The React framework being cloned
- [Webpack](https://webpack.js.org/) - Module bundler used by Next.js
- [http-server](https://www.npmjs.com/package/http-server) - Simple HTTP server for serving cloned sites

---

**Happy Cloning! 🎉** 

For issues or feature requests, please open an issue in the repository.

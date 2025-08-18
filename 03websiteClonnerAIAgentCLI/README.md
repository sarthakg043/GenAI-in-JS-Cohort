# Website Cloner CLI

A command-line tool to clone websites for offline viewing. This tool downloads HTML pages and associated images, creating a local copy of the website that can be viewed offline.

## Features

- Clone websites with a single command
- Download and save images locally
- Convert relative URLs to local paths
- Command-line argument support
- Configurable number of pages to clone
- Proper error handling and logging

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Basic Usage
```bash
node index.js <website-url> [max-pages]
```

### Examples

1. Clone a website with default settings (max 5 pages):
   ```bash
   node index.js https://www.example.com
   ```

2. Clone a website with a specific number of pages:
   ```bash
   node index.js https://www.example.com 10
   ```

3. Show help:
   ```bash
   node index.js --help
   ```

### Arguments

- `website-url` (required): The URL of the website to clone
- `max-pages` (optional): Maximum number of pages to clone (default: 5)

### Options

- `--help`, `-h`: Show help message

## Output

The tool creates a directory named `cloned_[domain_name]` containing:

- HTML files for each cloned page
- An `images` directory with downloaded images
- Local references to images in the HTML files

## Example Output Structure

```
cloned_example_com/
├── www.example.com.html
├── www.example.com_about.html
└── images/
    ├── logo.png
    ├── banner.jpg
    └── ...
```

## Technical Details

- Built with Node.js and ES modules
- Uses Axios for HTTP requests
- Uses Cheerio for HTML parsing
- Automatically adds proper User-Agent headers
- Handles relative and absolute URLs
- Downloads images asynchronously
- Creates necessary directories automatically

## Error Handling

- Network timeouts (30 seconds)
- Invalid URLs
- Image download failures
- Connection errors

## Limitations

- Only clones pages from the same domain
- CSS files are not downloaded (external CSS links remain)
- JavaScript functionality may not work offline
- Some modern websites with heavy JavaScript may not clone properly

## Contributing

Feel free to submit issues and pull requests to improve the tool.

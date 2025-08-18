#!/usr/bin/env node

import { processWebsite } from './websiteClonner.js';

// Function to display usage information
const showUsage = () => {
    console.log(`
Website Cloner CLI

Usage:
  node index.js <website-url> [output-path] [max-pages]

Arguments:
  website-url    The URL of the website to clone (required)
  output-path    Output directory path (optional, default: "./output")
  max-pages      Maximum number of pages to clone (optional, default: 5)

Examples:
  node index.js https://www.example.com
  node index.js https://www.example.com ./my-clone
  node index.js https://www.example.com ./my-clone 10

Options:
  --help, -h     Show this help message
    `);
};

// Main function
const main = async () => {
    const args = process.argv.slice(2);
    
    // Check for help flag
    if (args.includes('--help') || args.includes('-h') || args.length === 0) {
        showUsage();
        process.exit(0);
    }
    
    const url = args[0];
    const outputPath = args[1] || "./output";
    const maxPages = parseInt(args[2]) || 5;
    
    // Validate URL
    try {
        new URL(url);
    } catch (error) {
        console.error('Error: Invalid URL provided');
        console.error('Please provide a valid URL starting with http:// or https://');
        process.exit(1);
    }
    
    console.log(`Cloning website: ${url}`);
    console.log(`Output path: ${outputPath}`);
    console.log(`Maximum pages to clone: ${maxPages}`);
    console.log('Starting...\n');
    
    try {
        await processWebsite(url, maxPages, outputPath);
    } catch (error) {
        console.error('Error occurred during website cloning:', error.message);
        process.exit(1);
    }
};
main()

export default main;
export { processWebsite }

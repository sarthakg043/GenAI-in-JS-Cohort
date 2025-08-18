#!/usr/bin/env node

import { processWebsite } from './websiteClonner.js';

// Function to display usage information
const showUsage = () => {
    console.log(`
Website Cloner CLI

Usage:
  node index.js <website-url> [max-pages]

Arguments:
  website-url    The URL of the website to clone (required)
  max-pages      Maximum number of pages to clone (optional, default: 5)

Examples:
  node index.js https://www.example.com
  node index.js https://www.example.com 10

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
    const maxPages = parseInt(args[1]) || 5;
    
    // Validate URL
    try {
        new URL(url);
    } catch (error) {
        console.error('Error: Invalid URL provided');
        console.error('Please provide a valid URL starting with http:// or https://');
        process.exit(1);
    }
    
    console.log(`Cloning website: ${url}`);
    console.log(`Maximum pages to clone: ${maxPages}`);
    console.log('Starting...\n');
    
    try {
        await processWebsite(url, maxPages);
    } catch (error) {
        console.error('Error occurred during website cloning:', error.message);
        process.exit(1);
    }
};
main()

export default main;
export { processWebsite }

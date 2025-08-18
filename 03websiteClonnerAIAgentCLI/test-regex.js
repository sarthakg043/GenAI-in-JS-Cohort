// Test the regex patterns for chunk detection

const testContent = `
// Test case 1: Direct path references
"/_next/static/chunks/522.6349e625adea0bc2.js"
"/_next/static/chunks/app/page-3cdefee23f76ef23.js"

// Test case 2: Webpack chunk mappings
{522:"522.6349e625adea0bc2.js", 123:"app/page-3cdefee23f76ef23.js"}

// Test case 3: Import statements
import("/_next/static/chunks/app/page-3cdefee23f76ef23.js")

// Test case 4: Array references
["522.6349e625adea0bc2.js", "app/page-3cdefee23f76ef23.js"]

// Test case 5: Complex webpack output
{app:{page:"app/page-3cdefee23f76ef23.js"}}
`;

const patterns = [
    // Pattern 1: Direct path references "/_next/static/chunks/..."
    /["'](\/_next\/static\/chunks\/[^"'\s]+\.js)["']/g,
    
    // Pattern 2: Without quotes /_next/static/chunks/...
    /\/_next\/static\/chunks\/[^\s"',;)}]+\.js/g,
    
    // Pattern 3: Webpack chunk ID references like {522:"app/page-abc.js"}
    /[{,]\s*(\d+)\s*:\s*["']([^"']*\.js)["']/g,
    
    // Pattern 4: Import statements
    /import\s*\(\s*["'](\/_next\/static\/chunks\/[^"']+\.js)["']\s*\)/g,
    
    // Pattern 5: Chunk names in arrays ["522.js", "app/page.js"]
    /["'](\d+\.[a-f0-9]+\.js|app\/[^"']+\.js|pages\/[^"']+\.js)["']/g
];

console.log('Testing regex patterns:\n');

patterns.forEach((pattern, index) => {
    console.log(`Pattern ${index + 1}:`);
    let match;
    pattern.lastIndex = 0; // Reset
    
    while ((match = pattern.exec(testContent)) !== null) {
        console.log(`  Found: ${match[0]}`);
        if (match[1]) console.log(`    Capture 1: ${match[1]}`);
        if (match[2]) console.log(`    Capture 2: ${match[2]}`);
    }
    
    pattern.lastIndex = 0; // Reset for next use
    console.log('');
});

import axios from 'axios';
import {load as cheerio} from 'cheerio';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Configure axios defaults
axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
axios.defaults.timeout = 30000; // 30 second timeout

const downloadImage = async (url, dest) => {
    try {
        // Create directory if it doesn't exist
        const dir = dest.substring(0, dest.lastIndexOf('/'));
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        const response = await axios.get(url, { 
            responseType: 'arraybuffer',
            timeout: 10000, // 10 second timeout
            headers: {
                'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });
        
        // Detect actual file type from response data
        const buffer = Buffer.from(response.data);
        let actualExtension = getFileExtension(url, response.headers['content-type'] || '');
        
        // Check magic bytes to determine actual format
        if (buffer.length >= 4) {
            const header = buffer.toString('hex', 0, 4);
            if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
                actualExtension = 'webp';
            } else if (header.startsWith('ffd8ff')) {
                actualExtension = 'jpg';
            } else if (header.startsWith('89504e47')) {
                actualExtension = 'png';
            } else if (header.startsWith('47494638')) {
                actualExtension = 'gif';
            }
        }
        
        // Update destination with correct extension
        const destWithCorrectExtension = dest.replace(/\.[^.]+$/, `.${actualExtension}`);
        
        fs.writeFileSync(destWithCorrectExtension, response.data);
        console.log(`✓ Image downloaded: ${destWithCorrectExtension}`);
        return destWithCorrectExtension;
    } catch (error) {
        console.error(`✗ Error downloading image from ${url}:`, error.message);
        return false;
    }
};

const downloadCSS = async (url, dest) => {
    try {
        // Create directory if it doesn't exist
        const dir = dest.substring(0, dest.lastIndexOf('/'));
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        const response = await axios.get(url, { 
            responseType: 'text',
            timeout: 10000,
            headers: {
                'Accept': 'text/css,*/*;q=0.1',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });
        
        fs.writeFileSync(dest, response.data, 'utf8');
        console.log(`✓ CSS downloaded: ${dest}`);
        return { success: true, content: response.data, originalUrl: url };
    } catch (error) {
        console.error(`✗ Error downloading CSS from ${url}:`, error.message);
        return { success: false };
    }
};

const processCSSBackgroundImages = async (cssContent, cssUrl, imagesDir, baseUrl) => {
    const imagePromises = [];
    const imageReplacements = new Map();
    
    // Regular expression to find background-image URLs
    const bgImageRegex = /background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/gi;
    let match;
    
    while ((match = bgImageRegex.exec(cssContent)) !== null) {
        let imageUrl = match[1];
        
        // Skip data URLs
        if (imageUrl.startsWith('data:')) continue;
        
        // Convert relative URLs to absolute
        if (imageUrl.startsWith('/')) {
            imageUrl = baseUrl + imageUrl;
        } else if (!imageUrl.startsWith('http')) {
            // Handle relative URLs based on CSS file location
            const cssBaseUrl = cssUrl.substring(0, cssUrl.lastIndexOf('/'));
            imageUrl = new URL(imageUrl, cssBaseUrl + '/').href;
        }
        
        console.log(`Found CSS background image: ${imageUrl}`);
        
        // Generate unique filename for the image
        const urlPath = imageUrl.split('?')[0];
        let imgName = urlPath.split('/').pop() || 'bg_image';
        imgName = imgName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const extension = getFileExtension(imageUrl);
        const baseName = imgName.replace(/\.[^.]*$/, '') || 'bg_image';
        const uniqueImgName = generateUniqueFilename(baseName, extension, imagesDir, imageUrl);
        
        const localPath = `../images/${uniqueImgName}`;
        
        // Store the mapping for later replacement
        imageReplacements.set(match[1], localPath);
        
        // Add download promise
        const downloadPromise = downloadImage(imageUrl, `${imagesDir}/${uniqueImgName}`)
            .then(actualPath => {
                if (actualPath && actualPath !== `${imagesDir}/${uniqueImgName}`) {
                    // Extension was corrected, update the mapping
                    const correctedLocalPath = actualPath.replace(imagesDir, '../images');
                    imageReplacements.set(match[1], correctedLocalPath);
                }
                return actualPath;
            });
        imagePromises.push(downloadPromise);
    }
    
    // Wait for all images to download
    if (imagePromises.length > 0) {
        console.log(`Downloading ${imagePromises.length} background images from CSS...`);
        await Promise.allSettled(imagePromises);
    }
    
    // Update CSS content with local image paths
    let updatedCssContent = cssContent;
    for (const [originalUrl, localPath] of imageReplacements) {
        const regex = new RegExp(`url\\(['"]?${originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]?\\)`, 'gi');
        updatedCssContent = updatedCssContent.replace(regex, `url('${localPath}')`);
    }
    
    return {
        updatedContent: updatedCssContent,
        imageCount: imagePromises.length
    };
};

const downloadJS = async (url, dest) => {
    try {
        // Create directory if it doesn't exist
        const dir = dest.substring(0, dest.lastIndexOf('/'));
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        const response = await axios.get(url, { 
            responseType: 'text',
            timeout: 10000,
            headers: {
                'Accept': 'application/javascript,text/javascript,*/*;q=0.1',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });
        
        fs.writeFileSync(dest, response.data, 'utf8');
        console.log(`✓ JavaScript downloaded: ${dest}`);
        return { success: true, content: response.data };
    } catch (error) {
        console.error(`✗ Error downloading JavaScript from ${url}:`, error.message);
        return { success: false, content: null };
    }
};

const downloadFont = async (url, dest) => {
    try {
        // Create directory if it doesn't exist
        const dir = dest.substring(0, dest.lastIndexOf('/'));
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        const response = await axios.get(url, { 
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
                'Accept': 'font/woff2,font/woff,font/truetype,*/*;q=0.1',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });
        
        fs.writeFileSync(dest, response.data);
        console.log(`✓ Font downloaded: ${dest}`);
        return true;
    } catch (error) {
        console.error(`✗ Error downloading font from ${url}:`, error.message);
        return false;
    }
};

// Function to discover files in a directory via HTTP
const discoverDirectoryFiles = async (directoryUrl, maxDepth = 2, currentDepth = 0) => {
    if (currentDepth >= maxDepth) return [];
    
    try {
        console.log(`Discovering files in: ${directoryUrl}`);
        const response = await axios.get(directoryUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            timeout: 30000,
            validateStatus: (status) => status < 500
        });
        
        if (response.status !== 200) {
            return [];
        }
        
        const $ = cheerio.load(response.data);
        const files = [];
        
        // Look for common directory listing patterns
        const linkSelectors = [
            'a[href]',           // Generic links
            'pre a[href]',       // Apache-style
            'table a[href]',     // Table-based listings
            '.file a[href]',     // Custom file listings
            '.directory a[href]' // Custom directory listings
        ];
        
        for (const selector of linkSelectors) {
            $(selector).each((_, element) => {
                const href = $(element).attr('href');
                if (href && !href.startsWith('?') && !href.startsWith('#') && 
                    href !== '../' && href !== './' && !href.startsWith('mailto:')) {
                    
                    let fullUrl;
                    if (href.startsWith('http')) {
                        fullUrl = href;
                    } else if (href.startsWith('/')) {
                        const urlObj = new URL(directoryUrl);
                        fullUrl = `${urlObj.protocol}//${urlObj.host}${href}`;
                    } else {
                        fullUrl = new URL(href, directoryUrl).href;
                    }
                    
                    // Determine if it's a file or directory
                    const isDirectory = href.endsWith('/') || (!href.includes('.') && !href.includes('?'));
                    
                    files.push({
                        url: fullUrl,
                        name: href,
                        isDirectory
                    });
                }
            });
            
            if (files.length > 0) break; // Found files with this selector
        }
        
        return files;
    } catch (error) {
        console.log(`Could not discover directory ${directoryUrl}: ${error.message}`);
        return [];
    }
};

// Function to recursively download all files from Next.js static directories
const downloadAllStaticFiles = async (baseUrl, outputDir) => {
    const staticDirectories = [
        '/_next/static/chunks/',
        '/_next/static/css/',
        '/_next/static/media/',
        '/_next/static/js/'
    ];
    
    const downloadedFiles = new Set();
    
    for (const staticDir of staticDirectories) {
        const dirUrl = baseUrl + staticDir;
        console.log(`\nExploring static directory: ${dirUrl}`);
        
        try {
            const files = await discoverDirectoryFiles(dirUrl);
            
            for (const file of files) {
                if (!file.isDirectory && !downloadedFiles.has(file.url)) {
                    downloadedFiles.add(file.url);
                    
                    // Determine file type and target directory
                    let targetDir, localPath;
                    const fileName = file.name.split('?')[0]; // Remove query params
                    
                    if (staticDir.includes('/chunks/')) {
                        targetDir = path.join(outputDir, '_next', 'static', 'chunks');
                        localPath = `/_next/static/chunks/${fileName}`;
                    } else if (staticDir.includes('/css/')) {
                        targetDir = path.join(outputDir, '_next', 'static', 'css');
                        localPath = `/_next/static/css/${fileName}`;
                    } else if (staticDir.includes('/media/')) {
                        targetDir = path.join(outputDir, '_next', 'static', 'media');
                        localPath = `/_next/static/media/${fileName}`;
                    } else if (staticDir.includes('/js/')) {
                        targetDir = path.join(outputDir, '_next', 'static', 'js');
                        localPath = `/_next/static/js/${fileName}`;
                    } else {
                        continue; // Skip unknown directories
                    }
                    
                    // Ensure target directory exists
                    if (!fs.existsSync(targetDir)) {
                        fs.mkdirSync(targetDir, { recursive: true });
                    }
                    
                    const fullPath = path.join(targetDir, fileName);
                    
                    // Download based on file type
                    if (fileName.endsWith('.js')) {
                        console.log(`Downloading JS: ${file.url} -> ${localPath}`);
                        await downloadJS(file.url, fullPath);
                    } else if (fileName.endsWith('.css')) {
                        console.log(`Downloading CSS: ${file.url} -> ${localPath}`);
                        await downloadCSS(file.url, fullPath);
                    } else {
                        console.log(`Downloading asset: ${file.url} -> ${localPath}`);
                        await downloadFile(file.url, fullPath);
                    }
                }
            }
        } catch (error) {
            console.warn(`Error exploring ${dirUrl}: ${error.message}`);
        }
    }
    
    return downloadedFiles.size;
};

// Function to download files from Next.js build manifest
const downloadFromBuildManifest = async (baseUrl, outputDir) => {
    const manifestPaths = [
        '/_next/static/chunks/webpack-runtime.js',
        '/_next/static/chunks/manifest.js',
        '/_next/build-manifest.json',
        '/_next/static/chunks/pages/_app.js',
        '/_next/static/chunks/pages/_document.js'
    ];
    
    const downloadedFiles = new Set();
    let manifestData = null;
    
    // Try to fetch build manifest
    for (const manifestPath of ['/_next/build-manifest.json', '/_next/static/manifest.json']) {
        try {
            const manifestUrl = baseUrl + manifestPath;
            console.log(`Trying to fetch build manifest: ${manifestUrl}`);
            
            const response = await axios.get(manifestUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                timeout: 30000,
                validateStatus: (status) => status < 500
            });
            
            if (response.status === 200) {
                manifestData = response.data;
                console.log('✓ Found build manifest');
                break;
            }
        } catch (error) {
            // Manifest not found, continue
        }
    }
    
    // Extract chunk URLs from manifest
    const chunkUrls = new Set();
    
    if (manifestData) {
        // Parse build manifest for chunk references
        const addChunksFromObj = (obj, prefix = '') => {
            if (typeof obj === 'string' && obj.includes('.js')) {
                if (obj.startsWith('/')) {
                    chunkUrls.add(baseUrl + obj);
                } else {
                    chunkUrls.add(baseUrl + '/_next/static/chunks/' + obj);
                }
            } else if (Array.isArray(obj)) {
                obj.forEach(item => addChunksFromObj(item, prefix));
            } else if (typeof obj === 'object' && obj !== null) {
                Object.entries(obj).forEach(([key, value]) => {
                    addChunksFromObj(value, prefix + key + '.');
                });
            }
        };
        
        addChunksFromObj(manifestData);
        console.log(`Found ${chunkUrls.size} chunks in build manifest`);
    }
    
    // Also try common webpack runtime files
    for (const manifestPath of manifestPaths) {
        chunkUrls.add(baseUrl + manifestPath);
    }
    
    // Download all discovered chunks
    for (const chunkUrl of chunkUrls) {
        try {
            const fileName = chunkUrl.split('/').pop().split('?')[0];
            if (!fileName.endsWith('.js') && !fileName.endsWith('.json')) continue;
            
            let targetDir;
            if (chunkUrl.includes('/_next/static/chunks/')) {
                targetDir = path.join(outputDir, '_next', 'static', 'chunks');
            } else if (chunkUrl.includes('/_next/static/')) {
                targetDir = path.join(outputDir, '_next', 'static');
            } else {
                targetDir = path.join(outputDir, '_next');
            }
            
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            
            const fullPath = path.join(targetDir, fileName);
            
            // Skip if already downloaded
            if (fs.existsSync(fullPath)) continue;
            
            console.log(`Downloading from manifest: ${chunkUrl}`);
            
            if (fileName.endsWith('.js')) {
                const result = await downloadJS(chunkUrl, fullPath);
                if (result.success) downloadedFiles.add(chunkUrl);
            } else if (fileName.endsWith('.json')) {
                await downloadFile(chunkUrl, fullPath);
                downloadedFiles.add(chunkUrl);
            }
        } catch (error) {
            console.warn(`Error downloading ${chunkUrl}:`, error.message);
        }
    }
    
    return downloadedFiles.size;
};

const extractChunkReferences = (jsContent, baseUrl, outputDir) => {
    const chunkReferences = new Set();
    
    // Multiple regex patterns to catch different ways chunks are referenced
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
    
    console.log(`Scanning chunk content (${jsContent.length} characters) for references...`);
    
    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(jsContent)) !== null) {
            let chunkPath;
            
            // Handle different capture groups
            if (match[1] && match[1].startsWith('/_next/')) {
                chunkPath = match[1]; // Direct path
            } else if (match[2] && match[2].endsWith('.js')) {
                // Webpack chunk ID reference - construct full path
                chunkPath = `/_next/static/chunks/${match[2]}`;
            } else if (match[1] && match[1].endsWith('.js')) {
                // Chunk name - construct full path
                chunkPath = `/_next/static/chunks/${match[1]}`;
            } else {
                continue;
            }
            
            const fullUrl = baseUrl + chunkPath;
            
            // Check if this file exists locally
            const localPath = path.join(outputDir, chunkPath.substring(1)); // Remove leading /
            
            console.log(`Checking chunk: ${chunkPath} -> ${fs.existsSync(localPath) ? 'EXISTS' : 'MISSING'}`);
            
            if (!fs.existsSync(localPath)) {
                console.log(`Found missing chunk: ${chunkPath}`);
                chunkReferences.add(fullUrl);
            }
        }
        
        // Reset regex lastIndex for next iteration
        pattern.lastIndex = 0;
    }
    
    console.log(`Found ${chunkReferences.size} missing chunk references`);
    return Array.from(chunkReferences);
};

const downloadReferencedChunks = async (downloadedChunks, baseUrl, outputDir) => {
    const allDownloadedChunks = new Set();
    const chunksToProcess = [...downloadedChunks];
    const downloadPromises = [];
    
    // Track already downloaded chunks to avoid duplicates
    downloadedChunks.forEach(chunk => allDownloadedChunks.add(chunk.url));
    
    while (chunksToProcess.length > 0) {
        const currentChunk = chunksToProcess.shift();
        
        if (!currentChunk.success || !currentChunk.content) {
            continue;
        }
        
        console.log(`Scanning chunk for references: ${currentChunk.filename}`);
        
        // Extract chunk references from the current chunk
        const referencedChunks = extractChunkReferences(currentChunk.content, baseUrl, outputDir);
        
        for (const chunkUrl of referencedChunks) {
            // Skip if already downloaded or being processed
            if (allDownloadedChunks.has(chunkUrl)) {
                continue;
            }
            
            allDownloadedChunks.add(chunkUrl);
            
            console.log(`Found referenced chunk: ${chunkUrl}`);
            
            try {
                // Extract the full path from the URL (preserving nested directories)
                const urlObj = new URL(chunkUrl);
                const chunkPath = urlObj.pathname; // e.g., "/_next/static/chunks/app/page-abc123.js"
                
                // Create local path preserving the directory structure
                const localPath = path.join(outputDir, chunkPath.substring(1)); // Remove leading /
                
                // Ensure the directory exists
                const dir = path.dirname(localPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                    console.log(`Created directory: ${dir}`);
                }
                
                // Download the referenced chunk
                const downloadPromise = downloadJS(chunkUrl, localPath).then(result => {
                    if (result.success && result.content) {
                        const newChunk = {
                            url: chunkUrl,
                            filename: path.basename(localPath),
                            content: result.content,
                            success: true
                        };
                        
                        // Add to processing queue for recursive scanning
                        chunksToProcess.push(newChunk);
                        
                        console.log(`✓ Downloaded referenced chunk: ${chunkPath}`);
                        return newChunk;
                    } else {
                        console.warn(`✗ Failed to download: ${chunkPath}`);
                        return { url: chunkUrl, success: false };
                    }
                });
                
                downloadPromises.push(downloadPromise);
                
            } catch (error) {
                console.log(`Warning: Could not process referenced chunk ${chunkUrl}:`, error.message);
            }
        }
    }
    
    // Wait for all referenced chunks to download
    if (downloadPromises.length > 0) {
        console.log(`Downloading ${downloadPromises.length} referenced chunks...`);
        const results = await Promise.allSettled(downloadPromises);
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        console.log(`✓ Downloaded ${successful}/${downloadPromises.length} referenced chunks successfully`);
    }
    
    return downloadPromises.length;
};

const getFileExtension = (url, contentType = '') => {
    // First try to get extension from URL
    const urlPath = url.split('?')[0]; // Remove query parameters
    const urlExtension = urlPath.split('.').pop().toLowerCase();
    
    // Common image extensions
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    if (imageExtensions.includes(urlExtension)) {
        return urlExtension;
    }
    
    // Fallback to content type
    if (contentType.includes('jpeg')) return 'jpg';
    if (contentType.includes('png')) return 'png';
    if (contentType.includes('gif')) return 'gif';
    if (contentType.includes('webp')) return 'webp';
    if (contentType.includes('svg')) return 'svg';
    
    return 'jpg'; // Default fallback
};

const generateUniqueFilename = (baseName, extension, directory, originalUrl = '') => {
    // Create a hash of the URL for uniqueness
    const urlHash = originalUrl ? crypto.createHash('md5').update(originalUrl).digest('hex').substring(0, 8) : '';
    
    // If baseName is too generic, try to use parts of the URL
    if (baseName === 'image' || baseName === '' || baseName.length < 3) {
        if (originalUrl) {
            // Extract more meaningful name from URL path
            const urlParts = originalUrl.split('/').filter(part => part.length > 0);
            let meaningfulPart = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1] || 'image';
            
            // If it's a query parameter URL, try to extract from the parameters
            if (originalUrl.includes('?')) {
                const urlParams = new URLSearchParams(originalUrl.split('?')[1]);
                const urlParam = urlParams.get('url');
                if (urlParam) {
                    const decodedUrl = decodeURIComponent(urlParam);
                    const pathParts = decodedUrl.split('/');
                    meaningfulPart = pathParts[pathParts.length - 1] || meaningfulPart;
                }
            }
            
            baseName = meaningfulPart.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 20);
        }
        
        if (baseName === 'image' || baseName === '' || baseName.length < 3) {
            baseName = `img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        }
    }
    
    // Always include URL hash for uniqueness
    const baseWithHash = urlHash ? `${baseName}_${urlHash}` : baseName;
    let fileName = `${baseWithHash}.${extension}`;
    let counter = 1;
    
    while (fs.existsSync(`${directory}/${fileName}`)) {
        fileName = `${baseWithHash}_${counter}.${extension}`;
        counter++;
    }
    
    return fileName;
};

const sanitizeFilename = (filename, defaultName = 'file') => {
    if (!filename || filename.trim() === '') {
        return defaultName;
    }
    
    // Remove or replace invalid characters
    let sanitized = filename
        .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/[^\w.-]/g, '_') // Replace non-word characters except dots and hyphens
        .replace(/_+/g, '_') // Replace multiple underscores with single underscore
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    
    // Ensure filename isn't empty after sanitization
    if (sanitized === '' || sanitized.length < 1) {
        sanitized = defaultName;
    }
    
    // Limit length to prevent filesystem issues
    if (sanitized.length > 50) {
        sanitized = sanitized.substring(0, 50);
    }
    
    return sanitized;
};

const savePage = async (url, offlineMapping, outputDir, pagesToProcess) => {
    try {
        console.log(`Processing: ${url}`);
        
        // Fetch raw HTML
        const { data: html } = await axios.get(url, {
            responseType: 'text',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
        });

        // Load HTML into Cheerio
        const $ = cheerio(html);
        const baseUrl = new URL(url).origin;

        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Create assets directories
        const imagesDir = `${outputDir}/images`;
        const cssDir = `${outputDir}/css`;
        const jsDir = `${outputDir}/js`;
        const fontsDir = `${outputDir}/fonts`;
        
        // Create Next.js specific directories
        const nextDir = `${outputDir}/_next`;
        const nextImageDir = `${outputDir}/_next/image`;
        const nextStaticDir = `${outputDir}/_next/static`;
        const nextStaticCssDir = `${outputDir}/_next/static/css`;
        const nextStaticChunksDir = `${outputDir}/_next/static/chunks`;
        const nextStaticMediaDir = `${outputDir}/_next/static/media`;
        
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }
        if (!fs.existsSync(cssDir)) {
            fs.mkdirSync(cssDir, { recursive: true });
        }
        if (!fs.existsSync(jsDir)) {
            fs.mkdirSync(jsDir, { recursive: true });
        }
        if (!fs.existsSync(fontsDir)) {
            fs.mkdirSync(fontsDir, { recursive: true });
        }
        if (!fs.existsSync(nextDir)) {
            fs.mkdirSync(nextDir, { recursive: true });
        }
        if (!fs.existsSync(nextImageDir)) {
            fs.mkdirSync(nextImageDir, { recursive: true });
        }
        if (!fs.existsSync(nextStaticDir)) {
            fs.mkdirSync(nextStaticDir, { recursive: true });
        }
        if (!fs.existsSync(nextStaticCssDir)) {
            fs.mkdirSync(nextStaticCssDir, { recursive: true });
        }
        if (!fs.existsSync(nextStaticChunksDir)) {
            fs.mkdirSync(nextStaticChunksDir, { recursive: true });
        }
        if (!fs.existsSync(nextStaticMediaDir)) {
            fs.mkdirSync(nextStaticMediaDir, { recursive: true });
        }

        // Replace links with local paths
        $('a').each((_, link) => {
            const href = $(link).attr('href');
            if (href && !href.startsWith('http')) {
                const localPath = offlineMapping[href] || href;
                $(link).attr('href', localPath);
            }
        });

        // Download and replace CSS files
        const cssPromises = [];
        const cssFiles = []; // Store CSS file info for later processing
        
        $('link[rel="stylesheet"]').each((_, link) => {
            const href = $(link).attr('href');
            if (href) {
                let cssUrl = href;
                
                // Convert relative URLs to absolute
                if (href.startsWith('/')) {
                    cssUrl = baseUrl + href;
                } else if (!href.startsWith('http')) {
                    cssUrl = new URL(href, url).href;
                }
                
                // Determine target directory based on the original path
                let targetDir, localCssPath;
                if (href.includes('/_next/static/css/')) {
                    // Place Next.js CSS in _next/static/css/
                    targetDir = nextStaticCssDir;
                    const cssName = cssUrl.split('/').pop().split('?')[0] || 'style.css';
                    
                    // Keep original filename without modification
                    localCssPath = `/_next/static/css/${cssName}`;
                } else {
                    // Place regular CSS in css/
                    targetDir = cssDir;
                    const cssName = cssUrl.split('/').pop().split('?')[0] || 'style.css';
                    const safeCssName = cssName.replace(/[^a-zA-Z0-9.-]/g, '_');
                    const uniqueCssName = generateUniqueFilename(
                        safeCssName.replace('.css', ''), 
                        'css', 
                        targetDir,
                        cssUrl
                    );
                    localCssPath = `./css/${uniqueCssName}`;
                }
                
                const fileName = localCssPath.split('/').pop();
                const fullCssPath = localCssPath.startsWith('/_next/') ? 
                    `${outputDir}${localCssPath}` : 
                    `${targetDir}/${fileName}`;
                
                $(link).attr('href', localCssPath);
                
                // Store CSS file info for later processing
                cssFiles.push({
                    url: cssUrl,
                    path: fullCssPath,
                    uniqueName: fileName
                });
                
                // Add download promise
                cssPromises.push(downloadCSS(cssUrl, fullCssPath));
            }
        });

        // Download and replace JavaScript files
        const jsPromises = [];
        const downloadedChunks = []; // Track downloaded chunks for reference scanning
        $('script[src]').each((_, script) => {
            const src = $(script).attr('src');
            if (src && !src.startsWith('data:')) {
                let jsUrl = src;
                
                // Convert relative URLs to absolute
                if (src.startsWith('/')) {
                    jsUrl = baseUrl + src;
                } else if (!src.startsWith('http')) {
                    jsUrl = new URL(src, url).href;
                }
                
                // Determine target directory based on the original path
                let targetDir, localJsPath;
                if (src.includes('/_next/static/chunks/')) {
                    // Preserve the full chunk path structure
                    const chunkPath = src.split('/_next/static/chunks/')[1] || '';
                    const pathSegments = chunkPath.split('/').filter(segment => segment);
                    
                    if (pathSegments.length > 1) {
                        // Handle nested directories like /app/page.js
                        const subDir = pathSegments.slice(0, -1).join('/');
                        const fullSubDir = `${nextStaticChunksDir}/${subDir}`;
                        if (!fs.existsSync(fullSubDir)) {
                            fs.mkdirSync(fullSubDir, { recursive: true });
                        }
                        targetDir = fullSubDir;
                        localJsPath = `/_next/static/chunks/${chunkPath}`;
                    } else {
                        // Single file in chunks root
                        targetDir = nextStaticChunksDir;
                        localJsPath = `/_next/static/chunks/${chunkPath}`;
                    }
                } else if (src.includes('/_next/static/')) {
                    // Handle other _next/static paths (preserve structure)
                    const staticPath = src.split('/_next/static/')[1] || '';
                    const pathSegments = staticPath.split('/').filter(segment => segment);
                    
                    if (pathSegments.length > 1) {
                        const subDir = pathSegments.slice(0, -1).join('/');
                        const fullSubDir = `${nextStaticDir}/${subDir}`;
                        if (!fs.existsSync(fullSubDir)) {
                            fs.mkdirSync(fullSubDir, { recursive: true });
                        }
                        targetDir = fullSubDir;
                        
                        const jsName = jsUrl.split('/').pop().split('?')[0] || 'script.js';
                        
                        // Keep original filename without modification for _next/static paths
                        localJsPath = `/_next/static/${subDir}/${jsName}`;
                    } else {
                        targetDir = nextStaticDir;
                        const jsName = jsUrl.split('/').pop().split('?')[0] || 'script.js';
                        
                        // Keep original filename without modification
                        localJsPath = `/_next/static/${jsName}`;
                    }
                } else {
                    // Place regular JavaScript in js/
                    targetDir = jsDir;
                    const jsName = jsUrl.split('/').pop().split('?')[0] || 'script.js';
                    const safeJsName = sanitizeFilename(jsName.replace('.js', ''), 'script');
                    const uniqueJsName = generateUniqueFilename(
                        safeJsName, 
                        'js', 
                        targetDir,
                        jsUrl
                    );
                    localJsPath = `./js/${uniqueJsName}`;
                }
                
                const fileName = localJsPath.split('/').pop();
                const fullJsPath = localJsPath.startsWith('/_next/') ? 
                    `${outputDir}${localJsPath}` : 
                    `${targetDir}/${fileName}`;
                
                $(script).attr('src', localJsPath);
                
                console.log(`Found JavaScript: ${jsUrl} -> ${localJsPath}`);
                
                // Add download promise and track chunks
                const downloadPromise = downloadJS(jsUrl, fullJsPath).then(result => {
                    // Track downloaded chunks for reference scanning
                    if (result.success && (src.includes('/_next/static/chunks/') || src.includes('/_next/static/'))) {
                        downloadedChunks.push({
                            url: jsUrl,
                            filename: fileName,
                            content: result.content,
                            success: true
                        });
                    }
                    return result;
                });
                jsPromises.push(downloadPromise);
            }
        });

        // Download and replace preload fonts
        const fontPromises = [];
        $('link[rel="preload"][as="font"]').each((_, link) => {
            const href = $(link).attr('href');
            if (href && !href.startsWith('data:')) {
                let fontUrl = href;
                
                // Convert relative URLs to absolute
                if (href.startsWith('/')) {
                    fontUrl = baseUrl + href;
                } else if (!href.startsWith('http')) {
                    fontUrl = new URL(href, url).href;
                }
                
                console.log(`Found preload font: ${fontUrl}`);
                
                // Determine target directory based on the original path
                let targetDir, localFontPath;
                if (href.includes('/_next/static/media/')) {
                    // Place Next.js fonts in _next/static/media/
                    targetDir = nextStaticMediaDir;
                    const fontName = fontUrl.split('/').pop().split('?')[0] || 'font.woff2';
                    
                    // Keep original filename without modification
                    localFontPath = `/_next/static/media/${fontName}`;
                } else {
                    // Place regular fonts in fonts/
                    targetDir = fontsDir;
                    const fontName = fontUrl.split('/').pop().split('?')[0] || 'font.woff2';
                    const safeFontName = sanitizeFilename(fontName.replace(/\.(woff2?|ttf|otf|eot)$/i, ''), 'font');
                    
                    const extensionMatch = fontName.match(/\.(woff2?|ttf|otf|eot)$/i);
                    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'woff2';
                    
                    const uniqueFontName = generateUniqueFilename(
                        safeFontName, 
                        extension, 
                        targetDir,
                        fontUrl
                    );
                    localFontPath = `./fonts/${uniqueFontName}`;
                }
                
                const fileName = localFontPath.split('/').pop();
                const fullFontPath = localFontPath.startsWith('/_next/') ? 
                    `${outputDir}${localFontPath}` : 
                    `${targetDir}/${fileName}`;
                
                $(link).attr('href', localFontPath);
                
                console.log(`Will download font as: ${localFontPath}`);
                
                // Add download promise
                fontPromises.push(downloadFont(fontUrl, fullFontPath));
            }
        });

        // Download and replace preload scripts
        const preloadJsPromises = [];
        $('link[rel="preload"][as="script"]').each((_, link) => {
            const href = $(link).attr('href');
            if (href && !href.startsWith('data:')) {
                let scriptUrl = href;
                
                // Convert relative URLs to absolute
                if (href.startsWith('/')) {
                    scriptUrl = baseUrl + href;
                } else if (!href.startsWith('http')) {
                    scriptUrl = new URL(href, url).href;
                }
                
                console.log(`Found preload script: ${scriptUrl}`);
                
                // Determine target directory based on the original path
                let targetDir, localScriptPath;
                if (href.includes('/_next/static/chunks/')) {
                    // Preserve the full chunk path structure for preload scripts
                    const chunkPath = href.split('/_next/static/chunks/')[1] || '';
                    const pathSegments = chunkPath.split('/').filter(segment => segment);
                    
                    if (pathSegments.length > 1) {
                        // Handle nested directories like /app/page.js
                        const subDir = pathSegments.slice(0, -1).join('/');
                        const fullSubDir = `${nextStaticChunksDir}/${subDir}`;
                        if (!fs.existsSync(fullSubDir)) {
                            fs.mkdirSync(fullSubDir, { recursive: true });
                        }
                        targetDir = fullSubDir;
                        localScriptPath = `/_next/static/chunks/${chunkPath}`;
                    } else {
                        // Single file in chunks root
                        targetDir = nextStaticChunksDir;
                        localScriptPath = `/_next/static/chunks/${chunkPath}`;
                    }
                } else if (href.includes('/_next/static/')) {
                    // Handle other _next/static preload paths
                    const staticPath = href.split('/_next/static/')[1] || '';
                    const pathSegments = staticPath.split('/').filter(segment => segment);
                    
                    if (pathSegments.length > 1) {
                        const subDir = pathSegments.slice(0, -1).join('/');
                        const fullSubDir = `${nextStaticDir}/${subDir}`;
                        if (!fs.existsSync(fullSubDir)) {
                            fs.mkdirSync(fullSubDir, { recursive: true });
                        }
                        targetDir = fullSubDir;
                        
                        const scriptName = scriptUrl.split('/').pop().split('?')[0] || 'preload-script.js';
                        
                        // Keep original filename without modification
                        localScriptPath = `/_next/static/${subDir}/${scriptName}`;
                    } else {
                        targetDir = nextStaticDir;
                        const scriptName = scriptUrl.split('/').pop().split('?')[0] || 'preload-script.js';
                        
                        // Keep original filename without modification
                        localScriptPath = `/_next/static/${scriptName}`;
                    }
                } else {
                    // Place regular preload scripts in js/
                    targetDir = jsDir;
                    const scriptName = scriptUrl.split('/').pop().split('?')[0] || 'preload-script.js';
                    const safeScriptName = sanitizeFilename(scriptName.replace('.js', ''), 'preload-script');
                    const uniqueScriptName = generateUniqueFilename(
                        safeScriptName, 
                        'js', 
                        targetDir,
                        scriptUrl
                    );
                    localScriptPath = `./js/${uniqueScriptName}`;
                }
                
                const fileName = localScriptPath.split('/').pop();
                const fullScriptPath = localScriptPath.startsWith('/_next/') ? 
                    `${outputDir}${localScriptPath}` : 
                    `${targetDir}/${fileName}`;
                
                $(link).attr('href', localScriptPath);
                
                console.log(`Will download preload script as: ${localScriptPath}`);
                
                // Add download promise
                preloadJsPromises.push(downloadJS(scriptUrl, fullScriptPath));
            }
        });

        // Download and replace preload stylesheets
        const preloadCssPromises = [];
        $('link[rel="preload"][as="style"]').each((_, link) => {
            const href = $(link).attr('href');
            if (href && !href.startsWith('data:')) {
                let cssUrl = href;
                
                // Convert relative URLs to absolute
                if (href.startsWith('/')) {
                    cssUrl = baseUrl + href;
                } else if (!href.startsWith('http')) {
                    cssUrl = new URL(href, url).href;
                }
                
                console.log(`Found preload stylesheet: ${cssUrl}`);
                
                // Determine target directory based on the original path
                let targetDir, localCssPath;
                if (href.includes('/_next/static/css/')) {
                    // Place Next.js preload CSS in _next/static/css/
                    targetDir = nextStaticCssDir;
                    const cssName = cssUrl.split('/').pop().split('?')[0] || 'preload-style.css';
                    
                    // Keep original filename without modification
                    localCssPath = `/_next/static/css/${cssName}`;
                } else {
                    // Place regular preload CSS in css/
                    targetDir = cssDir;
                    const cssName = cssUrl.split('/').pop().split('?')[0] || 'preload-style.css';
                    const safeCssName = sanitizeFilename(cssName.replace('.css', ''), 'preload-style');
                    const uniqueCssName = generateUniqueFilename(
                        safeCssName, 
                        'css', 
                        targetDir,
                        cssUrl
                    );
                    localCssPath = `./css/${uniqueCssName}`;
                }
                
                const fileName = localCssPath.split('/').pop();
                const fullCssPath = localCssPath.startsWith('/_next/') ? 
                    `${outputDir}${localCssPath}` : 
                    `${targetDir}/${fileName}`;
                
                $(link).attr('href', localCssPath);
                
                console.log(`Will download preload stylesheet as: ${localCssPath}`);
                
                // Add download promise
                preloadCssPromises.push(downloadCSS(cssUrl, fullCssPath));
            }
        });

        // Download and replace images
        const imagePromises = [];
        const imageReplacements = new Map(); // Store original src -> new src mappings
        const processedUrls = new Set(); // Track already processed image URLs
        
        $('img').each((_, img) => {
            const imgSrc = $(img).attr('src');
            const imgSrcset = $(img).attr('srcset');
            
            // Process all image URLs from src and srcset
            const imageUrls = [];
            
            if (imgSrc && !imgSrc.startsWith('data:')) {
                imageUrls.push(imgSrc);
            }
            
            if (imgSrcset) {
                // Parse srcset attribute (format: "url1 1x, url2 2x" or "url1 300w, url2 600w")
                const srcsetUrls = imgSrcset.split(',').map(entry => {
                    return entry.trim().split(' ')[0]; // Take just the URL part
                }).filter(url => url && !url.startsWith('data:'));
                imageUrls.push(...srcsetUrls);
            }
            
            // Process each unique image URL
            for (let imgSrc of imageUrls) {
                if (processedUrls.has(imgSrc)) continue;
                processedUrls.add(imgSrc);
                
                let imgUrl = imgSrc;
                
                // Convert relative URLs to absolute
                if (imgSrc.startsWith('/')) {
                    imgUrl = baseUrl + imgSrc;
                } else if (!imgSrc.startsWith('http')) {
                    imgUrl = new URL(imgSrc, url).href;
                }
                
                console.log(`Found image: ${imgUrl}`);
                
                // Determine target directory based on the original path
                let targetDir, localPath;
                if (imgSrc.includes('/_next/image?url=') || imgSrc.includes('_next/image?url=')) {
                    // Handle Next.js Image Optimization API URLs like /_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fimage.jpg
                    try {
                        const urlObj = new URL(imgSrc, baseUrl);
                        const encodedImageUrl = urlObj.searchParams.get('url');
                        
                        if (encodedImageUrl) {
                            const decodedImageUrl = decodeURIComponent(encodedImageUrl);
                            console.log(`Decoded Next.js image URL: ${decodedImageUrl}`);
                            
                            // Determine if the decoded URL is a _next/static path or other
                            if (decodedImageUrl.includes('/_next/static/')) {
                                targetDir = `${outputDir}/_next/static`;
                                
                                const staticPath = decodedImageUrl.split('/_next/static/')[1] || '';
                                const pathSegments = staticPath.split('/').filter(segment => segment);
                                
                                if (pathSegments.length > 1) {
                                    const subDir = pathSegments.slice(0, -1).join('/');
                                    const fullSubDir = `${targetDir}/${subDir}`;
                                    if (!fs.existsSync(fullSubDir)) {
                                        fs.mkdirSync(fullSubDir, { recursive: true });
                                    }
                                }
                                
                                const originalFileName = pathSegments[pathSegments.length - 1] || 'image';
                                const cleanFileName = originalFileName.split('?')[0];
                                const extension = getFileExtension(imgUrl);
                                const baseName = cleanFileName.replace(/\.[^.]*$/, '') || 'nextimg';
                                const uniqueImgName = generateUniqueFilename(baseName, extension, targetDir, imgUrl);
                                
                                const subPath = pathSegments.length > 1 ? pathSegments.slice(0, -1).join('/') + '/' : '';
                                localPath = `/_next/static/${subPath}${uniqueImgName}`;
                            } else {
                                targetDir = imagesDir;
                                const cleanUrl = decodedImageUrl.split('?')[0];
                                let imgName = cleanUrl.split('/').pop() || 'decoded_image';
                                imgName = imgName.replace(/[^a-zA-Z0-9.-]/g, '_');
                                const extension = getFileExtension(imgUrl);
                                const baseName = imgName.replace(/\.[^.]*$/, '') || 'decoded_image';
                                const uniqueImgName = generateUniqueFilename(baseName, extension, targetDir, imgUrl);
                                localPath = `./images/${uniqueImgName}`;
                            }
                        } else {
                            // Fallback if no url parameter found
                            targetDir = imagesDir;
                            const extension = getFileExtension(imgUrl);
                            const uniqueImgName = generateUniqueFilename('nextimage_api', extension, targetDir, imgUrl);
                            localPath = `./images/${uniqueImgName}`;
                        }
                    } catch (error) {
                        console.log(`Warning: Could not parse Next.js image URL ${imgSrc}, treating as regular image`);
                        targetDir = imagesDir;
                        const extension = getFileExtension(imgUrl);
                        const uniqueImgName = generateUniqueFilename('nextimage_parse_error', extension, targetDir, imgUrl);
                        localPath = `./images/${uniqueImgName}`;
                    }
                } else if (imgSrc.includes('/_next/image/') || imgSrc.includes('/_next/')) {
                    // Handle Next.js images - place directly in _next/
                    targetDir = nextDir;
                    
                    // Generate filename for Next.js image
                    const urlPath = imgUrl.split('?')[0]; // Remove query params
                    let imgName = urlPath.split('/').pop() || 'nextimage';
                    imgName = imgName.replace(/[^a-zA-Z0-9.-]/g, '_');
                    const extension = getFileExtension(imgUrl);
                    const baseName = imgName.replace(/\.[^.]*$/, '') || 'nextimage';
                    const uniqueImgName = generateUniqueFilename(baseName, extension, targetDir, imgUrl);
                    
                    localPath = `/_next/${uniqueImgName}`;
                } else {
                    // Handle regular images - use the images directory
                    targetDir = imagesDir;
                    
                    // Generate proper filename with extension
                    const urlPath = imgUrl.split('?')[0]; // Remove query params
                    let imgName = urlPath.split('/').pop() || 'image';
                    
                    // Clean the filename and ensure it has an extension
                    imgName = imgName.replace(/[^a-zA-Z0-9.-]/g, '_');
                    const extension = getFileExtension(imgUrl);
                    
                    // Remove existing extension if present and add the correct one
                    const baseName = imgName.replace(/\.[^.]*$/, '') || 'image';
                    const uniqueImgName = generateUniqueFilename(baseName, extension, targetDir, imgUrl);
                    
                    localPath = `./images/${uniqueImgName}`;
                }
                
                const fileName = localPath.split('/').pop();
                const fullPath = localPath.startsWith('/_next/') ? 
                    `${outputDir}${localPath}` : 
                    `${targetDir}/${fileName}`;
                
                console.log(`Will download as: ${localPath}`);
                
                // Store the mapping for later HTML update
                imageReplacements.set(imgSrc, localPath);
                
                // Add download promise
                const downloadPromise = downloadImage(imgUrl, fullPath)
                    .then(actualPath => {
                        if (actualPath && actualPath !== fullPath) {
                            // Extension was corrected, update the mapping
                            const correctedLocalPath = localPath.startsWith('/_next/') ?
                                actualPath.replace(outputDir, '') :
                                actualPath.replace(imagesDir, './images');
                            imageReplacements.set(imgSrc, correctedLocalPath);
                        }
                        return actualPath;
                    });
                imagePromises.push(downloadPromise);
            }
        });

        // Handle background images in style attributes
        $('*[style]').each((_, element) => {
            const style = $(element).attr('style');
            if (style && style.includes('background-image')) {
                const bgImageMatch = style.match(/background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/);
                if (bgImageMatch) {
                    let bgUrl = bgImageMatch[1];
                    
                    // Convert relative URLs to absolute
                    if (bgUrl.startsWith('/')) {
                        bgUrl = baseUrl + bgUrl;
                    } else if (!bgUrl.startsWith('http')) {
                        bgUrl = new URL(bgUrl, url).href;
                    }
                    
                    // Determine target directory and path for background image
                    let targetDir, localPath;
                    if (bgImageMatch[1].includes('/_next/image?url=') || bgImageMatch[1].includes('_next/image?url=')) {
                        // Handle Next.js Image Optimization API URLs in background
                        try {
                            const urlObj = new URL(bgImageMatch[1], baseUrl);
                            const encodedImageUrl = urlObj.searchParams.get('url');
                            
                            if (encodedImageUrl) {
                                const decodedImageUrl = decodeURIComponent(encodedImageUrl);
                                console.log(`Decoded Next.js background image URL: ${decodedImageUrl}`);
                                
                                if (decodedImageUrl.includes('/_next/static/')) {
                                    targetDir = `${outputDir}/_next/static`;
                                    
                                    const staticPath = decodedImageUrl.split('/_next/static/')[1] || '';
                                    const pathSegments = staticPath.split('/').filter(segment => segment);
                                    
                                    if (pathSegments.length > 1) {
                                        const subDir = pathSegments.slice(0, -1).join('/');
                                        const fullSubDir = `${targetDir}/${subDir}`;
                                        if (!fs.existsSync(fullSubDir)) {
                                            fs.mkdirSync(fullSubDir, { recursive: true });
                                        }
                                    }
                                    
                                    const originalFileName = pathSegments[pathSegments.length - 1] || 'bg_image';
                                    const cleanFileName = originalFileName.split('?')[0];
                                    const extension = getFileExtension(bgUrl);
                                    const baseName = cleanFileName.replace(/\.[^.]*$/, '') || 'nextbg';
                                    const uniqueImgName = generateUniqueFilename(baseName, extension, targetDir, bgUrl);
                                    
                                    const subPath = pathSegments.length > 1 ? pathSegments.slice(0, -1).join('/') + '/' : '';
                                    localPath = `/_next/static/${subPath}${uniqueImgName}`;
                                } else {
                                    targetDir = imagesDir;
                                    const cleanUrl = decodedImageUrl.split('?')[0];
                                    let imgName = cleanUrl.split('/').pop() || 'decoded_bg';
                                    imgName = imgName.replace(/[^a-zA-Z0-9.-]/g, '_');
                                    const extension = getFileExtension(bgUrl);
                                    const baseName = imgName.replace(/\.[^.]*$/, '') || 'decoded_bg';
                                    const uniqueImgName = generateUniqueFilename(baseName, extension, targetDir, bgUrl);
                                    localPath = `./images/${uniqueImgName}`;
                                }
                            } else {
                                targetDir = imagesDir;
                                const extension = getFileExtension(bgUrl);
                                const uniqueImgName = generateUniqueFilename('nextbg_api', extension, targetDir, bgUrl);
                                localPath = `./images/${uniqueImgName}`;
                            }
                        } catch (error) {
                            console.log(`Warning: Could not parse Next.js background image URL, treating as regular image`);
                            targetDir = imagesDir;
                            const extension = getFileExtension(bgUrl);
                            const uniqueImgName = generateUniqueFilename('nextbg_parse_error', extension, targetDir, bgUrl);
                            localPath = `./images/${uniqueImgName}`;
                        }
                    } else if (bgImageMatch[1].includes('/_next/image/')) {
                        // Handle Next.js optimized background images
                        targetDir = nextImageDir;
                        
                        const nextImagePath = bgImageMatch[1].split('/_next/image/')[1] || '';
                        const pathSegments = nextImagePath.split('/').filter(segment => segment);
                        
                        if (pathSegments.length > 1) {
                            const subDir = pathSegments.slice(0, -1).join('/');
                            const fullSubDir = `${nextImageDir}/${subDir}`;
                            if (!fs.existsSync(fullSubDir)) {
                                fs.mkdirSync(fullSubDir, { recursive: true });
                            }
                        }
                        
                        const originalFileName = pathSegments[pathSegments.length - 1] || 'bg_image';
                        const cleanFileName = originalFileName.split('?')[0];
                        const extension = getFileExtension(bgUrl);
                        const baseName = cleanFileName.replace(/\.[^.]*$/, '') || 'nextbg';
                        const uniqueImgName = generateUniqueFilename(baseName, extension, targetDir, bgUrl);
                        
                        const subPath = pathSegments.length > 1 ? pathSegments.slice(0, -1).join('/') + '/' : '';
                        localPath = `/_next/image/${subPath}${uniqueImgName}`;
                    } else {
                        // Handle regular background images
                        targetDir = imagesDir;
                        
                        const urlPath = bgUrl.split('?')[0];
                        let imgName = urlPath.split('/').pop() || 'bg_image';
                        imgName = imgName.replace(/[^a-zA-Z0-9.-]/g, '_');
                        const extension = getFileExtension(bgUrl);
                        const baseName = imgName.replace(/\.[^.]*$/, '') || 'bg_image';
                        const uniqueImgName = generateUniqueFilename(baseName, extension, targetDir, bgUrl);
                        
                        localPath = `./images/${uniqueImgName}`;
                    }
                    
                    const fullPath = localPath.startsWith('/_next/') ? 
                        `${outputDir}${localPath}` : 
                        `${targetDir}/${localPath.split('/').pop()}`;
                    
                    const newStyle = style.replace(bgImageMatch[0], `background-image: url('${localPath}')`);
                    $(element).attr('style', newStyle);
                    
                    imagePromises.push(downloadImage(bgUrl, fullPath));
                }
            }
        });

        // Wait for all downloads to complete
        const allPromises = [...imagePromises, ...cssPromises, ...jsPromises, ...fontPromises, ...preloadJsPromises, ...preloadCssPromises];
        if (allPromises.length > 0) {
            console.log(`Downloading ${imagePromises.length} images, ${cssPromises.length} CSS files, ${jsPromises.length} JavaScript files, ${fontPromises.length} fonts, ${preloadJsPromises.length} preload scripts, and ${preloadCssPromises.length} preload stylesheets...`);
            const results = await Promise.allSettled(allPromises);
            const successful = results.filter(r => r.status === 'fulfilled').length;
            console.log(`✓ Downloaded ${successful}/${allPromises.length} assets successfully`);
        }
        
        // Scan downloaded chunks for additional chunk references
        if (downloadedChunks.length > 0) {
            console.log(`Scanning ${downloadedChunks.length} chunks for additional references...`);
            try {
                await downloadReferencedChunks(downloadedChunks, baseUrl, outputDir);
            } catch (error) {
                console.warn('Error during chunk reference scanning:', error.message);
            }
        }
        
        // Simple chunk-based discovery is handled above in chunk scanning
        // Complex directory and manifest discovery methods are available if needed
        
        // Process CSS files for background images
        let totalBackgroundImages = 0;
        for (let i = 0; i < cssFiles.length; i++) {
            const cssFile = cssFiles[i];
            const cssResult = await Promise.resolve(cssPromises[i]);
            
            if (cssResult && cssResult.success && cssResult.content) {
                console.log(`Processing CSS file for background images: ${cssFile.uniqueName}`);
                const { updatedContent, imageCount } = await processCSSBackgroundImages(
                    cssResult.content, 
                    cssFile.url, 
                    imagesDir, 
                    baseUrl
                );
                
                totalBackgroundImages += imageCount;
                
                // Write updated CSS content back to file
                if (imageCount > 0) {
                    fs.writeFileSync(cssFile.path, updatedContent, 'utf8');
                    console.log(`✓ Updated CSS file with ${imageCount} local background image paths: ${cssFile.uniqueName}`);
                }
            }
        }
        
        if (totalBackgroundImages > 0) {
            console.log(`✓ Processed ${totalBackgroundImages} background images from CSS files`);
        }
        
        // Update HTML with correct image paths after downloads complete
        $('img').each((_, img) => {
            // Update src attribute
            const originalSrc = $(img).attr('src');
            if (originalSrc && imageReplacements.has(originalSrc)) {
                $(img).attr('src', imageReplacements.get(originalSrc));
            }
            
            // Update srcset attribute
            const originalSrcset = $(img).attr('srcset');
            if (originalSrcset) {
                // Parse srcset and replace each URL
                const srcsetEntries = originalSrcset.split(',').map(entry => entry.trim());
                const updatedEntries = srcsetEntries.map(entry => {
                    const parts = entry.split(' ');
                    const url = parts[0];
                    const descriptor = parts.slice(1).join(' '); // e.g., "2x" or "640w"
                    
                    // Check if we have a replacement for this URL
                    if (imageReplacements.has(url)) {
                        return `${imageReplacements.get(url)} ${descriptor}`.trim();
                    }
                    
                    // If no direct match, try to find a similar image
                    // This handles cases where the same image has different query parameters
                    const urlWithoutParams = url.split('?')[0];
                    for (let [originalUrl, localPath] of imageReplacements) {
                        if (originalUrl.split('?')[0] === urlWithoutParams || 
                            originalUrl.includes(urlWithoutParams) ||
                            url.includes(originalUrl.split('?')[0])) {
                            return `${localPath} ${descriptor}`.trim();
                        }
                    }
                    
                    // If still no match and it's a relative URL, try to use the first matching local image
                    if (url.startsWith('/') || url.startsWith('.')) {
                        const fallbackImage = Array.from(imageReplacements.values())[0];
                        if (fallbackImage) {
                            return `${fallbackImage} ${descriptor}`.trim();
                        }
                    }
                    
                    return entry; // Keep original if no replacement found
                });
                
                $(img).attr('srcset', updatedEntries.join(', '));
            }
        });

        const htmlContent = $.html();
        
        // Generate appropriate filename - use index.html for the main page
        let fileName;
        if (url === pagesToProcess[0]) {
            // This is the main page, save as index.html
            fileName = 'index.html';
        } else {
            // For other pages, generate descriptive names
            const urlPath = new URL(url).pathname;
            if (urlPath === '/' || urlPath === '/index.html' || urlPath === '') {
                fileName = 'index.html';
            } else {
                // Clean up the path to create a meaningful filename
                fileName = urlPath
                    .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
                    .replace(/\//g, '_') // Replace slashes with underscores
                    .replace(/[?#].*$/, '') // Remove query params and fragments
                    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid characters
                    || 'page';
                
                // Ensure it has .html extension
                if (!fileName.endsWith('.html')) {
                    fileName += '.html';
                }
            }
        }
        
        const filePath = `${outputDir}/${fileName}`;
        
        fs.writeFileSync(filePath, htmlContent, 'utf8');
        console.log(`✓ Page saved: ${filePath}`);
        
    } catch (error) {
        console.error(`✗ Error saving page ${url}:`, error.message);
    }
};

const extractLinks = async (url) => {
    try{
        console.log(`Extracting links from: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
        });
        const $ = cheerio(response.data);
        const links = [];
        const baseUrl = new URL(url).origin;

        // Extract all links
        $('a').each((_, element) => {
            const link = $(element).attr('href');
            if (link) {
                // Convert relative links to absolute URLs
                if (link.startsWith('/')) {
                    links.push(baseUrl + link);
                } else if (link.startsWith('http')) {
                    links.push(link);
                } else if (!link.startsWith('#') && !link.startsWith('mailto:') && !link.startsWith('tel:')) {
                    // Handle relative links like "page.html"
                    const baseUrlObj = new URL(url);
                    links.push(new URL(link, baseUrlObj).href);
                }
            }
        });

        const uniqueLinks = [...new Set(links)]; // Remove duplicates
        console.log(`Found ${uniqueLinks.length} unique links`);
        return uniqueLinks;
    } catch (error) {
        console.error(`Error extracting links from ${url}:`, error.message);
        return [];
    }
}

async function cloneWebsite(websiteUrl = '', outputDir = '', maxPages = 5) {
  try {
    // Validate URL
    new URL(websiteUrl);
    
    // Set default output directory if not provided
    console.log(`Starting to clone ${websiteUrl} to ${outputDir} with max ${maxPages} pages...`);
    
    // Use the existing processWebsite function
    if (!outputDir) {
        await processWebsite(websiteUrl, maxPages);
    }
    else{
        await processWebsite(websiteUrl, maxPages, outputDir);
    }
    return `Successfully cloned ${websiteUrl} to ${outputDir}. You can now serve it using http-server.`;
  } catch (error) {
    return `Error cloning website: ${error.message}`;
  }
}

const processWebsite = async (url, maxPages = 5, outputPath= "./output") => {
    try {
        console.log(`Starting to clone website: ${url}`);
        
        const domain = new URL(url).hostname.replace(/^www\./, '');
        
        // Ensure outputPath is a string and normalize it (remove trailing slash if present)
        if (typeof outputPath !== 'string') {
            throw new Error('outputPath must be a string');
        }
        const normalizedOutputPath = outputPath.replace(/\/$/, ''); // Remove trailing slash
        // Use path.join for safe concatenation
        const outputDir = path.join(normalizedOutputPath, `cloned_${domain.replace(/\./g, '_')}`);
        
        console.log(`Output directory: ${outputDir}`);
        
        const links = await extractLinks(url);
        console.log(`Found ${links.length} links`);
        
        // Filter links to only include pages from the same domain
        const sameDomainLinks = links.filter(link => {
            try {
                const linkDomain = new URL(link).hostname.replace(/^www\./, '');
                return linkDomain === domain;
            } catch {
                return false;
            }
        });
        
        console.log(`Found ${sameDomainLinks.length} same-domain links`);
        
        // Include the main page and limit the number of pages to process
        const pagesToProcess = [url, ...sameDomainLinks.slice(0, maxPages - 1)];
        
        const offlineMapping = {};
        for (const link of pagesToProcess) {
            const fileName = link.replace(/https?:\/\//, '').replace(/\//g, '_').replace(/[?#].*$/, '') || 'index';
            offlineMapping[link] = `./${fileName}.html`;
        }

        // Process each page
        for (const link of pagesToProcess) {
            await savePage(link, offlineMapping, outputDir, pagesToProcess);
        }

        console.log(`Website cloning completed! Check the '${outputDir}' directory.`);
    } catch (error) {
        console.error(`Error processing website ${url}:`, error.message);
    }
};

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

export { processWebsite, cloneWebsite, listClonedWebsites };
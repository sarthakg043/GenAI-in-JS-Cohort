import axios from 'axios';
import {load as cheerio} from 'cheerio';
import fs from 'fs';
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
        return true;
    } catch (error) {
        console.error(`✗ Error downloading JavaScript from ${url}:`, error.message);
        return false;
    }
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
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }
        if (!fs.existsSync(cssDir)) {
            fs.mkdirSync(cssDir, { recursive: true });
        }
        if (!fs.existsSync(jsDir)) {
            fs.mkdirSync(jsDir, { recursive: true });
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
                
                // Generate unique filename for CSS
                const cssName = cssUrl.split('/').pop().split('?')[0] || 'style.css';
                const safeCssName = cssName.replace(/[^a-zA-Z0-9.-]/g, '_');
                const uniqueCssName = generateUniqueFilename(
                    safeCssName.replace('.css', ''), 
                    'css', 
                    cssDir,
                    cssUrl
                );
                
                const localCssPath = `./css/${uniqueCssName}`;
                const fullCssPath = `${cssDir}/${uniqueCssName}`;
                
                $(link).attr('href', localCssPath);
                
                // Store CSS file info for later processing
                cssFiles.push({
                    url: cssUrl,
                    path: fullCssPath,
                    uniqueName: uniqueCssName
                });
                
                // Add download promise
                cssPromises.push(downloadCSS(cssUrl, fullCssPath));
            }
        });

        // Download and replace JavaScript files
        const jsPromises = [];
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
                
                // Generate unique filename for JavaScript
                const jsName = jsUrl.split('/').pop().split('?')[0] || 'script.js';
                const safeJsName = sanitizeFilename(jsName.replace('.js', ''), 'script');
                const uniqueJsName = generateUniqueFilename(
                    safeJsName, 
                    'js', 
                    jsDir,
                    jsUrl
                );
                
                const localJsPath = `./js/${uniqueJsName}`;
                $(script).attr('src', localJsPath);
                
                console.log(`Found JavaScript: ${jsUrl} -> ${localJsPath}`);
                
                // Add download promise
                jsPromises.push(downloadJS(jsUrl, `${jsDir}/${uniqueJsName}`));
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
                
                // Generate proper filename with extension
                const urlPath = imgUrl.split('?')[0]; // Remove query params
                let imgName = urlPath.split('/').pop() || 'image';
                
                // Clean the filename and ensure it has an extension
                imgName = imgName.replace(/[^a-zA-Z0-9.-]/g, '_');
                const extension = getFileExtension(imgUrl);
                
                // Remove existing extension if present and add the correct one
                const baseName = imgName.replace(/\.[^.]*$/, '') || 'image';
                const uniqueImgName = generateUniqueFilename(baseName, extension, imagesDir, imgUrl);
                
                const localPath = `./images/${uniqueImgName}`;
                
                console.log(`Will download as: ${uniqueImgName}`);
                
                // Store the mapping for later HTML update
                imageReplacements.set(imgSrc, localPath);
                
                // Add download promise
                const downloadPromise = downloadImage(imgUrl, `${imagesDir}/${uniqueImgName}`)
                    .then(actualPath => {
                        if (actualPath && actualPath !== `${imagesDir}/${uniqueImgName}`) {
                            // Extension was corrected, update the mapping
                            const correctedLocalPath = actualPath.replace(imagesDir, './images');
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
                    
                    const urlPath = bgUrl.split('?')[0];
                    let imgName = urlPath.split('/').pop() || 'bg_image';
                    imgName = imgName.replace(/[^a-zA-Z0-9.-]/g, '_');
                    const extension = getFileExtension(bgUrl);
                    const baseName = imgName.replace(/\.[^.]*$/, '') || 'bg_image';
                    const uniqueImgName = generateUniqueFilename(baseName, extension, imagesDir, bgUrl);
                    
                    const localPath = `./images/${uniqueImgName}`;
                    const newStyle = style.replace(bgImageMatch[0], `background-image: url('${localPath}')`);
                    $(element).attr('style', newStyle);
                    
                    imagePromises.push(downloadImage(bgUrl, `${imagesDir}/${uniqueImgName}`));
                }
            }
        });

        // Wait for all downloads to complete
        const allPromises = [...imagePromises, ...cssPromises, ...jsPromises];
        if (allPromises.length > 0) {
            console.log(`Downloading ${imagePromises.length} images, ${cssPromises.length} CSS files, and ${jsPromises.length} JavaScript files...`);
            const results = await Promise.allSettled(allPromises);
            const successful = results.filter(r => r.status === 'fulfilled').length;
            console.log(`✓ Downloaded ${successful}/${allPromises.length} assets successfully`);
        }
        
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

const processWebsite = async (url, maxPages = 5) => {
    try {
        console.log(`Starting to clone website: ${url}`);
        
        const domain = new URL(url).hostname.replace(/^www\./, '');
        const outputDir = `./cloned_${domain.replace(/\./g, '_')}`;
        
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

export { processWebsite };
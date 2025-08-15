// runFabricAI.js
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Runs the fabric-ai command with provided YouTube link and language.
 * @param {string} videoUrl - YouTube video URL.
 * @param {string} language - Language code (e.g., "hi-orig", "en").
 * @returns {Promise<string>} - Resolves with transcript output from fabric-ai.
 */
function runFabricAI(videoUrl, language) {
  return new Promise((resolve, reject) => {
    const command = `fabric-ai --youtube="${videoUrl}" --transcript --language=${language} --yt-dlp-args="--sleep-requests 1"`;

    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject(`Error executing command: ${stderr || error.message}`);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

/**
 * Saves transcript data to a file in the current directory.
 * @param {string} data - Transcript text/content.
 * @param {string} fileName - Output file name (e.g., "transcript.txt").
 */
function saveTranscriptToFile(data, fileName) {
  const filePath = path.join(process.cwd(), fileName);
  fs.writeFileSync(filePath, data, 'utf8');
  console.log(`✅ Transcript saved to ${filePath}`);
}

// Example usage
(async () => {
  try {
    const videoUrl = "https://youtu.be/k3KqQvywToE?si=MbWrJ_b4XhkZXbp_"; // example
    const language = "hi-orig"; // example
    const fileName = "transcript.txt"; // example

    const transcript = await runFabricAI(videoUrl, language);
    saveTranscriptToFile(transcript, fileName);
  } catch (err) {
    console.error("❌ Error:", err);
  }
})();

export { runFabricAI, saveTranscriptToFile };

function getTranscriptTexts() {
  return Array.from(
    document.querySelectorAll(
      'yt-formatted-string.segment-text.style-scope.ytd-transcript-segment-renderer'
    )
  ).map(el => el.innerText.trim());
}

// Example usage:
const texts = getTranscriptTexts();
console.log(texts);

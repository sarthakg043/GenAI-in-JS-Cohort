# fabric_transcript.py
import subprocess
import os
from concurrent.futures import ProcessPoolExecutor, as_completed


def run_fabric_ai(video_url: str, language: str) -> str:
    """
    Runs the fabric-ai command with the given YouTube link and language.
    Returns the transcript output as a string.
    """
    command = [
        "fabric-ai",
        f'--youtube={video_url}',
        "--transcript",
        f'--language={language}',
        '--yt-dlp-args=--sleep-requests 1'
    ]

    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Error executing fabric-ai: {e.stderr or str(e)}")


def save_transcript_to_file(data: str, file_name: str):
    """
    Saves the transcript data to a file in the current working directory.
    """
    file_path = os.path.join(os.getcwd(), file_name)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(data)
    print(f"✅ Transcript saved to {file_path}")


def get_playlist_videos(playlist_url: str, language: str, file_ext: str):
    """
    Extracts video URLs from a YouTube playlist using yt-dlp
    and returns a list of dict objects with video_url, language, and file_name.
    """
    try:
        # Get all video URLs directly
        result = subprocess.run(
            ["yt-dlp", "--flat-playlist", "--print", "%(webpage_url)s", playlist_url],
            capture_output=True,
            text=True,
            check=True
        )
        video_urls = [line.strip() for line in result.stdout.splitlines() if line.strip()]

        videos = []
        for idx, url in enumerate(video_urls, start=1):
            videos.append({
                "video_url": url,
                "language": language,
                "file_name": f"{idx:02d}{file_ext}"
            })

        return videos
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Error fetching playlist videos: {e.stderr or str(e)}")


def process_video(video):
    """
    Runs fabric-ai for a single video and saves the transcript.
    This is used inside the parallel executor.
    """
    try:
        print(f"📥 Processing: {video['video_url']}")
        transcript = run_fabric_ai(video["video_url"], video["language"])
        save_transcript_to_file(transcript, video["file_name"])
        return f"✅ Done: {video['file_name']}"
    except Exception as e:
        return f"❌ Error: {video['video_url']} - {e}"


def process_playlist_parallel(playlist_url: str, language: str, file_ext: str, max_workers: int = 4):
    """
    Extracts all videos from a playlist and downloads their transcripts in parallel.
    """
    videos = get_playlist_videos(playlist_url, language, file_ext)

    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(process_video, video) for video in videos]
        for future in as_completed(futures):
            print(future.result())


# Example usage
if __name__ == "__main__":
    playlist_link = "https://www.youtube.com/playlist?list=PLu71SKxNbfoBJxdT3wckSFm-S_Qn0AEoZ"
    process_playlist_parallel(playlist_link, "hi-orig", "chai_pe_charcha.txt", max_workers=6)

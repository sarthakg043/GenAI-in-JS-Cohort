#!/usr/bin/env python3
"""
YouTube Transcript Scraper for PersonaAI
This script extracts transcripts from YouTube videos/playlists
"""

import os
import json
import sys
from datetime import datetime
import argparse

# You would need to install these packages:
# pip install youtube-transcript-api google-api-python-client

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    from googleapiclient.discovery import build
except ImportError:
    print("Required packages not installed. Please run:")
    print("pip install youtube-transcript-api google-api-python-client")
    sys.exit(1)

class YouTubeTranscriptScraper:
    def __init__(self, api_key):
        self.youtube = build('youtube', 'v3', developerKey=api_key)
        self.max_videos = 36
    
    def extract_video_id(self, url):
        """Extract video ID from YouTube URL"""
        if 'watch?v=' in url:
            return url.split('watch?v=')[1].split('&')[0]
        elif 'youtu.be/' in url:
            return url.split('youtu.be/')[1].split('?')[0]
        return None
    
    def extract_playlist_id(self, url):
        """Extract playlist ID from YouTube URL"""
        if 'list=' in url:
            return url.split('list=')[1].split('&')[0]
        return None
    
    def get_playlist_videos(self, playlist_id):
        """Get videos from a playlist"""
        videos = []
        next_page_token = None
        
        while len(videos) < self.max_videos:
            request = self.youtube.playlistItems().list(
                part='snippet',
                playlistId=playlist_id,
                maxResults=min(50, self.max_videos - len(videos)),
                pageToken=next_page_token
            )
            
            try:
                response = request.execute()
                
                for item in response['items']:
                    video_data = {
                        'id': item['snippet']['resourceId']['videoId'],
                        'title': item['snippet']['title'],
                        'description': item['snippet']['description'][:500],  # Truncate description
                        'published_at': item['snippet']['publishedAt']
                    }
                    videos.append(video_data)
                
                next_page_token = response.get('nextPageToken')
                if not next_page_token:
                    break
                    
            except Exception as e:
                print(f"Error fetching playlist videos: {e}")
                break
        
        return videos[:self.max_videos]
    
    def get_video_info(self, video_id):
        """Get information about a single video"""
        try:
            request = self.youtube.videos().list(
                part='snippet,contentDetails',
                id=video_id
            )
            response = request.execute()
            
            if response['items']:
                item = response['items'][0]
                return {
                    'id': video_id,
                    'title': item['snippet']['title'],
                    'description': item['snippet']['description'][:500],
                    'published_at': item['snippet']['publishedAt'],
                    'duration': item['contentDetails']['duration']
                }
        except Exception as e:
            print(f"Error fetching video info: {e}")
        
        return None
    
    def get_transcript(self, video_id):
        """Get transcript for a video"""
        try:
            # Try to get transcript in different languages
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            
            # Prefer Hindi/English transcripts
            languages = ['hi', 'en', 'en-US', 'en-GB']
            transcript = None
            
            for lang in languages:
                try:
                    transcript = transcript_list.find_transcript([lang])
                    break
                except:
                    continue
            
            # If no preferred language found, get the first available
            if not transcript:
                transcript = transcript_list._manually_created_transcripts[list(transcript_list._manually_created_transcripts.keys())[0]]
            
            # Fetch the actual transcript data
            transcript_data = transcript.fetch()
            
            # Combine all text
            full_text = ' '.join([item['text'] for item in transcript_data])
            
            return {
                'language': transcript.language_code,
                'text': full_text,
                'segments': transcript_data
            }
            
        except Exception as e:
            print(f"No transcript available for video {video_id}: {e}")
            return None
    
    def process_url(self, url, output_dir='src/data/video_transcripts'):
        """Process a YouTube URL (video or playlist)"""
        os.makedirs(output_dir, exist_ok=True)
        
        results = {
            'processed_at': datetime.now().isoformat(),
            'source_url': url,
            'videos': [],
            'success_count': 0,
            'error_count': 0
        }
        
        # Determine if it's a video or playlist
        video_id = self.extract_video_id(url)
        playlist_id = self.extract_playlist_id(url)
        
        videos_to_process = []
        
        if playlist_id:
            print(f"Processing playlist: {playlist_id}")
            videos_to_process = self.get_playlist_videos(playlist_id)
            results['type'] = 'playlist'
            results['playlist_id'] = playlist_id
        elif video_id:
            print(f"Processing video: {video_id}")
            video_info = self.get_video_info(video_id)
            if video_info:
                videos_to_process = [video_info]
            results['type'] = 'video'
        else:
            print("Invalid YouTube URL")
            return results
        
        print(f"Found {len(videos_to_process)} videos to process")
        
        # Process each video
        for i, video in enumerate(videos_to_process):
            print(f"Processing video {i+1}/{len(videos_to_process)}: {video['title']}")
            
            transcript = self.get_transcript(video['id'])
            
            video_result = {
                'index': i,
                'video_id': video['id'],
                'title': video['title'],
                'description': video.get('description', ''),
                'published_at': video.get('published_at', ''),
                'transcript_available': transcript is not None
            }
            
            if transcript:
                video_result['transcript'] = transcript
                results['success_count'] += 1
                
                # Save individual transcript file
                transcript_filename = f"transcript_{i:03d}_{video['id']}.json"
                transcript_path = os.path.join(output_dir, transcript_filename)
                
                with open(transcript_path, 'w', encoding='utf-8') as f:
                    json.dump({
                        'video_info': video,
                        'transcript': transcript,
                        'processed_at': datetime.now().isoformat()
                    }, f, ensure_ascii=False, indent=2)
                
                print(f"  ✓ Transcript saved: {transcript_filename}")
            else:
                results['error_count'] += 1
                print(f"  ✗ No transcript available")
            
            results['videos'].append(video_result)
        
        # Save summary file
        summary_filename = f"processing_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        summary_path = os.path.join(output_dir, summary_filename)
        
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"\nProcessing complete!")
        print(f"Success: {results['success_count']}, Errors: {results['error_count']}")
        print(f"Summary saved: {summary_filename}")
        
        return results

def main():
    parser = argparse.ArgumentParser(description='Extract transcripts from YouTube videos/playlists')
    parser.add_argument('url', help='YouTube video or playlist URL')
    parser.add_argument('--api-key', required=True, help='YouTube Data API v3 key')
    parser.add_argument('--output-dir', default='src/data/video_transcripts', help='Output directory')
    
    args = parser.parse_args()
    
    scraper = YouTubeTranscriptScraper(args.api_key)
    results = scraper.process_url(args.url, args.output_dir)
    
    return results

if __name__ == '__main__':
    main()

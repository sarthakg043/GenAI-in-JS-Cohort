# PersonaAI Generator : Work In Progress

A sophisticated web application that transforms YouTube content into intelligent AI personas using advanced Chain-of-Thought (CoT) prompting techniques. Create personalized AI assistants that embody the knowledge, speaking style, and personality of your favorite content creators.

## 🚀 Features

- **Advanced AI Processing**: Uses Chain-of-Thought prompting for deep persona understanding
- **YouTube Integration**: Process individual videos or entire playlists (up to 36 videos)
- **Multi-language Support**: Automatic Hindi/Hinglish transliteration using Sarvam AI
- **Interactive Chat**: Chat directly with your generated AI persona
- **Flexible Configuration**: Choose from multiple AI models and customization options
- **Resume Capability**: Automatically resume interrupted processing sessions
- **Secure Storage**: All API keys stored locally in browser storage

## 🛠 Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS v4 + Shadcn/ui
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **Backend Services**: 
  - OpenAI GPT models
  - Sarvam AI (transliteration)
  - YouTube Data API v3
  - Gemini API

## 📋 Prerequisites

Before running the application, ensure you have the following API keys:

1. **OpenAI API Key** - [Get from OpenAI Platform](https://platform.openai.com/api-keys)
2. **YouTube Data v3 API Key** - [Get from Google Cloud Console](https://console.cloud.google.com/apis/credentials)
3. **Sarvam AI API Key** (Optional) - [Get from Sarvam AI](https://www.sarvam.ai/)
4. **Gemini API Key** - [Get from Google AI Studio](https://aistudio.google.com/app/apikey)

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd 02personnaAI
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Setup Workflow

1. **Configure API Keys**: Click on "Configure API Keys" and enter your API credentials
2. **Generate Persona**: Provide a YouTube URL (video or playlist) and configure processing options
3. **Chat with Persona**: Once generation is complete, start chatting with your AI persona

## 📖 How It Works

### 1. Data Extraction
- Fetches video metadata using YouTube Data API v3
- Extracts transcripts from videos using the transcript scraper
- Processes up to 36 videos from playlists

### 2. Content Processing
- **Optional Transliteration**: Converts Hindi/Hinglish content to English using Sarvam AI
- **Text Chunking**: Breaks large transcripts into manageable chunks (respecting token limits)
- **Sequential Processing**: Handles rate limits and API constraints

### 3. Persona Generation
- Uses advanced CoT (Chain-of-Thought) prompting with OpenAI models
- Follows structured steps: START → THINK → EVALUATE → OUTPUT
- Builds comprehensive persona understanding through multiple iterations
- Optimizes and finalizes the persona prompt

### 4. Interactive Chat
- Real-time conversation with the generated persona
- Maintains context and character consistency
- Export chat history functionality

## 🔧 Configuration Options

### AI Models
- **GPT-4o Mini** (Recommended): Low cost, good performance
- **GPT-4o**: Medium cost, better quality
- **GPT-4 Turbo**: High cost, best results

### Processing Options
- **Single Video**: ~15k-18k tokens, faster processing
- **Playlist**: ~150k-200k tokens, comprehensive persona
- **Transliteration**: Optional Hindi/Hinglish to English conversion

## 💰 Cost Estimation

| Content Type | Model | Estimated Cost |
|--------------|-------|----------------|
| Single Video | GPT-4o Mini | ~$2.50 |
| Single Video | GPT-4o | ~$41.25 |
| Single Video | GPT-4 Turbo | ~$165.00 |
| Playlist | GPT-4o Mini | ~$26.25 |
| Playlist | GPT-4o | ~$437.50 |
| Playlist | GPT-4 Turbo | ~$1,750.00 |

*Estimates based on average token usage and current API pricing*

## 🔐 Privacy & Security

- All API keys are stored locally in your browser's localStorage
- No data is sent to external servers except the required AI APIs
- Transcripts and generated personas are stored locally
- Clear data functionality available

## 📁 File Structure

```
02personnaAI/
├── src/
│   ├── components/
│   │   ├── ui/                    # Shadcn/ui components
│   │   ├── ApiKeysModal.jsx       # API key configuration
│   │   ├── PersonaGeneratorModal.jsx # Generation settings
│   │   ├── ProcessingModal.jsx    # Progress tracking
│   │   └── PersonaChatModal.jsx   # Chat interface
│   ├── lib/
│   │   ├── personaProcessor.js    # Core processing logic
│   │   └── utils.js              # Utility functions
│   ├── data/
│   │   ├── prompts/              # System prompts
│   │   └── video_transcripts/    # Processed transcripts
│   └── App.jsx                   # Main application
├── transcriptScraper.py          # Python transcript extractor
└── README.md                     # This file
```

## 🐍 Python Script Usage

For more robust transcript extraction, use the included Python script:

```bash
# Install dependencies
pip install youtube-transcript-api google-api-python-client

# Process a single video
python transcriptScraper.py "https://www.youtube.com/watch?v=VIDEO_ID" --api-key YOUR_YOUTUBE_API_KEY

# Process a playlist
python transcriptScraper.py "https://www.youtube.com/playlist?list=PLAYLIST_ID" --api-key YOUR_YOUTUBE_API_KEY
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the browser console for error messages
2. Ensure all API keys are correctly configured
3. Verify API quotas and billing are set up correctly
4. Check network connectivity and CORS policies

## 🔮 Future Enhancements

- [ ] Support for more video platforms
- [ ] Batch processing capabilities
- [ ] Advanced persona customization
- [ ] Export/import persona functionality
- [ ] Multi-language chat support
- [ ] Voice interaction capabilities

---

**Note**: This application is designed for educational and research purposes. Please ensure you comply with YouTube's Terms of Service and respect content creators' rights when processing their content.

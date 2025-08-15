import axios from 'axios'

export class PersonaProcessor {
  constructor() {
    this.currentStage = localStorage.getItem('persona_generation_stage') || 'idle'
    this.logs = []
  }

  async processYouTubeContent(config, onProgress) {
    try {
      this.updateStage('fetching_data')
      onProgress(0, 'Fetching video/playlist data', '5-10 seconds')

      // Simulate fetching YouTube data (replace with actual YouTube API call)
      await this.simulateDelay(2000)
      const videoData = await this.fetchYouTubeData(config.url, config.type)
      
      this.updateStage('extracting_transcripts')
      onProgress(20, 'Extracting transcripts', '2-5 minutes')

      // Process transcripts
      const transcripts = await this.extractTranscripts(videoData)
      
      if (config.useTransliteration) {
        this.updateStage('transliterating')
        onProgress(40, 'Converting to English with Sarvam AI', '3-7 minutes')
        await this.transliterateContent(transcripts)
      }

      this.updateStage('generating_persona')
      onProgress(70, 'Generating persona with AI', '5-10 minutes')
      
      const personaPrompt = await this.generatePersonaPrompt(transcripts, config.model)
      
      this.updateStage('finalizing')
      onProgress(95, 'Optimizing and finalizing', '30 seconds')
      
      await this.simulateDelay(1000)
      
      // Save final persona
      localStorage.setItem('final_persona_prompt', personaPrompt)
      this.updateStage('completed')
      onProgress(100, 'Generation completed!', '')

      return personaPrompt

    } catch (error) {
      console.error('Error in persona processing:', error)
      this.updateStage('error')
      throw error
    }
  }

  async fetchYouTubeData(url, type) {
    // This would integrate with YouTube Data API v3
    // For now, we'll simulate the response
    
    const youtubeKey = localStorage.getItem('youtube_api_key')
    if (!youtubeKey) {
      throw new Error('YouTube API key not found')
    }

    // Extract video ID or playlist ID from URL
    let videoId, playlistId
    
    if (type === 'playlist') {
      const match = url.match(/[&?]list=([^&]+)/)
      playlistId = match ? match[1] : null
      if (!playlistId) throw new Error('Invalid playlist URL')
    } else {
      const match = url.match(/[&?]v=([^&]+)/)
      videoId = match ? match[1] : null
      if (!videoId) throw new Error('Invalid video URL')
    }

    this.addLog(`Fetching ${type}: ${videoId || playlistId}`)
    
    // Simulate API call delay
    await this.simulateDelay(1500)
    
    // Return mock data structure
    return {
      type,
      videoId,
      playlistId,
      videos: type === 'playlist' ? Array(Math.min(36, 12)).fill(null).map((_, i) => ({
        id: `video_${i}`,
        title: `Video ${i + 1}`,
        duration: 900 // 15 minutes average
      })) : [{
        id: videoId,
        title: 'Single Video',
        duration: 900
      }]
    }
  }

  async extractTranscripts(videoData) {
    // This would call your Python transcript scraper
    // For now, we'll use the existing transcript data
    
    this.addLog(`Processing ${videoData.videos.length} video(s)`)
    
    const transcripts = []
    
    for (let i = 0; i < videoData.videos.length; i++) {
      const video = videoData.videos[i]
      this.addLog(`Extracting transcript for: ${video.title}`)
      
      // Simulate transcript extraction
      await this.simulateDelay(500)
      
      // Try to load existing transcript data
      const transcriptText = await this.loadExistingTranscript(i)
      
      transcripts.push({
        videoId: video.id,
        title: video.title,
        text: transcriptText,
        duration: video.duration
      })
    }
    
    // Save transcripts to localStorage
    localStorage.setItem('extracted_transcripts', JSON.stringify(transcripts))
    
    return transcripts
  }

  async loadExistingTranscript(index) {
    // Try to load from the data/video_transcripts folder
    // For demo, we'll return placeholder text
    
    const placeholderTexts = [
      "आज हम बात करेंगे programming के बारे में। देखिए, मैं आपको बताता हूँ कि कैसे आप एक अच्छे developer बन सकते हैं।",
      "हैलो एवरीवन, आज का टॉपिक है JavaScript fundamentals। यह बहुत इम्पोर्टेंट है आपके career के लिए।",
      "React एक बहुत ही powerful library है। आज हम इसके concepts को समझेंगे step by step।"
    ]
    
    return placeholderTexts[index % placeholderTexts.length] + " ".repeat(800) // Simulate longer content
  }

  async transliterateContent(transcripts) {
    const sarvamKey = localStorage.getItem('sarvam_api_key')
    if (!sarvamKey) {
      this.addLog('Sarvam API key not found, skipping transliteration')
      return transcripts
    }

    const transliteratedTranscripts = []

    for (let i = 0; i < transcripts.length; i++) {
      const transcript = transcripts[i]
      this.addLog(`Transliterating: ${transcript.title}`)

      const transliteratedText = await this.transliterateText(transcript.text, sarvamKey)
      
      transliteratedTranscripts.push({
        ...transcript,
        originalText: transcript.text,
        text: transliteratedText
      })

      // Save progress
      localStorage.setItem(`transliterated_${i}`, transliteratedText)
    }

    return transliteratedTranscripts
  }

  async transliterateText(text, apiKey) {
    // Break text into chunks of 900 characters
    const chunks = this.chunkText(text, 900)
    const transliteratedChunks = []

    for (let i = 0; i < chunks.length; i++) {
      try {
        const response = await axios.post('https://api.sarvam.ai/transliterate', {
          input: chunks[i],
          source_language_code: 'auto',
          target_language_code: 'en-IN'
        }, {
          headers: {
            'api-subscription-key': apiKey,
            'Content-Type': 'application/json'
          }
        })

        transliteratedChunks.push(response.data.transliterated_text)
        
        // Save chunk to localStorage
        localStorage.setItem(`transliterated_chunk_${Date.now()}_${i}`, response.data.transliterated_text)
        
        // Add delay to respect rate limits
        await this.simulateDelay(500)
        
      } catch (error) {
        this.addLog(`Error transliterating chunk ${i}: ${error.message}`)
        // Fallback to original text for failed chunks
        transliteratedChunks.push(chunks[i])
      }
    }

    return transliteratedChunks.join(' ')
  }

  async generatePersonaPrompt(transcripts, model) {
    const openaiKey = localStorage.getItem('openai_api_key')
    if (!openaiKey) {
      throw new Error('OpenAI API key not found')
    }

    // Load system prompt
    const systemPrompt = await this.loadSystemPrompt()
    
    // Process transcripts in chunks due to token limits
    const allSteps = []
    
    for (let i = 0; i < transcripts.length; i++) {
      const transcript = transcripts[i]
      this.addLog(`Processing transcript ${i + 1}/${transcripts.length}: ${transcript.title}`)
      
      const chunks = this.chunkText(transcript.text, 3000) // Leave room for system prompt
      
      for (let j = 0; j < chunks.length; j++) {
        this.addLog(`Processing chunk ${j + 1}/${chunks.length}`)
        
        const response = await this.callOpenAI(systemPrompt, chunks[j], model)
        const steps = this.parseStepsFromResponse(response)
        
        allSteps.push(...steps)
        
        // Save progress
        localStorage.setItem(`step_${allSteps.length}`, JSON.stringify(steps[steps.length - 1]))
        
        // Delay to respect rate limits
        await this.simulateDelay(1000)
      }
    }

    // Extract final persona prompt from the last OUTPUT step
    const outputSteps = allSteps.filter(step => step.step === 'OUTPUT')
    const finalPersona = outputSteps[outputSteps.length - 1]?.content || 'Default persona prompt'

    return finalPersona
  }

  async callOpenAI(systemPrompt, content, model) {
    const openaiKey = localStorage.getItem('openai_api_key')
    
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this transcript and generate persona characteristics:\n\n${content}` }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        }
      })

      return response.data.choices[0].message.content
    } catch (error) {
      this.addLog(`OpenAI API error: ${error.message}`)
      throw error
    }
  }

  parseStepsFromResponse(response) {
    // Try to parse JSON steps from the response
    try {
      // Look for JSON blocks in the response
      const jsonMatches = response.match(/\{[^}]*"step"[^}]*\}/g)
      if (jsonMatches) {
        return jsonMatches.map(match => JSON.parse(match))
      }
    } catch (error) {
      this.addLog(`Error parsing steps: ${error.message}`)
    }

    // Fallback: create a basic step structure
    return [{
      step: 'OUTPUT',
      content: response
    }]
  }

  async loadSystemPrompt() {
    // In a real implementation, you'd fetch this from the file
    // For now, we'll return a simplified version
    return `You are an expert at understanding deep context about a person or entity, and then creating wisdom from that context. Analyze the provided transcript and generate a comprehensive persona prompt following the START, THINK, EVALUATE, OUTPUT format.

Always respond with JSON objects in this format:
{"step": "START|THINK|EVALUATE|OUTPUT", "content": "your content here"}`
  }

  chunkText(text, maxLength) {
    const chunks = []
    for (let i = 0; i < text.length; i += maxLength) {
      chunks.push(text.slice(i, i + maxLength))
    }
    return chunks
  }

  updateStage(stage) {
    this.currentStage = stage
    localStorage.setItem('persona_generation_stage', stage)
  }

  addLog(message) {
    const logMessage = `${new Date().toLocaleTimeString()}: ${message}`
    this.logs.push(logMessage)
    console.log(logMessage)
  }

  async simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  getProgress() {
    const stageProgress = {
      'idle': 0,
      'fetching_data': 10,
      'extracting_transcripts': 30,
      'transliterating': 50,
      'generating_persona': 80,
      'finalizing': 95,
      'completed': 100,
      'error': 0
    }
    return stageProgress[this.currentStage] || 0
  }

  canResume() {
    return this.currentStage !== 'idle' && this.currentStage !== 'completed' && this.currentStage !== 'error'
  }

  reset() {
    this.currentStage = 'idle'
    this.logs = []
    localStorage.removeItem('persona_generation_stage')
    // Clean up other processing-related items
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('step_') || key.startsWith('chunk_') || key.startsWith('transliterated_')) {
        localStorage.removeItem(key)
      }
    })
  }
}

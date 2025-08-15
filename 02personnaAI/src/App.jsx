import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Key, Youtube, Brain, MessageSquare, Settings, Play, List, AlertTriangle, Loader2, CheckCircle, XCircle, ExternalLink, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import './App.css';

// Custom Components
const Button = ({ children, onClick, variant = 'primary', disabled = false, className = '', size = 'default' }) => {
  const baseClasses = 'font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:bg-gray-100',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 bg-white',
    ghost: 'hover:bg-gray-100 text-gray-700'
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    default: 'px-4 py-2 rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-xl'
  };
  
  return (
    <motion.button 
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick} 
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

const Input = ({ label, value, onChange, type = 'text', placeholder = '', required = false, icon = null }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white`}
      />
    </div>
  </div>
);

const PasswordInput = ({ label, value, onChange, placeholder = '', required = false }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
};

const Switch = ({ checked, onChange, label, description = null }) => (
  <div className="flex items-start justify-between py-3">
    <div className="flex-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => onChange(!checked)}
      className={`relative ml-4 inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <motion.span
        animate={{ x: checked ? 20 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
      />
    </motion.button>
  </div>
);

const Modal = ({ isOpen, onClose, children, title, maxWidth = 'max-w-md', closable = true }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={closable ? onClose : undefined}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden`}
        >
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {closable && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle size={24} />
              </button>
            )}
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const ProgressBar = ({ progress, stages, currentStage }) => (
  <div className="w-full">
    <div className="flex justify-between text-xs text-gray-600 mb-3">
      {stages.map((stage, index) => (
        <motion.span 
          key={index} 
          animate={{ 
            color: index === currentStage ? '#2563eb' : '#6b7280',
            fontWeight: index === currentStage ? 600 : 400
          }}
          className="text-center flex-1"
        >
          {stage}
        </motion.span>
      ))}
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
      />
    </div>
  </div>
);

const Card = ({ children, className = '', hover = true }) => (
  <motion.div
    whileHover={hover ? { y: -2, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" } : {}}
    className={`bg-white rounded-2xl shadow-lg border border-gray-100 transition-all duration-200 ${className}`}
  >
    {children}
  </motion.div>
);

const PersonaChatApp = () => {
  const [currentStep, setCurrentStep] = useState('api-keys');
  const [selectedProvider, setSelectedProvider] = useState(
    localStorage.getItem('ai_provider') || 'openai'
  );
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    sarvam: '',
    gemini: '',
    youtube: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    openai: false,
    sarvam: false,
    gemini: false,
    youtube: false
  });
  const [useHinglish, setUseHinglish] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const processingStages = [
    'Extracting transcripts',
    'Transliterating text',
    'Generating persona',
    'Finalizing'
  ];

  const openaiModels = [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', recommended: true, cost: 'Low' },
    { id: 'gpt-4o', name: 'GPT-4o', cost: 'Medium' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', premium: true, cost: 'High' },
    { id: 'gpt-4', name: 'GPT-4', cost: 'High' }
  ];

  const geminiModels = [
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', recommended: true, cost: 'Low' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', cost: 'Low' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', cost: 'Medium' }
  ];

  const getCurrentModels = () => selectedProvider === 'openai' ? openaiModels : geminiModels;

  const steps = ['api-keys', 'content-selection', 'processing', 'chat'];

  useEffect(() => {
    // Load saved state from localStorage
    const savedStep = localStorage.getItem('currentStep') || 'api-keys';
    const savedProvider = localStorage.getItem('ai_provider') || 'openai';
    const savedKeys = JSON.parse(localStorage.getItem('apiKeys') || '{}');
    
    setCurrentStep(savedStep);
    setSelectedProvider(savedProvider);
    setApiKeys(prev => ({ ...prev, ...savedKeys }));
    
    // Set default model based on provider
    if (savedProvider === 'gemini' && selectedModel.startsWith('gpt-')) {
      setSelectedModel('gemini-2.0-flash-exp');
    } else if (savedProvider === 'openai' && selectedModel.startsWith('gemini-')) {
      setSelectedModel('gpt-4o-mini');
    }
  }, []);

  const saveProgress = (step, data = {}) => {
    localStorage.setItem('currentStep', step);
    localStorage.setItem('apiKeys', JSON.stringify({ ...apiKeys, ...data }));
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleApiKeySave = () => {
    const requiredKeys = [selectedProvider, 'youtube'];
    if (useHinglish) requiredKeys.push('sarvam');
    
    const missingKeys = requiredKeys.filter(key => !apiKeys[key].trim());
    if (missingKeys.length > 0) {
      showError(`Please provide: ${missingKeys.join(', ')} API keys`);
      return;
    }
    
    // Save AI provider selection
    localStorage.setItem('ai_provider', selectedProvider);
    
    saveProgress('content-selection', apiKeys);
    setCurrentStep('content-selection');
    showSuccess('API keys saved successfully!');
  };

  const makeAIRequest = async (prompt, systemPrompt = '') => {
    try {
      if (selectedProvider === 'openai') {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: selectedModel,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000
        }, {
          headers: {
            'Authorization': `Bearer ${apiKeys.openai}`,
            'Content-Type': 'application/json'
          }
        });
        return response.data.choices[0].message.content;
      } else if (selectedProvider === 'gemini') {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKeys.gemini}`,
          {
            contents: [
              {
                parts: [
                  { text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4000
            }
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        return response.data.candidates[0].content.parts[0].text;
      }
    } catch (error) {
      console.error('AI API Error:', error);
      throw new Error(`${selectedProvider.toUpperCase()} API request failed: ${error.response?.data?.error?.message || error.message}`);
    }
  };

  const handleTypeSelection = (type) => {
    setShowTypeModal(false);
    if (type === 'video') {
      startProcessing('video');
    } else {
      startProcessing('playlist');
    }
  };

  const chunkText = (text, maxSize = 900) => {
    const chunks = [];
    let currentChunk = '';
    const words = text.split(' ');
    
    for (const word of words) {
      if ((currentChunk + ' ' + word).length > maxSize) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = word;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + word;
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  };

  const transliterateText = async (text) => {
    const chunks = chunkText(text, 900);
    const transliteratedChunks = [];
    
    for (let i = 0; i < chunks.length; i++) {
      try {
        const response = await axios.post('https://api.sarvam.ai/transliterate', {
          input: chunks[i],
          source_language_code: 'auto',
          target_language_code: 'en-IN'
        }, {
          headers: {
            'api-subscription-key': apiKeys.sarvam,
            'Content-Type': 'application/json'
          }
        });
        
        transliteratedChunks.push(response.data.transliterated_text);
        localStorage.setItem(`transliterated_chunk_${i}`, response.data.transliterated_text);
        
      } catch (error) {
        throw new Error(`Transliteration failed for chunk ${i + 1}: ${error.message}`);
      }
    }
    
    const finalText = transliteratedChunks.join(' ');
    localStorage.setItem('transliteratedText', finalText);
    return finalText;
  };

  const generatePersona = async (transcript) => {
    const prompt = `Based on the following transcript content, create a detailed system prompt that will allow an AI to impersonate the speaker's personality, speaking style, knowledge, and mannerisms. Use chain-of-thought reasoning to analyze:

1. Speaking patterns and vocabulary
2. Areas of expertise and interests
3. Personality traits and communication style
4. Common phrases or expressions
5. Tone and approach to topics

Transcript content:
${transcript}

Create a comprehensive system prompt that captures this person's essence for AI impersonation.`;

    try {
      const persona = await makeAIRequest(prompt);
      localStorage.setItem('generatedPersona', persona);
      return persona;
    } catch (error) {
      throw new Error(`Persona generation failed: ${error.message}`);
    }
  };

  const startProcessing = async (type) => {
    setIsProcessing(true);
    setShowProgressModal(true);
    setProgress(0);
    setCurrentStage(0);
    
    try {
      // Stage 1: Extract transcripts (simulated)
      setProgress(25);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate transcript extraction
      const mockTranscript = `स्वागत है आप सभी का चाय और कोड में। आज हम बात करेंगे React के बारे में। देखिए, React एक बहुत ही powerful library है और आज के जमाने में हर developer को यह आनी चाहिए। मैं आपको step by step समझाऊंगा कि कैसे आप React सीख सकते हैं। Actually में, React सीखना कोई बड़ी बात नहीं है अगर आप सही approach अपनाएं। तो चलिए शुरू करते हैं।`;
      localStorage.setItem('extractedTranscript', mockTranscript);
      
      setCurrentStage(1);
      setProgress(50);
      
      // Stage 2: Transliterate if needed
      let processedText = mockTranscript;
      if (useHinglish) {
        processedText = await transliterateText(mockTranscript);
      }
      
      setCurrentStage(2);
      setProgress(75);
      
      // Stage 3: Generate persona
      const persona = await generatePersona(processedText);
      
      setCurrentStage(3);
      setProgress(100);
      
      // Save final state
      saveProgress('chat', { persona });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowProgressModal(false);
      setIsProcessing(false);
      setCurrentStep('chat');
      showSuccess('Persona generated successfully!');
      
    } catch (error) {
      showError(error.message);
      setIsProcessing(false);
      setShowProgressModal(false);
    }
  };

  const renderApiKeysStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4"
        >
          <Key className="h-8 w-8 text-white" />
        </motion.div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          API Configuration
        </h1>
        <p className="text-gray-600 text-lg">Enter your API keys to get started with persona generation</p>
      </div>

      <Card className="p-8">
        <div className="space-y-6">
          {/* AI Provider Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Choose AI Provider</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedProvider('openai');
                  setSelectedModel('gpt-4o-mini');
                }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedProvider === 'openai'
                    ? 'border-blue-600 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                }`}
              >
                <div className="font-medium text-gray-900">OpenAI</div>
                <div className="text-sm text-gray-600 mt-1">GPT-4o, GPT-4 Turbo</div>
                <div className="text-xs text-green-600 font-medium mt-1">✓ Primary Choice</div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedProvider('gemini');
                  setSelectedModel('gemini-2.0-flash-exp');
                }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedProvider === 'gemini'
                    ? 'border-purple-600 bg-purple-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                }`}
              >
                <div className="font-medium text-gray-900">Google Gemini</div>
                <div className="text-sm text-gray-600 mt-1">Gemini 2.0 Flash, 1.5 Pro</div>
                <div className="text-xs text-purple-600 font-medium mt-1">🆓 Alternative Option</div>
              </motion.button>
            </div>
          </div>

          {/* API Key Input based on selected provider */}
          {selectedProvider === 'openai' ? (
            <PasswordInput
              label="OpenAI API Key"
              value={apiKeys.openai}
              onChange={(value) => setApiKeys(prev => ({ ...prev, openai: value }))}
              placeholder="sk-..."
              required
            />
          ) : (
            <PasswordInput
              label="Google Gemini API Key"
              value={apiKeys.gemini}
              onChange={(value) => setApiKeys(prev => ({ ...prev, gemini: value }))}
              placeholder="Your Gemini API key"
              required
            />
          )}
          
          <PasswordInput
            label="YouTube Data v3 API Key"
            value={apiKeys.youtube}
            onChange={(value) => setApiKeys(prev => ({ ...prev, youtube: value }))}
            placeholder="Your YouTube API key"
            required
          />

          <div className="border-t pt-6">
            <Switch
              checked={useHinglish}
              onChange={setUseHinglish}
              label="Enable Hinglish Transliteration"
              description="Convert Hindi/Hinglish content to English using Sarvam AI"
            />
          </div>

          <AnimatePresence>
            {useHinglish && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PasswordInput
                  label="Sarvam AI API Key"
                  value={apiKeys.sarvam}
                  onChange={(value) => setApiKeys(prev => ({ ...prev, sarvam: value }))}
                  placeholder="sk_..."
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Choose {selectedProvider === 'openai' ? 'OpenAI' : 'Gemini'} Model
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {getCurrentModels().map((model) => (
                <motion.button
                  key={model.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedModel(model.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedModel === model.id
                      ? selectedProvider === 'openai' 
                        ? 'border-blue-600 bg-blue-50 shadow-lg'
                        : 'border-purple-600 bg-purple-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                  }`}
                >
                  <div className="font-medium text-gray-900">{model.name}</div>
                  <div className="text-sm text-gray-600 mt-1">Cost: {model.cost}</div>
                  {model.recommended && (
                    <div className="text-xs text-green-600 font-medium mt-1">✓ Recommended</div>
                  )}
                  {model.premium && (
                    <div className="text-xs text-purple-600 font-medium mt-1">⭐ Best Results</div>
                  )}
                </motion.button>
              ))}
            </div>
            <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
              💡 {selectedProvider === 'openai' ? (
                'Best results with GPT-4 Turbo, but GPT-4o Mini is cost-effective.'
              ) : (
                'Gemini 2.0 Flash offers excellent performance with generous free tier.'
              )} Expect ~15k-18k tokens for a 15-minute video.
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700"
              >
                <div className="flex items-center gap-2">
                  <XCircle size={20} />
                  <span className="font-medium">Error:</span>
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} />
                  <span className="font-medium">Success:</span>
                  {successMessage}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button onClick={handleApiKeySave} className="w-full" size="lg">
            Continue to Content Selection 
            <ChevronRight size={20} />
          </Button>

          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-medium text-gray-900 mb-3">Quick Links:</h4>
            <div className="space-y-2 text-sm">
              {selectedProvider === 'openai' ? (
                <a href="https://platform.openai.com/api-keys" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors" target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={16} />
                  Get OpenAI API Key
                </a>
              ) : (
                <a href="https://makersuite.google.com/app/apikey" className="flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors" target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={16} />
                  Get Gemini API Key
                </a>
              )}
              <a href="https://console.developers.google.com/apis/credentials" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors" target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} />
                Get YouTube API Key
              </a>
              {useHinglish && (
                <a href="https://www.sarvam.ai/" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors" target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={16} />
                  Get Sarvam AI Key
                </a>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const renderContentSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto h-16 w-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4"
        >
          <Youtube className="h-8 w-8 text-white" />
        </motion.div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Select Content Source
        </h1>
        <p className="text-gray-600 text-lg">Choose a YouTube video or playlist to create your AI persona</p>
      </div>

      <Card className="p-8">
        <div className="space-y-6">
          <Input
            label="YouTube URL"
            value={youtubeUrl}
            onChange={setYoutubeUrl}
            placeholder="https://youtube.com/watch?v=... or https://youtube.com/playlist?list=..."
            icon={<Youtube size={20} />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={() => setShowTypeModal(true)}
              disabled={!youtubeUrl.trim()}
              className="flex-col h-20"
              size="lg"
            >
              <Brain size={24} />
              <span>Generate Persona</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setCurrentStep('api-keys')}
              className="flex-col h-20"
              size="lg"
            >
              <Settings size={24} />
              <span>Back to Settings</span>
            </Button>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Brain size={20} className="text-blue-600" />
              Processing Information
            </h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• Up to 36 videos can be processed from playlists</p>
              <p>• Single videos use fewer tokens and process faster</p>
              <p>• Processing time: 2-5 minutes depending on content length</p>
              <p>• All data is processed securely and stored locally</p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const renderChat = () => {
    const generatedPersona = localStorage.getItem('generatedPersona');
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto h-16 w-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4"
          >
            <MessageSquare className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            AI Persona Ready!
          </h1>
          <p className="text-gray-600 text-lg">Your AI persona has been generated and is ready for interaction</p>
        </div>

        <Card className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-200"
          >
            <div className="flex items-start gap-4">
              <div className="bg-green-100 rounded-full p-2">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Persona Generated Successfully! 🎉</h3>
                <p className="text-gray-700 mb-3">
                  Your AI persona has been created based on the YouTube content analysis. 
                  The system is now ready to impersonate the speaker's style, knowledge, and mannerisms.
                </p>
                {generatedPersona && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                      View Generated Persona Preview
                    </summary>
                    <div className="mt-3 p-4 bg-white rounded-lg border max-h-32 overflow-y-auto text-gray-600">
                      {generatedPersona.substring(0, 300)}...
                    </div>
                  </details>
                )}
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button 
              onClick={() => setCurrentStep('content-selection')}
              variant="outline"
              className="flex-col h-16"
            >
              <Youtube size={20} />
              Create Another Persona
            </Button>
            <Button 
              onClick={() => setCurrentStep('api-keys')}
              variant="outline"
              className="flex-col h-16"
            >
              <Settings size={20} />
              Change Settings
            </Button>
            <Button 
              onClick={() => {
                if (generatedPersona) {
                  alert('In a real implementation, this would open a chat interface with your generated persona!');
                } else {
                  showError('No persona found. Please generate one first.');
                }
              }}
              className="flex-col h-16"
            >
              <MessageSquare size={20} />
              Start Chatting
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-6">
            {['API Keys', 'Content', 'Processing', 'Chat'].map((step, index) => {
              const isActive = index <= steps.indexOf(currentStep);
              const isCurrent = index === steps.indexOf(currentStep);
              
              return (
                <div key={step} className="flex items-center">
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-600'
                    } ${isCurrent ? 'ring-4 ring-blue-200' : ''}`}
                  >
                    {index + 1}
                  </motion.div>
                  <div className="ml-2 hidden sm:block">
                    <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {step}
                    </div>
                  </div>
                  {index < 3 && (
                    <motion.div 
                      animate={{ 
                        backgroundColor: index < steps.indexOf(currentStep) ? '#2563eb' : '#e5e7eb'
                      }}
                      className="w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 transition-colors duration-300"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {currentStep === 'api-keys' && renderApiKeysStep()}
          {currentStep === 'content-selection' && renderContentSelection()}
          {currentStep === 'chat' && renderChat()}
        </AnimatePresence>

        {/* Type Selection Modal */}
        <Modal
          isOpen={showTypeModal}
          onClose={() => setShowTypeModal(false)}
          title="Choose Processing Type"
          maxWidth="max-w-lg"
        >
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border border-amber-200 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 mb-1">Token Usage Warning</p>
                  <p className="text-amber-700">
                    Playlists will use significantly more tokens. Choose single video 
                    processing if you want to minimize API costs.
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTypeSelection('video')}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group bg-white"
              >
                <Play className="mx-auto mb-3 text-blue-600 group-hover:text-blue-700 transition-colors" size={32} />
                <h3 className="font-semibold text-gray-900 mb-2">Single Video</h3>
                <p className="text-sm text-gray-600">Lower token usage, faster processing</p>
                <div className="mt-3 text-xs text-green-600 font-medium">💡 Recommended for testing</div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTypeSelection('playlist')}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group bg-white"
              >
                <List className="mx-auto mb-3 text-blue-600 group-hover:text-blue-700 transition-colors" size={32} />
                <h3 className="font-semibold text-gray-900 mb-2">Playlist</h3>
                <p className="text-sm text-gray-600">Up to 36 videos, comprehensive analysis</p>
                <div className="mt-3 text-xs text-purple-600 font-medium">⭐ Best for detailed personas</div>
              </motion.button>
            </div>
          </div>
        </Modal>

        {/* Progress Modal */}
        <Modal
          isOpen={showProgressModal}
          onClose={() => {}}
          title="Processing Content"
          maxWidth="max-w-lg"
          closable={false}
        >
          <div className="space-y-6">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mx-auto mb-4"
              >
                <Loader2 className="text-blue-600" size={40} />
              </motion.div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {processingStages[currentStage]}
              </h3>
              <p className="text-sm text-gray-600">
                This may take a few minutes. Please don't close this window.
              </p>
            </div>

            <ProgressBar 
              progress={progress}
              stages={processingStages}
              currentStage={currentStage}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600"
            >
              <p className="font-medium mb-3 text-gray-900">Current Stage Details:</p>
              <div className="space-y-2">
                {currentStage === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p>• Extracting transcripts from YouTube content</p>
                    <p>• Processing video metadata and structure</p>
                  </motion.div>
                )}
                {currentStage === 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {useHinglish ? (
                      <>
                        <p>• Converting Hinglish to English text</p>
                        <p>• Processing text chunks for better accuracy</p>
                      </>
                    ) : (
                      <>
                        <p>• Preparing text for AI processing</p>
                        <p>• Optimizing content structure</p>
                      </>
                    )}
                  </motion.div>
                )}
                {currentStage === 2 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p>• Analyzing speaking patterns and style</p>
                    <p>• Generating comprehensive AI persona</p>
                  </motion.div>
                )}
                {currentStage === 3 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p>• Finalizing persona configuration</p>
                    <p>• Preparing for interaction</p>
                  </motion.div>
                )}
              </div>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700"
                >
                  <div className="flex items-start gap-3">
                    <XCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Processing Error</p>
                      <p className="text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default PersonaChatApp;

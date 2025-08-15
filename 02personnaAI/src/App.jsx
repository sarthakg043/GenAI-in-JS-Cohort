import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import './App.css'

// Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import ApiKeysModal from '@/components/ApiKeysModal'
import PersonaGeneratorModal from '@/components/PersonaGeneratorModal'
import ProcessingModal from '@/components/ProcessingModal'
import PersonaChatModal from '@/components/PersonaChatModal'

// Utils
import { PersonaProcessor } from '@/lib/personaProcessor'

// Icons
import { 
  Settings, 
  User, 
  MessageSquare, 
  Key, 
  Youtube, 
  Sparkles,
  CheckCircle,
  ArrowRight,
  Brain,
  Zap
} from 'lucide-react'

function App() {
  const [showApiKeysModal, setShowApiKeysModal] = useState(false)
  const [showGeneratorModal, setShowGeneratorModal] = useState(false)
  const [showProcessingModal, setShowProcessingModal] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  
  const [apiKeysConfigured, setApiKeysConfigured] = useState(false)
  const [personaGenerated, setPersonaGenerated] = useState(false)
  const [finalPersona, setFinalPersona] = useState('')
  
  // Processing state
  const [processingState, setProcessingState] = useState({
    currentStep: 0,
    totalSteps: 5,
    stepName: '',
    progress: 0,
    estimatedTime: '',
    error: null,
    logs: [],
    canClose: false
  })

  const processor = new PersonaProcessor()

  useEffect(() => {
    // Check if API keys are configured
    const openaiKey = localStorage.getItem('openai_api_key')
    const youtubeKey = localStorage.getItem('youtube_api_key')
    setApiKeysConfigured(!!(openaiKey && youtubeKey))

    // Check if persona was already generated
    const savedPersona = localStorage.getItem('final_persona_prompt')
    if (savedPersona) {
      setPersonaGenerated(true)
      setFinalPersona(savedPersona)
    }

    // Check if we can resume processing
    if (processor.canResume()) {
      // Show option to resume
      const resume = confirm('It looks like you have an interrupted persona generation process. Would you like to resume?')
      if (resume) {
        resumeProcessing()
      } else {
        processor.reset()
      }
    }
  }, [])

  const handleApiKeysSave = (keys) => {
    setApiKeysConfigured(true)
  }

  const handleStartGeneration = async (config) => {
    setShowProcessingModal(true)
    setProcessingState(prev => ({
      ...prev,
      currentStep: 0,
      progress: 0,
      error: null,
      canClose: false,
      logs: []
    }))

    try {
      const onProgress = (progress, stepName, estimatedTime) => {
        setProcessingState(prev => ({
          ...prev,
          progress,
          stepName,
          estimatedTime,
          currentStep: Math.floor(progress / 20),
          logs: [...prev.logs, `${new Date().toLocaleTimeString()}: ${stepName}`]
        }))
      }

      const persona = await processor.processYouTubeContent(config, onProgress)
      
      setFinalPersona(persona)
      setPersonaGenerated(true)
      setProcessingState(prev => ({
        ...prev,
        canClose: true
      }))

    } catch (error) {
      setProcessingState(prev => ({
        ...prev,
        error: error.message,
        canClose: true
      }))
    }
  }

  const resumeProcessing = async () => {
    // Implement resume logic based on saved stage
    setShowProcessingModal(true)
    // This would continue from where it left off
  }

  const handleStartNewGeneration = () => {
    processor.reset()
    setPersonaGenerated(false)
    setFinalPersona('')
    setShowGeneratorModal(true)
  }

  const steps = [
    {
      number: 1,
      title: 'Configure API Keys',
      description: 'Set up your OpenAI, Sarvam AI, Gemini, and YouTube API keys',
      completed: apiKeysConfigured,
      icon: Key,
      action: () => setShowApiKeysModal(true)
    },
    {
      number: 2,
      title: 'Generate Persona',
      description: 'Process YouTube videos/playlists to create an AI persona',
      completed: personaGenerated,
      icon: Brain,
      action: () => setShowGeneratorModal(true),
      disabled: !apiKeysConfigured
    },
    {
      number: 3,
      title: 'Chat with Persona',
      description: 'Interact with your generated AI persona',
      completed: false,
      icon: MessageSquare,
      action: () => setShowChatModal(true),
      disabled: !personaGenerated
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PersonaAI Generator
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform YouTube content into intelligent AI personas using advanced Chain-of-Thought prompting. 
            Create personalized AI assistants that embody the knowledge and style of your favorite creators.
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  step.completed ? 'border-green-500 bg-green-50 dark:bg-green-900/10' :
                  step.disabled ? 'opacity-50 cursor-not-allowed' : 
                  'hover:border-blue-500'
                }`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        step.completed ? 'bg-green-500 text-white' :
                        step.disabled ? 'bg-gray-300 text-gray-500' :
                        'bg-blue-500 text-white'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <step.icon className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{step.title}</CardTitle>
                        <span className="text-sm text-muted-foreground">Step {step.number}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {step.description}
                    </CardDescription>
                    <Button
                      onClick={step.action}
                      disabled={step.disabled}
                      variant={step.completed ? "outline" : "default"}
                      className="w-full"
                    >
                      {step.completed ? 'Reconfigure' : 'Start'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Current Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!apiKeysConfigured ? (
                <div className="text-center py-6">
                  <Key className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Configure your API keys to get started</p>
                </div>
              ) : !personaGenerated ? (
                <div className="text-center py-6">
                  <Youtube className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                  <p className="text-muted-foreground">Ready to generate your first AI persona</p>
                  <Button 
                    onClick={() => setShowGeneratorModal(true)}
                    className="mt-3"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Start Generation
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Persona Generated Successfully!
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Your AI persona is ready for interaction
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => setShowChatModal(true)}
                      className="flex-1"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Chat with Persona
                    </Button>
                    <Button 
                      onClick={handleStartNewGeneration}
                      variant="outline"
                    >
                      Generate New
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto mt-16"
        >
          <h2 className="text-2xl font-bold text-center mb-8">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: 'Advanced AI Processing',
                description: 'Uses Chain-of-Thought prompting for deep persona understanding'
              },
              {
                icon: Youtube,
                title: 'YouTube Integration',
                description: 'Process individual videos or entire playlists (up to 36 videos)'
              },
              {
                icon: Zap,
                title: 'Multi-language Support',
                description: 'Automatic Hindi/Hinglish transliteration using Sarvam AI'
              },
              {
                icon: MessageSquare,
                title: 'Interactive Chat',
                description: 'Chat directly with your generated AI persona'
              },
              {
                icon: Settings,
                title: 'Flexible Configuration',
                description: 'Choose from multiple AI models and customization options'
              },
              {
                icon: CheckCircle,
                title: 'Resume Capability',
                description: 'Automatically resume interrupted processing sessions'
              }
            ].map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <feature.icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <ApiKeysModal
        isOpen={showApiKeysModal}
        onClose={() => setShowApiKeysModal(false)}
        onSave={handleApiKeysSave}
      />

      <PersonaGeneratorModal
        isOpen={showGeneratorModal}
        onClose={() => setShowGeneratorModal(false)}
        onGenerate={handleStartGeneration}
      />

      <ProcessingModal
        isOpen={showProcessingModal}
        onClose={() => setShowProcessingModal(false)}
        {...processingState}
      />

      <PersonaChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        personaPrompt={finalPersona}
      />
    </div>
  )
}

export default App

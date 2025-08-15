import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ExternalLink, Eye, EyeOff } from 'lucide-react'

const ApiKeysModal = ({ isOpen, onClose, onSave }) => {
  const [keys, setKeys] = useState({
    openai: '',
    sarvam: '',
    gemini: '',
    youtube: ''
  })
  const [showKeys, setShowKeys] = useState({
    openai: false,
    sarvam: false,
    gemini: false,
    youtube: false
  })

  useEffect(() => {
    if (isOpen) {
      // Load existing keys from localStorage
      const savedKeys = {
        openai: localStorage.getItem('openai_api_key') || '',
        sarvam: localStorage.getItem('sarvam_api_key') || '',
        gemini: localStorage.getItem('gemini_api_key') || '',
        youtube: localStorage.getItem('youtube_api_key') || ''
      }
      setKeys(savedKeys)
    }
  }, [isOpen])

  const handleSave = () => {
    // Save to localStorage
    Object.entries(keys).forEach(([key, value]) => {
      if (value.trim()) {
        localStorage.setItem(`${key}_api_key`, value.trim())
      }
    })
    onSave(keys)
    onClose()
  }

  const toggleShowKey = (keyType) => {
    setShowKeys(prev => ({
      ...prev,
      [keyType]: !prev[keyType]
    }))
  }

  const apiKeyConfigs = [
    {
      key: 'openai',
      label: 'OpenAI API Key',
      placeholder: 'sk-...',
      link: 'https://platform.openai.com/api-keys',
      linkText: 'Get OpenAI API Key'
    },
    {
      key: 'sarvam',
      label: 'Sarvam AI API Key (Optional)',
      placeholder: 'sk_...',
      link: 'https://www.sarvam.ai/',
      linkText: 'Get Sarvam API Key'
    },
    {
      key: 'gemini',
      label: 'Gemini API Key',
      placeholder: 'AI...',
      link: 'https://aistudio.google.com/app/apikey',
      linkText: 'Get Gemini API Key'
    },
    {
      key: 'youtube',
      label: 'YouTube Data v3 API Key',
      placeholder: 'AI...',
      link: 'https://console.cloud.google.com/apis/credentials',
      linkText: 'Get YouTube API Key'
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure API Keys</DialogTitle>
          <DialogDescription>
            Please enter your API keys. They will be stored securely in your browser's local storage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {apiKeyConfigs.map((config) => (
            <motion.div
              key={config.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <Label htmlFor={config.key}>{config.label}</Label>
                <a
                  href={config.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {config.linkText}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <Input
                  id={config.key}
                  type={showKeys[config.key] ? 'text' : 'password'}
                  placeholder={config.placeholder}
                  value={keys[config.key]}
                  onChange={(e) => setKeys(prev => ({
                    ...prev,
                    [config.key]: e.target.value
                  }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey(config.key)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showKeys[config.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Keys
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ApiKeysModal

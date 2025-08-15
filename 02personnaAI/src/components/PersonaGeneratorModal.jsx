import { useState } from 'react'
import { motion } from 'motion/react'
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
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'
import { AlertTriangle, Youtube, List } from 'lucide-react'

const PersonaGeneratorModal = ({ isOpen, onClose, onGenerate }) => {
  const [config, setConfig] = useState({
    url: '',
    type: 'video', // 'video' or 'playlist'
    useTransliteration: false,
    model: 'gpt-4o-mini'
  })

  const models = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Recommended)', cost: 'Low cost' },
    { value: 'gpt-4o', label: 'GPT-4o', cost: 'Medium cost' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Best Results)', cost: 'High cost' }
  ]

  const detectUrlType = (url) => {
    if (url.includes('playlist')) {
      return 'playlist'
    } else if (url.includes('watch')) {
      return 'video'
    }
    return 'video'
  }

  const handleUrlChange = (e) => {
    const url = e.target.value
    setConfig(prev => ({
      ...prev,
      url,
      type: detectUrlType(url)
    }))
  }

  const handleGenerate = () => {
    if (!config.url.trim()) {
      alert('Please enter a YouTube URL')
      return
    }
    onGenerate(config)
    onClose()
  }

  const getTokenEstimate = () => {
    if (config.type === 'playlist') {
      return '150k-200k tokens (36 videos max)'
    } else {
      return '15k-18k tokens (single video)'
    }
  }

  const getCostEstimate = () => {
    const baseTokens = config.type === 'playlist' ? 175000 : 16500
    switch (config.model) {
      case 'gpt-4o-mini':
        return `~$${((baseTokens / 1000) * 0.15).toFixed(2)}`
      case 'gpt-4o':
        return `~$${((baseTokens / 1000) * 2.5).toFixed(2)}`
      case 'gpt-4-turbo':
        return `~$${((baseTokens / 1000) * 10).toFixed(2)}`
      default:
        return 'Calculating...'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate AI Persona</DialogTitle>
          <DialogDescription>
            Create a comprehensive AI persona from YouTube content using advanced COT-based prompts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url">YouTube URL</Label>
            <Input
              id="url"
              placeholder="https://www.youtube.com/watch?v=... or https://www.youtube.com/playlist?list=..."
              value={config.url}
              onChange={handleUrlChange}
            />
          </div>

          {/* Content Type Detection */}
          {config.url && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            >
              {config.type === 'playlist' ? (
                <>
                  <List className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-800 dark:text-blue-200">
                    Playlist detected - Will process up to 36 videos
                  </span>
                </>
              ) : (
                <>
                  <Youtube className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-800 dark:text-blue-200">
                    Single video detected
                  </span>
                </>
              )}
            </motion.div>
          )}

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">AI Model</Label>
            <Select
              value={config.model}
              onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
            >
              {models.map(model => (
                <option key={model.value} value={model.value}>
                  {model.label} - {model.cost}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              GPT-4 Turbo provides the best results, but GPT-4o and GPT-4o Mini also work well.
            </p>
          </div>

          {/* Transliteration Option */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="transliteration">Use Hinglish Transliteration</Label>
              <p className="text-sm text-muted-foreground">
                Convert Hindi/Hinglish content to English using Sarvam AI
              </p>
            </div>
            <Switch
              id="transliteration"
              checked={config.useTransliteration}
              onChange={(e) => setConfig(prev => ({ ...prev, useTransliteration: e.target.checked }))}
            />
          </div>

          {/* Cost and Token Estimate */}
          <div className="p-4 border rounded-lg space-y-2">
            <h4 className="font-medium">Estimated Usage</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tokens:</span>
                <span className="ml-2 font-medium">{getTokenEstimate()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Cost:</span>
                <span className="ml-2 font-medium">{getCostEstimate()}</span>
              </div>
            </div>
          </div>

          {/* Warning for Playlist */}
          {config.type === 'playlist' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  High Token Usage Warning
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Processing a playlist will use significantly more tokens. Consider starting with a single video to test the functionality and save costs.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={!config.url.trim()}>
            Start Generation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PersonaGeneratorModal

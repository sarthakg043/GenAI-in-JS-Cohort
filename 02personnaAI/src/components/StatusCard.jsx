import { motion } from 'motion/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  Key, 
  Youtube, 
  CheckCircle, 
  MessageSquare, 
  Zap 
} from 'lucide-react'

const StatusCard = ({ 
  apiKeysConfigured, 
  personaGenerated, 
  onShowApiKeysModal, 
  onShowGeneratorModal, 
  onShowChatModal, 
  onStartNewGeneration 
}) => {
  return (
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
              <p className="text-muted-foreground mb-4">Configure your API keys to get started</p>
              <Button onClick={onShowApiKeysModal}>
                Configure API Keys
              </Button>
            </div>
          ) : !personaGenerated ? (
            <div className="text-center py-6">
              <Youtube className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Ready to generate your first AI persona</p>
              <Button onClick={onShowGeneratorModal}>
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
                  onClick={onShowChatModal}
                  className="flex-1"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat with Persona
                </Button>
                <Button 
                  onClick={onStartNewGeneration}
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
  )
}

export default StatusCard

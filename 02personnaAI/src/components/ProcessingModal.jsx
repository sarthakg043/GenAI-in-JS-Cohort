import { motion } from 'motion/react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'

const ProcessingModal = ({ 
  isOpen, 
  onClose, 
  currentStep, 
  totalSteps, 
  stepName, 
  progress, 
  estimatedTime, 
  error,
  logs = [],
  canClose = false 
}) => {
  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'current':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const steps = [
    'Fetching video/playlist data',
    'Extracting transcripts', 
    'Processing with Sarvam AI (if enabled)',
    'Generating persona with AI',
    'Optimizing and finalizing'
  ]

  return (
    <Dialog open={isOpen} onOpenChange={canClose ? onClose : undefined}>
      <DialogContent className="max-w-2xl" hideCloseButton={!canClose}>
        <DialogHeader>
          <DialogTitle>
            {error ? 'Processing Error' : 'Generating AI Persona'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Step */}
          <div className="text-center space-y-2">
            <motion.div
              key={stepName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-medium"
            >
              {stepName}
            </motion.div>
            {estimatedTime && !error && (
              <p className="text-sm text-muted-foreground">
                Estimated time remaining: {estimatedTime}
              </p>
            )}
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              let status = 'pending'
              if (index < currentStep) status = 'completed'
              else if (index === currentStep) status = error ? 'error' : 'current'

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    status === 'current' ? 'bg-blue-50 dark:bg-blue-900/20' :
                    status === 'completed' ? 'bg-green-50 dark:bg-green-900/20' :
                    status === 'error' ? 'bg-red-50 dark:bg-red-900/20' :
                    'bg-gray-50 dark:bg-gray-800/50'
                  }`}
                >
                  {getStepIcon(status)}
                  <span className={`text-sm ${
                    status === 'completed' ? 'text-green-800 dark:text-green-200' :
                    status === 'current' ? 'text-blue-800 dark:text-blue-200' :
                    status === 'error' ? 'text-red-800 dark:text-red-200' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {step}
                  </span>
                </motion.div>
              )
            })}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                Error occurred:
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </motion.div>
          )}

          {/* Processing Logs */}
          {logs.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Processing Details:</h4>
              <div className="max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1">
                {logs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-gray-600 dark:text-gray-400"
                  >
                    {log}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(canClose || error) && (
          <div className="flex justify-end mt-6">
            <Button 
              onClick={onClose}
              variant={error ? "destructive" : "default"}
            >
              {error ? 'Close' : 'Done'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ProcessingModal

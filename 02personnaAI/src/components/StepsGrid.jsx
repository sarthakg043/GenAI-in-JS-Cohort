import { motion } from 'motion/react'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const StepCard = ({ step, index }) => {
  return (
    <motion.div
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
  )
}

const StepsGrid = ({ steps }) => {
  return (
    <div className="max-w-4xl mx-auto mb-12">
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((step, index) => (
          <StepCard key={step.number} step={step} index={index} />
        ))}
      </div>
    </div>
  )
}

export default StepsGrid

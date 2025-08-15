import { motion } from 'motion/react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Brain, 
  Youtube, 
  Zap, 
  MessageSquare, 
  Settings, 
  CheckCircle 
} from 'lucide-react'

const features = [
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
]

const FeaturesSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="max-w-4xl mx-auto mt-16"
    >
      <h2 className="text-2xl font-bold text-center mb-8">Key Features</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
          >
            <Card className="text-center h-full">
              <CardContent className="pt-6">
                <feature.icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default FeaturesSection

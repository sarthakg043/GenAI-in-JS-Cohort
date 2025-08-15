import { motion } from 'motion/react'
import { User } from 'lucide-react'

const AppHeader = () => {
  return (
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
  )
}

export default AppHeader

"use client";

import { motion } from 'framer-motion';
import { Users, Brain, Zap, CheckCircle2, MessageSquare, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: "Real-time Collaborative Editing",
    description: "Work together seamlessly with your team in real-time"
  },
  {
    icon: CheckCircle2,
    title: "Team-based Projects with Task Tracking",
    description: "Organize projects and track progress with powerful task management"
  },
  {
    icon: Brain,
    title: "AI-powered Summaries and Digests",
    description: "Get intelligent insights and automated summaries of your work"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94] as any
    }
  }
};

const logoVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 1,
      ease: [0.25, 0.46, 0.45, 0.94] as any
    }
  }
};

export default function HeroSection() {
  return (
    <motion.div 
      className="relative z-10 flex flex-col justify-center h-full px-8 lg:px-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Logo and Brand */}
      <motion.div variants={logoVariants} className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          {/* Enhanced Logo */}
          <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl blur-sm opacity-30"></div>
            <MessageSquare className="w-7 h-7 text-white relative z-10" />
          </div>
          <div>
            <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent leading-tight">
              ContextBoard
            </h1>
          </div>
        </div>
        <motion.p 
          variants={itemVariants}
          className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 font-medium"
        >
          Collaborate, Capture, Create
        </motion.p>
        <motion.p 
          variants={itemVariants}
          className="text-base lg:text-lg text-gray-500 dark:text-gray-400 mt-2 max-w-md"
        >
          The modern workspace for teams that build together. Real-time collaboration meets intelligent project management.
        </motion.p>
      </motion.div>

      {/* Features */}
      <motion.div variants={itemVariants} className="space-y-6">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="flex items-start gap-4 group cursor-default"
            whileHover={{ x: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 dark:group-hover:from-blue-800/40 dark:group-hover:to-indigo-800/40 transition-all duration-300 shadow-sm">
              <feature.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-lg">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Stats with enhanced animations */}
      <motion.div 
        variants={itemVariants}
        className="mt-12 grid grid-cols-3 gap-6 pt-8 border-t border-gray-200/60 dark:border-gray-700/60"
      >
        <motion.div 
          className="text-center group"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            10k+
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Projects</div>
        </motion.div>
        <motion.div 
          className="text-center group"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            50k+
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Tasks</div>
        </motion.div>
        <motion.div 
          className="text-center group"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            99.9%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Uptime</div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

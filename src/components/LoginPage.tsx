"use client";

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import HeroSection from './HeroSection';
import LoginForm from './LoginForm';
import FallbackBackground from './FallbackBackground';

// Dynamically import the animated background for better performance
const AnimatedBackground = dynamic(() => import('./AnimatedBackground'), {
  ssr: false,
  loading: () => <FallbackBackground />
});

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as any
    }
  }
};

export default function LoginPage() {
  return (
    <motion.div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 relative overflow-hidden"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated Background */}
      <Suspense fallback={<FallbackBackground />}>
        <AnimatedBackground />
      </Suspense>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen">
        {/* Desktop Layout: Split */}
        <div className="hidden lg:grid lg:grid-cols-2 h-screen">
          {/* Left Side - Hero Section */}
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-r border-gray-200/50 dark:border-gray-700/50">
            <HeroSection />
          </div>
          
          {/* Right Side - Login Form */}
          <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm">
            <LoginForm />
          </div>
        </div>

        {/* Mobile Layout: Stacked */}
        <div className="lg:hidden min-h-screen flex flex-col">
          {/* Top - Hero Section (Condensed) */}
          <div className="flex-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm min-h-[45vh]">
            <div className="px-6 py-8 h-full flex flex-col justify-center">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    HackFlow
                  </h1>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-300 font-medium mb-2">
                  Collaborate, Capture, Create
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  The modern workspace for teams that build together
                </p>
              </div>
              
              {/* Quick feature highlights for mobile */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Real-time</div>
                </div>
                <div className="space-y-1">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto">
                    <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Projects</div>
                </div>
                <div className="space-y-1">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mx-auto">
                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">AI-powered</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom - Login Form */}
          <div className="flex-1 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm min-h-[55vh]">
            <LoginForm />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

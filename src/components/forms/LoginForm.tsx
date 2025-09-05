"use client";

import { motion } from 'framer-motion';
import { signIn } from "next-auth/react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loginFormVariants, loginItemVariants } from '@/config/animations';

export default function LoginForm() {
  return (
    <motion.div
      className="flex items-center justify-center h-full px-8 lg:px-12"
      variants={loginFormVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={loginItemVariants} className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl ring-1 ring-gray-200/50 dark:ring-gray-700/50">
          <CardHeader className="space-y-1 text-center pb-8">
            <CardTitle className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Welcome back
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 text-base">
              Sign in to access your collaborative workspace
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <motion.div variants={loginItemVariants}>
              <Button
                onClick={() => signIn("google")}
                variant="outline"
                className="w-full h-12 text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
            </motion.div>

            <motion.div variants={loginItemVariants}>
              <Button
                onClick={() => signIn("github")}
                variant="outline"
                className="w-full h-12 text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </Button>
            </motion.div>

            <motion.div 
              variants={loginItemVariants}
              className="pt-6 border-t border-gray-200/60 dark:border-gray-700/60"
            >
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 leading-relaxed">
                By signing in, you agree to our{' '}
                <a href="#" className="underline hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="underline hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  Privacy Policy
                </a>
                .
              </p>
            </motion.div>
          </CardContent>
        </Card>

        {/* Additional info */}
        <motion.div 
          variants={loginItemVariants}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            New to HackFlow?{' '}
            <span className="font-medium text-blue-600 dark:text-blue-400">
              Create your account instantly with OAuth
            </span>
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>Secure authentication powered by OAuth 2.0</span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

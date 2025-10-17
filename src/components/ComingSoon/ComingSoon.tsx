import { motion } from 'framer-motion';
import { Rocket, Zap } from 'lucide-react';

export function ComingSoon() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="h-full app-page-surface flex flex-col"
    >
      {/* Header */}
      <div className="px-6 py-6 flex-shrink-0">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 break-words">Coming Soon</h1>
        <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-4xl mb-8 break-words">
          Exciting new features are on their way! Stay tuned for upcoming enhancements to your Sparcclen experience.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-6 py-8 space-y-12 max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 animate-pulse"></div>
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                  <Rocket className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              New Features in Development
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              We're working hard to bring you the next level of productivity tools
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature cards with actual upcoming features */}
            {[
              { title: 'Active AI LLM', description: 'Integrated AI language models for enhanced productivity and assistance', icon: '🤖' },
              { title: 'App Updates', description: 'Seamless downloading and installation of app updates directly within the application', icon: '📥' },
              { title: 'User Interactions', description: 'Enhanced user interaction tracking and analytics for better user experience', icon: '👥' },
              { title: 'Custom Themes', description: 'Personalize your workspace with custom color schemes and visual themes', icon: '🎨' },
              { title: 'Custom Wallpapers', description: 'Set custom background wallpapers to make your workspace truly yours', icon: '🖼️' },
              { title: 'Avatar Banners', description: 'Customizable profile banners and enhanced avatar personalization options', icon: '🏷️' },
              { title: 'Messaging', description: 'Real-time messaging system for team communication and collaboration', icon: '💬' },
              { title: 'Live Support', description: 'Integrated live chat support for instant help and assistance', icon: '🆘' },
              { title: 'Database Expansion', description: 'Enhanced database capabilities with expanded storage and query options', icon: '🗄️' },
            ].map((feature, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-2xl">
                    {feature.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white break-words">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Coming Soon
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed break-words">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Status Section */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-900/10 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Zap className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-amber-800 dark:text-amber-200 mb-2">
              Stay Updated
            </h3>
            <p className="text-amber-700 dark:text-amber-300">
              We'll announce new features as they become available. 
              Keep using Sparcclen to experience them first!
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
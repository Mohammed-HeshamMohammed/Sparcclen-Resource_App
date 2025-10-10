import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Loader2, Shield, X } from 'lucide-react';

interface WindowsHelloModalProps {
  isOpen: boolean;
  email: string;
  displayName?: string;
  isAuthenticating: boolean;
  onCancel: () => void;
}

export function WindowsHelloModal({ isOpen, email, displayName, isAuthenticating, onCancel }: WindowsHelloModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={!isAuthenticating ? onCancel : undefined}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-8 pointer-events-auto relative"
            >
              {/* Close button */}
              {!isAuthenticating && (
                <button
                  onClick={onCancel}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <motion.div
                    animate={isAuthenticating ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg"
                  >
                    {isAuthenticating ? (
                      <Loader2 className="w-10 h-10 text-white animate-spin" />
                    ) : (
                      <Fingerprint className="w-10 h-10 text-white" />
                    )}
                  </motion.div>
                  
                  {/* Pulse effect */}
                  {isAuthenticating && (
                    <motion.div
                      animate={{
                        scale: [1, 1.5, 1.5],
                        opacity: [0.5, 0, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                      className="absolute inset-0 rounded-full bg-indigo-500"
                    />
                  )}
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
                {isAuthenticating ? 'Authenticating...' : 'Sign in to Sparcclen'}
              </h2>

              {/* Display Name / Email */}
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Continue as <span className="font-semibold text-indigo-600 dark:text-indigo-400">{displayName || email}</span>
              </p>

              {/* Info */}
              {!isAuthenticating && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm text-indigo-900 dark:text-indigo-200 font-medium mb-1">
                        Your Windows login already protects these credentials
                      </p>
                      <p className="text-[10px] text-indigo-700 dark:text-indigo-300 leading-tight">
                        via Windows Data Protection API (DPAPI).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status message */}
              {isAuthenticating && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-gray-600 dark:text-gray-400 mb-6"
                >
                  <p className="text-sm">Please verify your identity using Windows Hello</p>
                  <p className="text-xs mt-1 text-gray-500 dark:text-gray-500">
                    Use your PIN, fingerprint, face recognition, or password
                  </p>
                </motion.div>
              )}

              {/* Cancel button */}
              {!isAuthenticating && (
                <button
                  onClick={onCancel}
                  className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

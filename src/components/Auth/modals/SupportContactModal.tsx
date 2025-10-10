import { AnimatePresence, motion } from 'framer-motion'
import { Mail, Phone, MessageCircle, X } from 'lucide-react'
import { createPortal } from 'react-dom'

interface SupportContactModalProps {
  isOpen: boolean
  onClose: () => void
  email?: string
  phone?: string
  whatsappUrl?: string
}

export function SupportContactModal({
  isOpen,
  onClose,
  email = 'mohamedhms3102@gmail.com',
  phone = '+20 1025060508',
  whatsappUrl = 'https://wa.me/201025060508',
}: SupportContactModalProps) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (covers entire app; title bar stays above via higher z-index) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
            onClick={onClose}
          />

          {/* Modal (centered; add top padding so it sits below title bar visually) */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none pt-10">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="pointer-events-auto relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl"
            >
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-white">
                Contact Support
              </h2>
              <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
                Get in touch with our team through any of the channels below.
              </p>

              <div className="space-y-3">
                {/* Email */}
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                    <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Email</div>
                    <div className="truncate text-xs text-gray-600 dark:text-gray-400">{email}</div>
                  </div>
                </a>

                {/* WhatsApp */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">WhatsApp</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Open chat in WhatsApp</div>
                  </div>
                </a>

                {/* Phone */}
                <a
                  href={`tel:${phone.replace(/[^+\d]/g, '')}`}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Phone</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{phone}</div>
                  </div>
                </a>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={onClose}
                  className="w-full rounded-xl bg-gray-100 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}

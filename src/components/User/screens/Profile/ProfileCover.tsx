import { motion } from 'framer-motion';
import { normalizeToDataUrl } from '@/lib/utils/dataUrl'

interface ProfileCoverProps {
  coverUrl?: string | null;
  onCoverClick: () => void;
  canEdit: boolean;
}

export function ProfileCover({ coverUrl, onCoverClick, canEdit }: ProfileCoverProps) {
  const safeCoverUrl = normalizeToDataUrl(coverUrl)
  return (
    <motion.div
      className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative cursor-pointer overflow-hidden"
      onClick={canEdit ? onCoverClick : undefined}
      title={canEdit ? 'Change cover photo' : undefined}
      initial={{ scale: 1.02, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{
        // Fixed aspect ratio prevents zooming when sidebar resizes container
        aspectRatio: '16 / 5', // Consistent aspect ratio
        minHeight: '16rem', // Minimum height (h-64 equivalent)
        maxHeight: '24rem', // Maximum height (h-96 equivalent)
      }}
    >
      {safeCoverUrl && (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <img 
            src={safeCoverUrl} 
            alt="Profile cover" 
            className="w-full h-full object-cover transition-all duration-300 ease-out"
            style={{
              // Windows Fill mode: scale to fill while maintaining aspect ratio
              objectFit: 'cover',
              objectPosition: 'center center',
              // Prevent the image from being too zoomed during transitions
              minWidth: '100%',
              minHeight: '100%',
              // Subtle scaling to accommodate sidebar width changes
              transform: 'scale(1.02)',
              transformOrigin: 'center center',
            }}
          />
        </div>
      )}
      
      {/* Subtle overlay for better text visibility */}
      <div className="absolute inset-0 bg-black/5" />
    </motion.div>
  );
}

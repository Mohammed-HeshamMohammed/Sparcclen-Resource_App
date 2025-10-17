import { useState } from 'react';
import { notify } from '@/lib/toast';

interface CoverUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedImageBlob: Blob) => Promise<void>;
  currentCoverUrl?: string | null;
}


export function CoverUpload({ isOpen, onClose, onSave, currentCoverUrl }: CoverUploadProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const createScaledBlob = async (): Promise<Blob> => {
    if (!imageSrc) {
      throw new Error('No image selected');
    }

    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => { image.onload = resolve; });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    // Set canvas to standard cover dimensions (16:5 aspect ratio)
    const coverWidth = 1600;
    const coverHeight = 500;
    canvas.width = coverWidth;
    canvas.height = coverHeight;

    // Calculate scaling to fill the canvas (Windows Fill behavior)
    const scaleX = coverWidth / image.width;
    const scaleY = coverHeight / image.height;
    const scale = Math.max(scaleX, scaleY) * zoom; // Use the larger scale to fill completely

    // Calculate center positioning
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const x = (coverWidth - scaledWidth) / 2;
    const y = (coverHeight - scaledHeight) / 2;

    // Fill with gradient background first (in case of any gaps)
    const gradient = ctx.createLinearGradient(0, 0, coverWidth, 0);
    gradient.addColorStop(0, '#2563eb');
    gradient.addColorStop(0.5, '#9333ea');
    gradient.addColorStop(1, '#ec4899');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, coverWidth, coverHeight);

    // Draw the scaled image
    ctx.drawImage(image, x, y, scaledWidth, scaledHeight);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, 'image/jpeg', 0.9);
    });
  };

  const handleSave = async () => {
    if (!imageSrc) {
      notify.error('Please select an image first');
      return;
    }

    setIsUploading(true);
    try {
      const scaledBlob = await createScaledBlob();
      await onSave(scaledBlob);
      handleClose();
      notify.success('Cover photo updated successfully');
    } catch (error) {
      console.error('Error saving cover:', error);
      notify.error('Failed to save cover photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setImageSrc(null);
    setZoom(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-[95vw] max-w-4xl mx-auto overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {imageSrc ? 'Adjust Cover Photo' : 'Select Cover Photo'}
            </h3>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-96">
          {!imageSrc ? (
            // Current cover display with camera icon
            <div className="relative h-full">
              {currentCoverUrl ? (
                <img 
                  src={currentCoverUrl} 
                  alt="Current cover" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
                  <div className="text-center text-white">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg opacity-75">No cover photo</p>
                  </div>
                </div>
              )}
              
              {/* Camera icon at bottom right */}
              <label className="absolute bottom-4 right-4 w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            // Windows Fill behavior - scale whole image to fit
            <div className="relative h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              <div className="relative h-full overflow-hidden">
                <img 
                  src={imageSrc}
                  alt="Cover preview"
                  className="w-full h-full object-cover transition-transform duration-300 ease-out"
                  style={{
                    objectFit: 'cover',
                    objectPosition: 'center center',
                    // Windows Fill mode: scale to fill while maintaining aspect ratio
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center center',
                  }}
                />
                
                {/* Overlay to show it's in edit mode */}
                <div className="absolute inset-0 bg-black/10 border-2 border-dashed border-amber-400/50" />
                <div className="absolute top-4 left-4 px-3 py-1 bg-amber-500 text-white text-sm rounded-full font-medium">
                  Preview Mode
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        {imageSrc && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">Zoom</label>
                <span className="text-xs text-gray-500 dark:text-gray-400">{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setImageSrc(null)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Choose Different Photo
              </button>
              <button
                onClick={handleSave}
                disabled={isUploading || !imageSrc}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 font-medium"
              >
                {isUploading ? 'Saving...' : 'Set as Cover'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
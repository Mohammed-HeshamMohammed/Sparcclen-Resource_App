import { useState } from 'react';
import Cropper from 'react-easy-crop';
import { notify } from '@/lib/toast';

interface AvatarUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedImageBlob: Blob) => Promise<void>;
  currentAvatarUrl?: string | null;
  userInitial?: string;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function AvatarUpload({ isOpen, onClose, onSave, currentAvatarUrl, userInitial = 'U' }: AvatarUploadProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onCropComplete = (_croppedArea: unknown, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const createCroppedBlob = async (): Promise<Blob> => {
    if (!imageSrc || !croppedAreaPixels) {
      throw new Error('No image or crop area selected');
    }

    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => { image.onload = resolve; });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    // Set canvas size to the cropped area size - this maintains the exact crop
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    // Draw the cropped portion of the image
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, 'image/jpeg', 0.9);
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      notify.error('Please crop your image first');
      return;
    }

    setIsUploading(true);
    try {
      const croppedBlob = await createCroppedBlob();
      await onSave(croppedBlob);
      handleClose();
      notify.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Error saving avatar:', error);
      notify.error('Failed to save profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-[90vw] max-w-2xl mx-auto overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {imageSrc ? 'Crop Profile Picture' : 'Select Profile Picture'}
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
            // Current avatar display with camera icon - full image view
            <div className="relative h-full">
              {currentAvatarUrl ? (
                <img 
                  src={currentAvatarUrl} 
                  alt="Current avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-32 h-32 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                      <span className="text-6xl font-semibold">
                        {userInitial}
                      </span>
                    </div>
                    <p className="text-lg opacity-75">No profile picture</p>
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
            // Cropper - Square aspect ratio for profile pictures with special styling
            <div className="relative h-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
              <div className="absolute inset-4">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1} // Square aspect ratio for avatars
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  restrictPosition={true}
                  objectFit="contain"
                  cropShape="rect" // Square crop preview
                  // Remove fixed cropSize to make it flexible within bounds
                  style={{
                    containerStyle: {
                      borderRadius: '1rem',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    },
                    cropAreaStyle: {
                      border: '3px solid #3b82f6',
                      borderRadius: '8px',
                      boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.5), inset 0 0 0 1px rgba(0, 0, 0, 0.1)',
                    },
                  }}
                />
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
                disabled={isUploading || !croppedAreaPixels}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 font-medium"
              >
                {isUploading ? 'Saving...' : 'Set as Profile Picture'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
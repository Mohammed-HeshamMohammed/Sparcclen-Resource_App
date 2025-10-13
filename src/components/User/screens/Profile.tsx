import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Cropper from 'react-easy-crop';
import { notify } from '@/lib/toast';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { readSave, type SaveData } from '@/lib/system/saveClient';

export function Profile() {
  const { user } = useAuth();
  const { profile, updateDisplayName, updateAvatar } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [localDisplayName, setLocalDisplayName] = useState(profile.displayName);
  const [save, setSave] = useState<SaveData | null>(null);
  const [busy, setBusy] = useState(false);
  const newPicRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [cropping, setCropping] = useState(false);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Update local display name when profile changes
  useEffect(() => {
    setLocalDisplayName(profile.displayName)
  }, [profile.displayName])

  const handleAvatarClick = () => {
    if (!profile.email) return;
    setShowAvatarModal(true);
  };

  const handleAvatarFileSelected = async (files: FileList | null) => {
    if (!profile.email || !files || files.length === 0) return;
    const file = files[0];
    newPicRef.current = file;
    // Prepare cropping UI
    // Revoke previous preview url if any
    if (pendingImageUrl) { try { URL.revokeObjectURL(pendingImageUrl) } catch {} }
    const previewUrl = URL.createObjectURL(file);
    setPendingImageUrl(previewUrl);
    setCropping(true);
  };

  function onCropComplete(_area: unknown, areaPixels: { x: number; y: number; width: number; height: number }) {
    setCroppedAreaPixels(areaPixels)
  }

  async function getCroppedBlob(
    imageSrc: string,
    cropPx: { x: number; y: number; width: number; height: number },
    targetSize = 512
  ): Promise<Blob> {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = (e) => reject(e)
      image.src = imageSrc
    })
    const canvas = document.createElement('canvas')
    canvas.width = targetSize
    canvas.height = targetSize
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')
    ctx.drawImage(
      img,
      cropPx.x,
      cropPx.y,
      cropPx.width,
      cropPx.height,
      0,
      0,
      targetSize,
      targetSize,
    )
    // Prefer WebP for better compression; fallback to JPEG
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/webp', 0.85)
    })
    if (blob) return blob
    const jpeg = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85)
    })
    if (jpeg) return jpeg
    throw new Error('Crop failed')
  }

  const handleSaveCropped = async () => {
    if (!profile.email || !pendingImageUrl || !croppedAreaPixels) return
    setUploadingPic(true)
    try {
      try { (window as unknown as { api?: { uploads?: { begin: () => Promise<unknown> } } }).api?.uploads?.begin() } catch {}
      const blob = await getCroppedBlob(pendingImageUrl, croppedAreaPixels)
      await updateAvatar(blob)
      setShowAvatarModal(false)
      setCropping(false)
      if (pendingImageUrl) { try { URL.revokeObjectURL(pendingImageUrl) } catch {} }
      setPendingImageUrl(null)
      notify.success('Profile picture updated')
    } catch (e) {
      notify.error(`Failed to update picture${e instanceof Error && e.message ? `: ${e.message}` : ''}`)
    } finally {
      setUploadingPic(false)
      try { (window as unknown as { api?: { uploads?: { end: () => Promise<unknown> } } }).api?.uploads?.end() } catch {}
    }
  }

  // Setup save data tracking for offline fallback
  useEffect(() => {
    (async () => {
      try { const s = await readSave(); setSave(s); } catch {}
    })();
    const onSaveUpdated = (e: CustomEvent) => { try { if (e?.detail) setSave(e.detail as SaveData); } catch {} };
    window.addEventListener('save:updated', onSaveUpdated as EventListener);
    return () => {
      window.removeEventListener('save:updated', onSaveUpdated as EventListener);
    };
  }, []);

  const handleSave = async () => {
    if (!profile.email) { setIsEditing(false); return; }
    setBusy(true);
    try {
      await updateDisplayName(localDisplayName);
      setIsEditing(false);
      notify.success('Profile updated')
    } catch (e) {
      setIsEditing(false);
      notify.error(`Failed to update profile${e instanceof Error && e.message ? `: ${e.message}` : ''}`)
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="h-full bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Profile Header */}
      <div className="px-6 py-6 flex-shrink-0">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account information and preferences</p>
      </div>

      {/* Profile Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8"
          >
            {/* Profile Header */}
            <div className="flex items-center gap-6 mb-8">
              <div
                className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative cursor-pointer"
                onClick={handleAvatarClick}
                title={profile.email ? 'View profile picture' : 'Sign in to set a profile picture'}
                aria-disabled={!profile.email}
              >
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-2xl font-bold">
                    {(profile.email?.charAt(0).toUpperCase()) || profile.displayName.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {profile.displayName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {profile.email ?? (save?.offlineSession ? "Email unavailable in offline mode" : '')}
                </p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {/* Hidden file input for avatar changes */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleAvatarFileSelected(e.target.files)}
            />

            {/* Avatar Modal */}
            {showAvatarModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={() => !uploadingPic && setShowAvatarModal(false)} />
                <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 w-[90vw] max-w-md mx-auto p-6 z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Picture</h3>
                    <button
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      onClick={() => !uploadingPic && setShowAvatarModal(false)}
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-black/20 flex items-center justify-center mb-4 relative">
                    {cropping && pendingImageUrl ? (
                      <Cropper
                        image={pendingImageUrl}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        restrictPosition={true}
                        objectFit="contain"
                      />
                    ) : (
                      profile.avatarUrl ? (
                        <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-4xl font-bold">
                          {(profile.email?.charAt(0).toUpperCase()) || profile.displayName.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )
                    )}
                  </div>

                  {cropping ? (
                    <div className="flex items-center justify-between gap-4">
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1"
                      />
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => { setCropping(false); setPendingImageUrl(null); setCroppedAreaPixels(null); setZoom(1); setCrop({ x: 0, y: 0 }); }}
                          disabled={uploadingPic}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-60"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveCropped}
                          disabled={uploadingPic || !croppedAreaPixels}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                        >
                          {uploadingPic ? 'Uploading...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!profile.email || uploadingPic}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                      >
                        {uploadingPic ? 'Uploading...' : 'Change'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Profile Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={localDisplayName}
                      onChange={(e) => setLocalDisplayName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{profile.displayName}</p>
                  )}
                </div>

                {/* Picture selection is handled by clicking the avatar above */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-white">{profile.email ?? (save?.offlineSession ? "Email unavailable in offline mode" : 'Unknown')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Member Since
                  </label>
                  <p className="text-gray-900 dark:text-white">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : (save?.offlineSession ? 'Since the dawn of Offline' : 'Unknown')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Type
                  </label>
                  <p className="text-gray-900 dark:text-white">{
                    profile.accountType
                      || ((user?.user_metadata as any)?.role as string | undefined)
                      || (user ? 'Free' : (save?.offlineSession ? 'Mysterious Offline Entity' : 'Guest'))
                  }</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Imported Resources
                  </label>
                  <p className="text-gray-900 dark:text-white">{profile.importedResources}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Active
                  </label>
                  <p className="text-gray-900 dark:text-white">{user ? 'Just now' : (save?.offlineSession ? 'Right this offline moment' : 'Unknown')}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSave}
                  disabled={busy}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { readSave, type SaveData } from '@/lib/system/saveClient';
import { notify } from '@/lib/toast';
import { ProfileCover, ProfileHeader, ProfileContent, CoverUpload, AvatarUpload } from './Profile/index';

export function Profile() {
  const { user } = useAuth();
  const { profile, updateDisplayName, updateBio, updateCover, updateAvatar } = useProfile();
  
  // State management
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [localDisplayName, setLocalDisplayName] = useState(profile.displayName);
  const [localBio, setLocalBio] = useState(profile.bio || '');
  const [busy, setBusy] = useState(false);
  const [save, setSave] = useState<SaveData | null>(null);
  const [showCoverUpload, setShowCoverUpload] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  // Derived data
  const userMetadata = user?.user_metadata as Record<string, unknown> | undefined;
  const accountTypeFromAuth = (() => {
    const roleValue = userMetadata?.['role'];
    return typeof roleValue === 'string' ? roleValue : undefined;
  })();

  const memberSince = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString() 
    : (save?.offlineSession ? 'Since the dawn of Offline' : 'Unknown');
    
  const accountType = profile.accountType || accountTypeFromAuth || 
    (user ? 'Free' : (save?.offlineSession ? 'Mysterious Offline Entity' : 'Guest'));

  // Update local state when profile changes
  useEffect(() => {
    setLocalDisplayName(profile.displayName);
    setLocalBio(profile.bio || '');
  }, [profile.displayName, profile.bio]);

  // Event handlers
  const handleCoverClick = () => {
    if (profile.email) {
      setShowCoverUpload(true);
    }
  };

  const handleCoverSave = async (croppedBlob: Blob) => {
    const reader = new FileReader();
    const dataUrl: string = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(croppedBlob);
    });
    
    await updateCover(dataUrl);
  };

  const handleAvatarClick = () => {
    if (profile.email) {
      setShowAvatarUpload(true);
    }
  };

  const handleAvatarSave = async (croppedBlob: Blob) => {
    await updateAvatar(croppedBlob);
  };

  // Setup save data tracking for offline fallback
  useEffect(() => {
    (async () => {
      try { 
        const s = await readSave(); 
        setSave(s); 
      } catch {}
    })();
    
    const onSaveUpdated = (e: CustomEvent) => { 
      try { 
        if (e?.detail) setSave(e.detail as SaveData); 
      } catch {} 
    };
    
    window.addEventListener('save:updated', onSaveUpdated as EventListener);
    return () => window.removeEventListener('save:updated', onSaveUpdated as EventListener);
  }, []);

  const handleSaveName = async () => {
    if (!profile.email) {
      setEditingName(false);
      return;
    }
    
    setBusy(true);
    try {
      if (localDisplayName.trim() !== profile.displayName) {
        await updateDisplayName(localDisplayName.trim());
        notify.success('Name updated');
      }
      setEditingName(false);
    } catch (e) {
      notify.error(`Failed to update name${e instanceof Error && e.message ? `: ${e.message}` : ''}`);
      setEditingName(false);
    } finally {
      setBusy(false);
    }
  };

  const handleCancelNameEdit = () => {
    setEditingName(false);
    setLocalDisplayName(profile.displayName);
  };

  const handleSaveBio = async () => {
    if (!profile.email) {
      setEditingBio(false);
      return;
    }
    
    setBusy(true);
    try {
      await updateBio(localBio.trim() ? localBio.trim() : null);
      setEditingBio(false);
      notify.success('Bio updated');
    } catch (e) {
      notify.error(`Failed to update bio${e instanceof Error && e.message ? `: ${e.message}` : ''}`);
      setEditingBio(false);
    } finally {
      setBusy(false);
    }
  };

  const handleCancelBioEdit = () => {
    setEditingBio(false);
    setLocalBio(profile.bio || '');
  };


  return (
    <div className="h-full app-page-surface flex flex-col">
      {/* Profile Header with cover */}
      <motion.div 
        className="flex-shrink-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <ProfileCover
          coverUrl={profile.coverUrl}
          onCoverClick={handleCoverClick}
          canEdit={!!profile.email}
        />
        
        <ProfileHeader
          avatarUrl={profile.avatarUrl}
          displayName={profile.displayName}
          email={profile.email}
          canEdit={!!profile.email}
          isEditingName={editingName}
          localDisplayName={localDisplayName}
          busy={busy}
          save={save}
          onAvatarClick={handleAvatarClick}
          onLocalDisplayNameChange={setLocalDisplayName}
          onSaveName={handleSaveName}
          onCancelEdit={handleCancelNameEdit}
        />
      </motion.div>

      {/* Profile Content - Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <ProfileContent
          bio={profile.bio}
          isEditingBio={editingBio}
          localBio={localBio}
          busy={busy}
          memberSince={memberSince}
          accountType={accountType}
          onEditNameClick={() => setEditingName(true)}
          onEditBioClick={() => setEditingBio(true)}
          onLocalBioChange={setLocalBio}
          onSaveBio={handleSaveBio}
          onCancelBioEdit={handleCancelBioEdit}
        />
      </div>

      {/* Cover Upload Modal */}
      <CoverUpload
        isOpen={showCoverUpload}
        onClose={() => setShowCoverUpload(false)}
        onSave={handleCoverSave}
        currentCoverUrl={profile.coverUrl}
      />

      {/* Avatar Upload Modal */}
      <AvatarUpload
        isOpen={showAvatarUpload}
        onClose={() => setShowAvatarUpload(false)}
        onSave={handleAvatarSave}
        currentAvatarUrl={profile.avatarUrl}
        userInitial={(profile.email?.charAt(0) || profile.displayName.charAt(0) || 'U').toUpperCase()}
      />
    </div>
  );
}

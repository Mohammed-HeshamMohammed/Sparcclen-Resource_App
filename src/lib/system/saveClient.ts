export type SaveData = {
  firstRun: boolean;
  theme: 'system' | 'light' | 'dark';
  loggedInBefore: boolean;
  lastEmail: string | null;
  displayName: string | null;
  offlineSession?: boolean;
  updatedAt: string;
};

const defaultSave: SaveData = {
  firstRun: true,
  theme: 'system',
  loggedInBefore: false,
  lastEmail: null,
  displayName: null,
  offlineSession: false,
  updatedAt: new Date().toISOString(),
};

function isElectron(): boolean {
  // Heuristic: preload exposes window.api in Electron
  return typeof window !== 'undefined' && typeof window.api !== 'undefined';
}

export async function readSave(): Promise<SaveData> {
  try {
    if (isElectron()) {
      const data = await window.api.readSave();
      return { ...defaultSave, ...(data || {}) } as SaveData;
    }
    // Fallback for web: use localStorage
    const theme = (localStorage.getItem('sparcclen_theme') as 'system' | 'light' | 'dark') || 'system';
    const first = localStorage.getItem('sparcclen_first_time');
    const lastEmail = localStorage.getItem('sparcclen_last_email');
    const loggedBefore = localStorage.getItem('sparcclen_logged_in_before') === 'true';
    const displayName = localStorage.getItem('sparcclen_display_name');
    const offlineSession = localStorage.getItem('sparcclen_offline_session') === 'true';
    return {
      firstRun: first === null,
      theme,
      loggedInBefore: loggedBefore,
      lastEmail: lastEmail || null,
      displayName: displayName || null,
      offlineSession,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return { ...defaultSave };
  }
}

export async function saveWrite(patch: Partial<SaveData>): Promise<SaveData> {
  try {
    if (isElectron()) {
      const updated: SaveData = await window.api.saveWrite(patch);
      try {
        if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
          window.dispatchEvent(new CustomEvent('save:updated', { detail: updated }));
        }
      } catch {}
      return updated;
    }
    // Fallback for web: persist subset in localStorage
    if (patch.theme) localStorage.setItem('sparcclen_theme', patch.theme);
    if (typeof patch.firstRun === 'boolean') localStorage.setItem('sparcclen_first_time', String(!patch.firstRun ? 'false' : 'true'));
    if (typeof patch.loggedInBefore === 'boolean') localStorage.setItem('sparcclen_logged_in_before', String(patch.loggedInBefore));
    if (patch.lastEmail !== undefined) {
      if (patch.lastEmail) localStorage.setItem('sparcclen_last_email', patch.lastEmail);
      else localStorage.removeItem('sparcclen_last_email');
    }
    if (patch.displayName !== undefined) {
      if (patch.displayName) localStorage.setItem('sparcclen_display_name', patch.displayName);
      else localStorage.removeItem('sparcclen_display_name');
    }
    if (patch.offlineSession !== undefined) {
      if (patch.offlineSession) localStorage.setItem('sparcclen_offline_session', String(!!patch.offlineSession));
      else localStorage.removeItem('sparcclen_offline_session');
    }
    const current = await readSave();
    const updated = { ...current, ...patch, updatedAt: new Date().toISOString() } as SaveData;
    try {
      if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('save:updated', { detail: updated }));
      }
    } catch {}
    return updated;
  } catch {
    return await readSave();
  }
}

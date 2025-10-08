export type SaveData = {
  firstRun: boolean;
  theme: 'system' | 'light' | 'dark';
  loggedInBefore: boolean;
  lastEmail: string | null;
  updatedAt: string;
};

const defaultSave: SaveData = {
  firstRun: true,
  theme: 'system',
  loggedInBefore: false,
  lastEmail: null,
  updatedAt: new Date().toISOString(),
};

function isElectron(): boolean {
  // Heuristic: preload exposes window.api in Electron
  return typeof window !== 'undefined' && typeof (window as any).api !== 'undefined';
}

export async function readSave(): Promise<SaveData> {
  try {
    if (isElectron()) {
      const data = await (window as any).api.readSave();
      return { ...defaultSave, ...(data || {}) } as SaveData;
    }
    // Fallback for web: use localStorage
    const theme = (localStorage.getItem('sparcclen_theme') as 'system' | 'light' | 'dark') || 'system';
    const first = localStorage.getItem('sparcclen_first_time');
    const lastEmail = localStorage.getItem('sparcclen_last_email');
    const loggedBefore = localStorage.getItem('sparcclen_logged_in_before') === 'true';
    return {
      firstRun: first === null,
      theme,
      loggedInBefore: loggedBefore,
      lastEmail: lastEmail || null,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return { ...defaultSave };
  }
}

export async function saveWrite(patch: Partial<SaveData>): Promise<SaveData> {
  try {
    if (isElectron()) {
      return await (window as any).api.saveWrite(patch);
    }
    // Fallback for web: persist subset in localStorage
    if (patch.theme) localStorage.setItem('sparcclen_theme', patch.theme);
    if (typeof patch.firstRun === 'boolean') localStorage.setItem('sparcclen_first_time', String(!patch.firstRun ? 'false' : 'true'));
    if (typeof patch.loggedInBefore === 'boolean') localStorage.setItem('sparcclen_logged_in_before', String(patch.loggedInBefore));
    if (patch.lastEmail !== undefined) {
      if (patch.lastEmail) localStorage.setItem('sparcclen_last_email', patch.lastEmail);
      else localStorage.removeItem('sparcclen_last_email');
    }
    const current = await readSave();
    return { ...current, ...patch, updatedAt: new Date().toISOString() } as SaveData;
  } catch {
    return await readSave();
  }
}

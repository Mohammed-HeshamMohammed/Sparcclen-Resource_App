// Mirror the `src/supabase/` folder into the root `supabase/` folder.
// Usage: node scripts/mirror-src-to-supabase.js

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function copyRecursive(src, dest) {
  const stat = await fsp.stat(src);
  if (stat.isDirectory()) {
    await ensureDir(dest);
    const entries = await fsp.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
      const s = path.join(src, entry.name);
      const d = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        await copyRecursive(s, d);
      } else if (entry.isSymbolicLink()) {
        const target = await fsp.readlink(s);
        try { await fsp.symlink(target, d); } catch { /* ignore */ }
      } else {
        await ensureDir(path.dirname(d));
        await fsp.copyFile(s, d);
      }
    }
  } else {
    await ensureDir(path.dirname(dest));
    await fsp.copyFile(src, dest);
  }
}

(async () => {
  try {
    const root = process.cwd();
    const fromDir = path.resolve(root, 'src', 'supabase');
    const toDir = path.resolve(root, 'supabase');

    if (!fs.existsSync(fromDir)) {
      console.error('[mirror] Source folder not found:', fromDir);
      process.exit(1);
    }

    await ensureDir(toDir);
    await copyRecursive(fromDir, toDir);

    console.log(`[mirror] Mirrored "${fromDir}" -> "${toDir}"`);
  } catch (err) {
    console.error('[mirror] Failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();

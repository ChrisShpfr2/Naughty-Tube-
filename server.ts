import express from 'express';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import JSZip from 'jszip';

const PORT = Number(process.env.PORT || 3000);
const ROOT = process.cwd();
const REPO_DIR = path.resolve(ROOT, 'wishy-browser');

const MODIFIED_FILES = [
  {
    path: 'app/src/main/assets/automation.js',
    status: 'added',
    feature: 'Auto-fullscreen videos, Age verification bypass, Straight & Lesbian selector',
    summary: 'Document-start script handling click-to-fullscreen video playback, automatic age-gate acceptance, and strict Straight & Lesbian preference selection.'
  },
  {
    path: 'app/src/main/assets/privacy.js',
    status: 'modified',
    feature: 'Auto-reject cookies & Global pop-up blocker',
    summary: 'Clicks Reject/Decline/Essential-Only across major CMPs & Shadow DOM, unlocks scroll, overrides window.open, and removes clickjacking overlays.'
  },
  {
    path: 'app/src/main/assets/adblock.js',
    status: 'modified',
    feature: 'Ad-blocking cosmetic rules',
    summary: 'Expanded cosmetic CSS selectors hiding popunder networks, video ad overlays, and ad iframes.'
  },
  {
    path: 'app/src/main/java/org/wishy/browser/BrowserController.kt',
    status: 'modified',
    feature: 'WebView engine, script injection & global pop-up blocker',
    summary: 'Injects automation.js at document start, blocks ad redirects in shouldOverrideUrlLoading, and drops popups/cross-site popunders in onCreateWindow.'
  },
  {
    path: 'app/src/main/java/org/wishy/browser/AdBlock.kt',
    status: 'modified',
    feature: 'Global popunder & ad redirect matching',
    summary: 'Added POPUP_HOSTS set and isPopupOrAdRedirect() matcher used by request interception and popup blocking.'
  },
  {
    path: 'app/src/main/java/org/wishy/browser/Engine.kt',
    status: 'modified',
    feature: 'Privacy & Automation switches',
    summary: 'Added AUTO_VIDEO_FULLSCREEN, AGE_BYPASS, and CONTENT_PREF toggles (all enabled by default) and updated COOKIE_BANNERS & POPUPS.'
  },
  {
    path: 'app/src/main/java/org/wishy/browser/ui/pages/Privacy.kt',
    status: 'modified',
    feature: 'Settings UI groups',
    summary: 'Added Media and Automation toggle sections to the Android TV/tablet Privacy screen.'
  },
  {
    path: 'app/src/main/java/org/wishy/browser/ui/pages/Shields.kt',
    status: 'modified',
    feature: 'Shields status dashboard',
    summary: 'Displays live status for cookie auto-reject, global popup blocking, auto-fullscreen videos, age-gate bypass, and Straight & Lesbian filtering.'
  },
  {
    path: '.github/workflows/build.yml',
    status: 'modified',
    feature: 'Automatic GitHub APK CI/CD workflow',
    summary: 'Automatically builds the universal APK on every push, PR, tag, or manual dispatch, generates SHA256 checksums, and uploads artifacts.'
  }
];

const IGNORED_DIRS = new Set(['.git', '.gradle', 'build', 'output', 'dist', 'node_modules']);

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  status?: string;
}

function walkRepo(dir: string, relBase = ''): TreeNode[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const modMap = new Map(MODIFIED_FILES.map((m) => [m.path, m.status]));
  const items: TreeNode[] = [];

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      items.push({ name: entry.name, path: rel, type: 'dir' });
      items.push(...walkRepo(full, rel));
    } else if (entry.isFile()) {
      const stat = fs.statSync(full);
      items.push({
        name: entry.name,
        path: rel,
        type: 'file',
        size: stat.size,
        status: modMap.get(rel)
      });
    }
  }
  return items;
}

function resolveSafeRepoPath(relPath: string): string | null {
  const clean = relPath.replace(/^\/+/, '');
  if (!clean || clean.includes('..')) return null;
  const target = path.resolve(REPO_DIR, clean);
  if (!target.startsWith(REPO_DIR + path.sep)) return null;
  return target;
}

function addDirToZip(zip: JSZip, dir: string, relBase = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      addDirToZip(zip, full, rel);
    } else if (entry.isFile()) {
      const data = fs.readFileSync(full);
      const isExec = entry.name === 'gradlew' || entry.name.endsWith('.sh');
      zip.file(rel, data, isExec ? { unixPermissions: '755' } : undefined);
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/repo/summary', (_req, res) => {
    let gitHead = '';
    try {
      gitHead = execFileSync('git', ['-C', REPO_DIR, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
    } catch {
      gitHead = 'local';
    }
    res.json({
      sourceRepo: 'https://github.com/wishissue/WishyBrowser.git',
      baseCommit: gitHead,
      modifiedFiles: MODIFIED_FILES
    });
  });

  app.get('/api/repo/tree', (_req, res) => {
    res.json({ files: walkRepo(REPO_DIR) });
  });

  app.get('/api/repo/file', (req, res) => {
    const rel = String(req.query.path || '');
    const full = resolveSafeRepoPath(rel);
    if (!full || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    const ext = path.extname(full).toLowerCase();
    const binaryExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.jar', '.ttf', '.b64', '.ico']);
    if (binaryExts.has(ext)) {
      res.json({ path: rel, binary: true, content: '', diff: '' });
      return;
    }
    const content = fs.readFileSync(full, 'utf8');
    let diff = '';
    try {
      diff = execFileSync('git', ['-C', REPO_DIR, 'diff', '--', rel], { encoding: 'utf8' });
    } catch {
      diff = '';
    }
    res.json({ path: rel, binary: false, content, diff });
  });

  app.get('/api/repo/download.zip', async (_req, res) => {
    try {
      const zip = new JSZip();
      addDirToZip(zip, REPO_DIR);
      const buffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
        platform: 'UNIX'
      });
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="WishyBrowser-modified-repo.zip"');
      res.setHeader('Content-Length', String(buffer.length));
      res.send(buffer);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to build ZIP' });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(ROOT, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WishyBrowser Mod Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

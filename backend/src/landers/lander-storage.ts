import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

const ALLOWED_EXTENSIONS = new Set([
  '.html',
  '.htm',
  '.css',
  '.js',
  '.json',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.map',
  '.txt',
  '.xml',
  '.webmanifest',
]);

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'lander'
  );
}

export function isAllowedFile(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  if (normalized.includes('..') || normalized.startsWith('/')) return false;
  const ext = path.extname(normalized).toLowerCase();
  if (!ext) return normalized.endsWith('assets') || !path.basename(normalized).includes('.');
  return ALLOWED_EXTENSIONS.has(ext);
}

export function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function emptyDir(dir: string) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  ensureDir(dir);
}

export function copyDirRecursive(src: string, dest: string) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(full);
    else count++;
  }
  return count;
}

export function extractZipToDir(buffer: Buffer, destDir: string) {
  emptyDir(destDir);
  const zip = new AdmZip(buffer);
  const fileEntries: string[] = zip
    .getEntries()
    .filter((e) => !e.isDirectory)
    .map((e) => e.entryName.replace(/\\/g, '/'));

  const roots = new Set(
    fileEntries.map((n) => n.split('/')[0]).filter((r): r is string => Boolean(r)),
  );
  const rootList = Array.from(roots) as string[];
  const singleRoot: string = rootList.length === 1 ? rootList[0] : '';
  const stripRoot =
    singleRoot.length > 0 &&
    fileEntries.every((n) => n.includes('/')) &&
    !singleRoot.includes('.');

  const rootPrefix = stripRoot ? `${singleRoot}/` : '';

  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;
    let name = entry.entryName.replace(/\\/g, '/');
    if (stripRoot && name.startsWith(rootPrefix)) {
      name = name.slice(rootPrefix.length);
    }
    if (!name || !isAllowedFile(name)) continue;

    const outPath = path.join(destDir, name);
    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, entry.getData());
  }
}

export function writeUploadedFiles(
  files: { originalname: string; buffer: Buffer }[],
  destDir: string,
) {
  emptyDir(destDir);
  for (const file of files) {
    const relative = file.originalname.replace(/\\/g, '/').replace(/^\.?\//, '');
    if (!isAllowedFile(relative)) continue;
    const outPath = path.join(destDir, relative);
    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, file.buffer);
  }
}

export function createZipFromDir(dir: string, excludeNames: string[] = []): Buffer {
  const zip = new AdmZip();
  const exclude = new Set(excludeNames);

  function addDir(current: string, prefix = '') {
    if (!fs.existsSync(current)) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (exclude.has(entry.name)) continue;
      const full = path.join(current, entry.name);
      const zipPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        addDir(full, zipPath);
      } else {
        zip.addFile(zipPath, fs.readFileSync(full));
      }
    }
  }

  addDir(dir);
  return zip.toBuffer();
}

export function buildDeployScript(rootDomain: string | null): string {
  const remotePath = rootDomain ? `/var/www/${rootDomain}` : '/var/www/lander';
  return `#!/bin/bash
# Deploy lander files to your LP server
# Usage: bash deploy.sh

set -euo pipefail

REMOTE="\${REMOTE:-root@76.13.114.85}"
REMOTE_PATH="\${REMOTE_PATH:-${remotePath}}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Uploading lander to \${REMOTE}:\${REMOTE_PATH}/"
shopt -s extglob nullglob
for item in "$SCRIPT_DIR"/*; do
  base="$(basename "$item")"
  [ "$base" = "deploy.sh" ] && continue
  scp -r "$item" "$REMOTE:$REMOTE_PATH/"
done
echo "Done. Verify: curl -sS https://${rootDomain || 'your-domain.com'}/ | grep tracker.js"
`;
}

import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, lstatSync, readFileSync, writeFileSync, readdirSync, renameSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const MAX_ENTRY = 2 * 1024 * 1024;
const MAX_TOTAL = 16 * 1024 * 1024;
const FILE = /^[a-f\d]{64}\.json$/;

/** A bounded cache of explicitly public reads. No tokens or request headers are stored. */
export class ReadCache {
  constructor(options = {}) {
    const home = process.env.XDG_CACHE_HOME || process.env.LOCALAPPDATA || join(homedir(), '.cache');
    this.directory = resolve(options.directory || process.env.GH_AURA_CACHE_DIR || join(home, 'gh-aura'));
    this.ttl = options.ttl ?? 300000;
    this.now = options.now || Date.now;
    this.hits = 0;
    this.revalidated = 0;
    this.requests = 0;
    this.oldest = Infinity;
  }

  key(path, token = '') {
    return createHash('sha256').update('gh-aura-public-v1\0' + path + '\0' + token).digest('hex') + '.json';
  }

  safeDirectory(create = false) {
    try {
      if (create) mkdirSync(this.directory, { recursive: true, mode: 0o700 });
      const stat = lstatSync(this.directory);
      return stat.isDirectory() && !stat.isSymbolicLink();
    } catch { return false; }
  }

  read(path, token) {
    try {
      if (!this.safeDirectory()) return null;
      const filename = join(this.directory, this.key(path, token));
      const stat = lstatSync(filename);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_ENTRY) return null;
      const entry = JSON.parse(readFileSync(filename, 'utf8'));
      if (entry.version !== 1 || !Number.isFinite(entry.time) || entry.time > this.now() ||
          this.now() - entry.time > 7 * 86400000 || !Object.hasOwn(entry, 'data')) return null;
      if (entry.etag && (typeof entry.etag !== 'string' || entry.etag.length > 512 || /[\r\n]/.test(entry.etag))) return null;
      return entry;
    } catch { return null; } // An unreadable cache never prevents a normal online read.
  }

  fresh(entry) { return entry && this.now() - entry.time < this.ttl; }
  observe(entry) { this.oldest = Math.min(this.oldest, entry.time); return structuredClone(entry.data); }

  write(path, token, data, etag = null) {
    let temporary;
    try {
      if (!this.safeDirectory(true)) return;
      const entry = { version: 1, time: this.now(), etag: etag || null, data };
      const content = JSON.stringify(entry);
      if (Buffer.byteLength(content) > MAX_ENTRY) return;
      const filename = join(this.directory, this.key(path, token));
      temporary = filename + '.' + randomUUID() + '.tmp';
      writeFileSync(temporary, content, { flag: 'wx', mode: 0o600 });
      renameSync(temporary, filename);
      const files = readdirSync(this.directory).filter((name) => FILE.test(name)).map((name) => {
        const stat = lstatSync(join(this.directory, name));
        return { name, size: stat.size, time: stat.mtimeMs, regular: stat.isFile() && !stat.isSymbolicLink() };
      }).filter((file) => file.regular).sort((a, b) => a.time - b.time);
      let size = files.reduce((sum, file) => sum + file.size, 0);
      while (files.length > 128 || size > MAX_TOTAL) {
        const file = files.shift(); unlinkSync(join(this.directory, file.name)); size -= file.size;
      }
    } catch { /* Disk caching is optional; permissions or quota failures are not API errors. */ }
    finally { if (temporary) { try { unlinkSync(temporary); } catch { /* already renamed */ } } }
  }

  remove(path, token) {
    try { if (this.safeDirectory()) unlinkSync(join(this.directory, this.key(path, token))); } catch { /* missing */ }
  }

  summary() {
    return { networkRequests: this.requests, cacheHits: this.hits, revalidated: this.revalidated,
      oldestCachedObservation: Number.isFinite(this.oldest) ? new Date(this.oldest).toISOString() : null };
  }
}

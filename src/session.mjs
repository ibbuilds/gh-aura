/** Per-command resource limits. No credentials, endpoints or response bodies are logged. */
export class ReadSession {
  constructor({ maxRequests = 60, maxResponseBytes = 2 * 1024 * 1024,
    maxTotalBytes = 32 * 1024 * 1024, fetch: transport = globalThis.fetch } = {}) {
    for (const [name, value, max] of [['maxRequests', maxRequests, 500],
      ['maxResponseBytes', maxResponseBytes, 16 * 1024 * 1024],
      ['maxTotalBytes', maxTotalBytes, 64 * 1024 * 1024]]) {
      if (!Number.isInteger(value) || value < 1 || value > max) throw new Error('Invalid resource limit: ' + name);
    }
    this.maxRequests = maxRequests;
    this.maxResponseBytes = maxResponseBytes;
    this.maxTotalBytes = maxTotalBytes;
    this.transport = transport;
    this.requests = 0;
    this.bytes = 0;
    this.started = performance.now();
    this.failure = null;
    this.fetch = this.fetch.bind(this);
  }

  stop(message) {
    const error = new Error(message);
    error.code = 'GH_AURA_BUDGET';
    this.failure = error;
    return error;
  }

  async fetch(url, options = {}) {
    const method = options.method || 'GET';
    if (method !== 'GET' && !(method === 'POST' && url === 'https://api.github.com/graphql')) {
      throw this.stop('Read sessions do not permit remote writes. Use the separate reviewed publication flow.');
    }
    if (method === 'POST') {
      let query;
      try { query = JSON.parse(options.body).query; } catch { /* reject below */ }
      if (typeof query !== 'string' || !/^\s*(?:query\b|\{)/.test(query) || /\bmutation\b/.test(query)) throw this.stop('Only read-only GraphQL queries are permitted in a read session.');
    }
    if (this.requests >= this.maxRequests) throw this.stop('Request budget reached (' + this.maxRequests + '). Reduce inspection or deliberately increase --budget.');
    if (this.bytes >= this.maxTotalBytes) throw this.stop('Response byte budget reached. Reduce this scan.');
    this.requests++;
    const response = await this.transport(url, options);
    if (!response.ok) {
      await response.body?.cancel?.().catch(() => {});
      return response;
    }
    let parsed;
    return {
      ok: response.ok, status: response.status, headers: response.headers,
      json: () => parsed ??= this.read(response),
    };
  }

  async read(response) {
    let bytes = 0;
    const count = (size) => {
      bytes += size;
      this.bytes += size;
      if (bytes > this.maxResponseBytes || this.bytes > this.maxTotalBytes) {
        throw this.stop('GitHub response exceeds the bounded read budget; no partial data was used.');
      }
    };
    // The fallback supports injected transports used in offline tests.
    if (!response.body?.getReader) {
      const value = await response.json();
      count(Buffer.byteLength(JSON.stringify(value)));
      return value;
    }
    const reader = response.body.getReader();
    const chunks = [];
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        count(value.byteLength);
        chunks.push(value);
      }
      return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)));
    } catch (error) {
      await reader.cancel().catch(() => {});
      throw error;
    } finally { reader.releaseLock(); }
  }

  summary() {
    return { networkRequests: this.requests, responseBytes: this.bytes, requestBudget: this.maxRequests,
      responseByteLimit: this.maxResponseBytes, totalByteLimit: this.maxTotalBytes,
      elapsedMs: Math.round(performance.now() - this.started), rssMiB: Math.round(process.memoryUsage().rss / 1048576) };
  }
}

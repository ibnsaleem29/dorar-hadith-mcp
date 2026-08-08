const http = require('http');
const https = require('https');
const zlib = require('zlib');
const { URL } = require('url');

const AppError = require('./AppError');
const config = require('../config/config');

const MAX_REDIRECTS = 10;

// dorar.net sits behind Cloudflare, which fingerprints the TLS/HTTP client itself
// (JA3/JA4-style) and blocks Node's native fetch() (undici) even with byte-identical
// headers to a client that passes — verified against curl and against Node's own core
// https module, both of which pass with the same headers. So this deliberately uses
// Node's core http/https request instead of fetch(), wrapped to expose the same
// Response-like interface (ok/status/statusText/text()/json()) callers already rely on.
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'ar,en;q=0.9',
  Referer: 'https://dorar.net/',
  Origin: 'https://dorar.net',
  Connection: 'keep-alive',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
};

const decompress = (buffer, contentEncoding) => {
  switch (contentEncoding) {
    case 'gzip':
      return zlib.gunzipSync(buffer);
    case 'deflate':
      return zlib.inflateSync(buffer);
    case 'br':
      return zlib.brotliDecompressSync(buffer);
    default:
      return buffer;
  }
};

const requestOnce = (urlString, options, signal) =>
  new Promise((resolve, reject) => {
    // Guard against settling twice: a socket that's destroyed mid-response can fire
    // 'close' after we've already settled via 'end', and vice versa isn't possible,
    // but this keeps the promise contract solid either way.
    let settled = false;
    const settleResolve = (value) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    const settleReject = (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    };

    const target = new URL(urlString);
    const client = target.protocol === 'http:' ? http : https;

    const req = client.request(
      {
        hostname: target.hostname,
        port: target.port || (target.protocol === 'http:' ? 80 : 443),
        path: target.pathname + target.search,
        method: options.method || 'GET',
        headers: BROWSER_HEADERS,
        signal,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          let body;
          try {
            body = decompress(Buffer.concat(chunks), res.headers['content-encoding']);
          } catch (decompressError) {
            settleReject(decompressError);
            return;
          }
          settleResolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers,
            body,
          });
        });
        // A connection dropped mid-body doesn't necessarily emit 'error' on the
        // response — it can just emit 'close' without 'end' ever having fired,
        // which would otherwise hang the request past even the configured timeout.
        res.on('error', (err) => {
          settleReject(new AppError(`Response stream error: ${err.message}`, 502));
        });
        res.on('close', () => {
          settleReject(new AppError('Response ended prematurely before completion', 502));
        });
      },
    );

    req.on('error', settleReject);
    req.end();
  });

const fetchWithTimeout = async (url, options = {}) => {
  const timeout = config.fetchTimeout;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    let currentUrl = url;
    let redirectCount = 0;
    let raw;

    // Node's core http/https request doesn't auto-follow redirects the way fetch()
    // does, and dorar.net responds with 301s (e.g. www -> bare domain), so this has
    // to be done manually to keep the same behavior callers already depend on.
    for (;;) {
      raw = await requestOnce(currentUrl, options, controller.signal);

      if ([301, 302, 303, 307, 308].includes(raw.statusCode) && raw.headers.location) {
        redirectCount += 1;
        if (redirectCount > MAX_REDIRECTS) {
          throw new AppError('Too many redirects', 502);
        }
        currentUrl = new URL(raw.headers.location, currentUrl).toString();
        continue;
      }
      break;
    }

    clearTimeout(id);

    const status = raw.statusCode;
    const ok = status >= 200 && status < 300;
    const response = {
      ok,
      status,
      statusText: raw.statusMessage,
      text: async () => raw.body.toString('utf-8'),
      json: async () => JSON.parse(raw.body.toString('utf-8')),
    };

    if (!response.ok) {
      throw new AppError(`Failed to fetch data: ${response.statusText}`, response.status);
    }

    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError' || error.code === 'ABORT_ERR') {
      throw new AppError('Request timeout. Please try again later.', 408);
    }
    throw error;
  }
};

module.exports = fetchWithTimeout;

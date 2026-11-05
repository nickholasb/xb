const express = require('express');
const path = require('node:path');
const { isIP } = require('node:net');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: '8kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function isPrivateOrLocalHost(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;

  const version = isIP(host);
  if (version === 4) {
    const octets = host.split('.').map(Number);
    const [a, b] = octets;
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  if (version === 6) {
    return host === '::' || host === '::1' || host.startsWith('fc') || host.startsWith('fd') ||
      host.startsWith('fe8') || host.startsWith('fe9') || host.startsWith('fea') || host.startsWith('feb') ||
      host.startsWith('::ffff:127.') || host.startsWith('::ffff:10.') || host.startsWith('::ffff:192.168.');
  }
  return false;
}

function inspectUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) throw new Error('Enter a URL under 2048 characters.');
  let parsed;
  try { parsed = new URL(value.trim()); } catch { throw new Error('Enter a valid absolute URL.'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only http and https URLs are supported.');
  if (parsed.username || parsed.password) throw new Error('URLs containing embedded credentials are not accepted.');
  if (isPrivateOrLocalHost(parsed.hostname)) throw new Error('Local and private-network hosts are not accepted.');

  return {
    url: parsed.toString(),
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    path: parsed.pathname,
    usesHttps: parsed.protocol === 'https:',
    hasNonstandardPort: parsed.port !== '' && !['80', '443'].includes(parsed.port),
    queryParameterCount: [...parsed.searchParams.keys()].length
  };
}

async function getGeminiSummary(metadata) {
  if (!process.env.GEMINI_API_KEY) return 'AI summary is not configured. Set GEMINI_API_KEY on the server to enable it.';
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
  const prompt = `Give a cautious, concise explanation of these URL metadata signals. Do not claim the URL is safe or malicious based only on metadata. The website has not been contacted and redirects were not followed.\n${JSON.stringify(metadata)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`Gemini request failed (${response.status}).`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n') || 'No AI summary was returned.';
}

app.post('/api/check-url', async (req, res) => {
  try {
    const metadata = inspectUrl(req.body?.url);
    let aiSummary;
    try { aiSummary = await getGeminiSummary(metadata); }
    catch (error) { aiSummary = `AI analysis unavailable: ${error.message}`; }
    res.json({ metadata, aiSummary, note: 'This checker only parses the submitted URL. It does not open it, follow redirects, or bypass website controls.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`URL checker listening on port ${PORT}`));

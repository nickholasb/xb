const form = document.querySelector('#checker-form');
const input = document.querySelector('#url');
const status = document.querySelector('#status');
const results = document.querySelector('#results');
const details = document.querySelector('#details');
const summary = document.querySelector('#summary');
const note = document.querySelector('#note');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.textContent = 'Analyzing URL metadata…';
  results.hidden = true;
  try {
    const response = await fetch('/api/check-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: input.value.trim() })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to analyze this URL.');

    const labels = {
      url: 'URL', protocol: 'Protocol', hostname: 'Hostname', path: 'Path',
      usesHttps: 'Uses HTTPS', hasNonstandardPort: 'Nonstandard port',
      queryParameterCount: 'Query parameter count'
    };
    details.replaceChildren();
    for (const [key, label] of Object.entries(labels)) {
      const term = document.createElement('dt');
      const value = document.createElement('dd');
      term.textContent = label;
      value.textContent = String(data.metadata[key]);
      details.append(term, value);
    }
    summary.textContent = data.aiSummary;
    note.textContent = data.note;
    results.hidden = false;
    status.textContent = 'Analysis complete.';
  } catch (error) {
    status.textContent = error.message;
  }
});

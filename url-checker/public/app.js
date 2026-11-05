const form = document.querySelector('#checker-form');
const input = document.querySelector('#url');
const status = document.querySelector('#status');
const results = document.querySelector('#results');
const details = document.querySelector('#details');
const summary = document.querySelector('#summary');
const note = document.querySelector('#note');
const pasteBtn = document.querySelector('#pasteBtn');
const copyBtn = document.querySelector('#copyBtn');
let analyzedUrl = '';

if (window.lucide) lucide.createIcons();

pasteBtn.addEventListener('click', async () => {
  try {
    input.value = await navigator.clipboard.readText();
    input.focus();
  } catch {
    status.textContent = 'Clipboard tidak dapat diakses. Tempel URL secara manual.';
  }
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(analyzedUrl);
    status.textContent = 'URL berhasil disalin.';
  } catch {
    status.textContent = 'Gagal menyalin URL. Silakan salin secara manual.';
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.textContent = 'Menganalisis metadata URL…';
  results.classList.add('hidden');
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const response = await fetch('/api/check-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: input.value.trim() })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Tidak dapat menganalisis URL.');

    analyzedUrl = data.metadata.url;
    const labels = {
      url: 'URL', protocol: 'Protokol', hostname: 'Hostname', path: 'Path',
      usesHttps: 'Menggunakan HTTPS', hasNonstandardPort: 'Port nonstandar',
      queryParameterCount: 'Jumlah parameter query'
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
    results.classList.remove('hidden');
    status.textContent = 'Analisis selesai.';
    if (window.lucide) lucide.createIcons();
  } catch (error) {
    status.textContent = error.message || 'Terjadi kesalahan saat menganalisis URL.';
  } finally {
    submitButton.disabled = false;
  }
});

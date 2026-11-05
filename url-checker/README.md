# AI URL Safety Checker

A small website that parses URL metadata and can ask Gemini to explain the visible signals. It does not visit submitted URLs, follow redirects, bypass access controls, or establish that a site is safe.

## Run locally

Requires Node.js 18 or newer.

```bash
cd url-checker
npm install
cp .env.example .env
```

Put a newly created Gemini key in `.env` as `GEMINI_API_KEY`, then start the server:

```bash
npm start
```

Visit `http://localhost:3000`. Keep `.env` private; configure `GEMINI_API_KEY` as a secret/environment variable on your hosting provider for deployment. Never put the key in browser code.

## Notes

The API validates HTTP(S) URLs and reports basic metadata. It rejects local/private IP hosts and embedded URL credentials. The server does not make requests to user-submitted URLs; it only sends URL metadata to the Gemini API when configured. AI output is informational, not a security guarantee.

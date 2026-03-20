'use strict';

const express = require('express');
const path    = require('path');
const helmet  = require('helmet');

const app  = express();
const PORT = process.env.PORT || 3010;

/* ── Security headers ── */
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc:   ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
            fontSrc:    ["'self'", "https://fonts.gstatic.com"],
            imgSrc:     ["'self'", "data:"],
            scriptSrc:  ["'self'"],
            connectSrc: ["'self'"],
        }
    }
}));

/* ── Static files ── */
app.use(express.static(path.join(__dirname), {
    index: false,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

/* ── Health check ── */
app.get('/api/health', (_req, res) => {
    res.json({ ok: true, status: 'ORO Solution Website running', timestamp: new Date().toISOString() });
});

/* ── Main route ── */
app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/* ── Legal pages ── */
['mentions-legales', 'confidentialite', 'cgu'].forEach(page => {
    app.get(`/${page}`, (_req, res) => {
        res.sendFile(path.join(__dirname, 'index.html')); // fallback until pages are created
    });
});

/* ── 404 ── */
app.use((_req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, () => {
    console.log(`ORO Solution Website → http://localhost:${PORT}`);
});

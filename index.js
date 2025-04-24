#!/usr/bin/env node
const path = require('path');
const express = require('express');
const https = require('https');

// Create express application
const app = express();

// Settings
const hostname = '0.0.0.0';
const port = process.env.PORT || 1234; // Use Render's PORT or fallback to 1234
const enableCORS = true;
const enableWasmMultithreading = true;

// Proxy endpoint for ip-api
app.get('/api/ip/:ip', (req, res) => {
    const ip = req.params.ip;
    console.log('Proxy endpoint called for IP:', ip);
    
    https.get(`https://ip-api.com/json/${ip}`, (apiRes) => {
        console.log('IP-API request made, status:', apiRes.statusCode);
        let data = '';
        apiRes.on('data', (chunk) => {
            data += chunk;
        });
        apiRes.on('end', () => {
            console.log('IP-API response received:', data);
            res.json(JSON.parse(data));
        });
    }).on('error', (err) => {
        console.error('Error fetching IP data:', err);
        res.status(500).json({ error: 'Failed to fetch IP data' });
    });
});

// Serve static files with correct MIME types
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.wasm')) {
            res.setHeader('Content-Type', 'application/wasm');
        } else if (path.endsWith('.ico')) {
            res.setHeader('Content-Type', 'image/x-icon');
        } else if (path.endsWith('.data') || path.endsWith('.unityweb')) {
            res.setHeader('Content-Type', 'application/octet-stream');
        }

        // Set cache control for static assets
        if (path.endsWith('.wasm') || path.endsWith('.data') || path.endsWith('.unityweb')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

// Middleware for CORS and other headers
app.use((req, res, next) => {
    // Set CORS headers
    if (enableCORS) {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
    }

    // Set COOP, COEP, and CORP headers for SharedArrayBuffer
    if (enableWasmMultithreading) {
        res.set('Cross-Origin-Opener-Policy', 'same-origin');
        res.set('Cross-Origin-Embedder-Policy', 'require-corp');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }

    next();
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Handle 404 errors
app.use((req, res, next) => {
    res.status(404).send('File not found');
});

const server = app.listen(port, hostname, () => {
    console.log(`Web server running at http://${hostname}:${port}`);
    console.log(`Serving files from: ${path.join(__dirname, 'public')}`);
});

server.addListener('error', (error) => {
    console.error('Server error:', error);
});

server.addListener('close', () => {
    console.log('Server stopped.');
    process.exit();
}); 
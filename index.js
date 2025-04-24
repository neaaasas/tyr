#!/usr/bin/env node
const path = require('path');
const express = require('express');
const fs = require('fs');

// Create express application
const app = express();

// Settings
const hostname = '0.0.0.0';
const port = 1234;
const enableCORS = true;
const enableWasmMultithreading = true;

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
    }
}));

// Middleware for CORS and other headers
app.use((req, res, next) => {
    // Set CORS headers
    if (enableCORS) {
        res.set('Access-Control-Allow-Origin', '*');
    }

    // Set COOP, COEP, and CORP headers for SharedArrayBuffer
    if (enableWasmMultithreading) {
        res.set('Cross-Origin-Opener-Policy', 'same-origin');
        res.set('Cross-Origin-Embedder-Policy', 'require-corp');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }

    next();
});

// Handle 404 errors
app.use((req, res, next) => {
    res.status(404).send('File not found');
});

const server = app.listen(port, hostname, () => {
    console.log(`Web server serving directory ${path.join(__dirname, 'public')} at http://${hostname}:${port}`);
});

server.addListener('error', (error) => {
    console.error(error);
});

server.addListener('close', () => {
    console.log('Server stopped.');
    process.exit();
}); 
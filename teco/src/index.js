const express = require('express');
const ZKPush = require('./communications/ZKPush');

const app = express();
const port = process.env.PORT || 8000;

// Create a map to store device connections by serial number
const devices = new Map();

// Middleware to parse raw body
app.use(express.raw({ type: '*/*', limit: '10mb' }));

// Middleware to handle device identification
app.use((req, res, next) => {
    const sn = req.query.SN;
    if (!sn) {
        return res.status(400).send('Missing device serial number');
    }

    if (!devices.has(sn)) {
        const device = new ZKPush(sn);
        device.on('deviceMessage', ({ serialNumber, message }) => {
            console.log(`[${serialNumber}] ${message}`);
        });
        devices.set(sn, device);
    }

    req.device = devices.get(sn);
    next();
});

// Route handler for all iclock endpoints
app.all('/iclock/*', (req, res) => {
    req.device.processRequest(req, res);
});

// Start the server
app.listen(port, () => {
    console.log(`ZKTeco Push server listening at http://localhost:${port}`);
}); 
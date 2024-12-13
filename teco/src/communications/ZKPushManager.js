const { EventEmitter } = require('events');
const { DeviceEventArgs, ServerLogEventArgs } = require('../events');
const ZKPush = require('./ZKPush');

class ZKPushManager extends EventEmitter {
    constructor() {
        super();
        this.devices = new Map();
        this.server = null;
    }

    start(port = 3000) {
        if (this.server) {
            this.emit('serverLog', new ServerLogEventArgs('Server is already running'));
            return;
        }

        const http = require('http');
        this.server = http.createServer((req, res) => {
            this.processRequest(req, res);
        });

        this.server.listen(port, () => {
            this.emit('serverLog', new ServerLogEventArgs(`Server started on port ${port}`));
        });

        this.server.on('error', (error) => {
            this.emit('serverLog', new ServerLogEventArgs(`Server error: ${error.message}`));
        });
    }

    stop() {
        if (!this.server) {
            this.emit('serverLog', new ServerLogEventArgs('Server is not running'));
            return;
        }

        this.server.close(() => {
            this.emit('serverLog', new ServerLogEventArgs('Server stopped'));
            this.server = null;
        });
    }

    processRequest(req, res) {
        try {
            const serialNumber = this.getSerialNumber(req);
            if (!serialNumber) {
                res.writeHead(400);
                res.end('Invalid request: Missing serial number');
                return;
            }

            let device = this.devices.get(serialNumber);
            if (!device) {
                device = new ZKPush(serialNumber);
                device.on('deviceMessage', (args) => this.emit('deviceMessage', args));
                this.devices.set(serialNumber, device);
                this.emit('deviceConnected', new DeviceEventArgs(serialNumber, device));
            }

            device.processRequest(req, res);
        } catch (error) {
            this.emit('serverLog', new ServerLogEventArgs(`Error processing request: ${error.message}`));
            res.writeHead(500);
            res.end('Internal server error');
        }
    }

    getSerialNumber(req) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const params = new URLSearchParams(url.search);
        return params.get('SN') || null;
    }

    getDevice(serialNumber) {
        return this.devices.get(serialNumber);
    }
}

module.exports = ZKPushManager;

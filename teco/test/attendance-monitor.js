const  ZKPushManager  = require('../src/communications/ZKPushManager');

class AttendanceMonitor {
    constructor() {
        this.manager = new ZKPushManager();
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Server events
        this.manager.on('serverLog', (args) => {
            console.log(`[Server] ${args.message}`);
        });

        // Device connection events
        this.manager.on('deviceConnected', (args) => {
            console.log(`[Device Connected] Serial Number: ${args.serialNumber}`);
            this.initializeDevice(args.device);
        });

        // Device message events
        this.manager.on('deviceMessage', (args) => {
            console.log(`[Device ${args.serialNumber}] ${args.message}`);
        });
    }

    async initializeDevice(device) {
        try {
            // 1. Sync device time
            await device.sendDateAndTime();
            console.log(`[Device ${device.serialNumber}] Time synchronized`);

            // 2. Get device information
            await device.getOptions();

            // 3. Start monitoring attendance
            this.startAttendanceMonitoring(device);

        } catch (error) {
            console.error(`[Device ${device.serialNumber}] Initialization error:`, error);
        }
    }

    async startAttendanceMonitoring(device) {
        try {
            // Initial data fetch
            await this.fetchAttendanceData(device);

            // Set up periodic attendance checking
            setInterval(async () => {
                await this.fetchAttendanceData(device);
            }, 5 * 60 * 1000); // Check every 5 minutes

        } catch (error) {
            console.error(`[Device ${device.serialNumber}] Monitoring error:`, error);
        }
    }

    async fetchAttendanceData(device) {
        try {
            console.log(`\n[Device ${device.serialNumber}] Fetching attendance data...`);
            
            // Get transactions (attendance records)
            await device.receiveTransactions();

            // You could store these in a database, emit events, etc.
            // For this example, we're just logging them via the deviceMessage event

        } catch (error) {
            console.error(`[Device ${device.serialNumber}] Error fetching attendance:`, error);
        }
    }

    async start(port = 8000) {
        try {
            this.manager.start(port);
            console.log(`Attendance monitoring server started on port ${port}`);

            // Handle graceful shutdown
            process.on('SIGINT', async () => {
                console.log('\nShutting down attendance monitor...');
                this.manager.stop();
                process.exit(0);
            });

        } catch (error) {
            console.error('Failed to start attendance monitor:', error);
            process.exit(1);
        }
    }
}

// Example usage
async function main() {
    const monitor = new AttendanceMonitor();
    await monitor.start(8000);
}

// Run the attendance monitor
if (require.main === module) {
    main().catch(console.error);
}

module.exports = AttendanceMonitor;

/*
Example Usage:

1. Run this file:
   node attendance-monitor.js

2. The server will start on port 8000 and wait for device connections

3. When a ZKTeco device connects:
   - Time will be synchronized
   - Device information will be retrieved
   - Attendance monitoring will start automatically
   - Every 5 minutes, new attendance records will be fetched

4. To stop the monitor:
   Press Ctrl+C

Expected Output:
Attendance monitoring server started on port 8000
[Server] Server started on port 8000
[Device Connected] Serial Number: ABCD123456
[Device ABCD123456] Time synchronized
[Device ABCD123456] Fetching attendance data...
[Device ABCD123456] TRANSACTION: PIN - 1 - DATETIME - 2023-12-12T10:30:00
[Device ABCD123456] TRANSACTION: PIN - 2 - DATETIME - 2023-12-12T10:35:00
...

Notes:
- This example focuses specifically on attendance monitoring
- It automatically handles device connections
- It periodically fetches new attendance data
- You can extend it to store data in a database or integrate with other systems
*/ 
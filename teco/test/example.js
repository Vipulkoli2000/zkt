const ZKPushManager  = require('../src/communications/ZKPushManager');

// Create and configure the ZKPush manager
const manager = new ZKPushManager();

// Event Handlers
manager.on('serverLog', (args) => {
    console.log(`[Server] ${args.message}`);
});

manager.on('deviceConnected', (args) => {
    console.log(`[Device Connected] Serial Number: ${args.serialNumber}`);
    
    // Example: When a device connects, we can interact with it
    const device = args.device;
    
    // Set device date and time
    device.sendDateAndTime()
        .then(() => console.log(`[Device ${args.serialNumber}] Date and time synchronized`))
        .catch(err => console.error(`[Device ${args.serialNumber}] Error syncing time:`, err));
});

manager.on('deviceMessage', (args) => {
    console.log(`[Device ${args.serialNumber}] ${args.message}`);
});

// Example functions to interact with a device
async function performDeviceOperations(serialNumber) {
    const device = manager.getDevice(serialNumber);
    if (!device) {
        console.log(`No device found with serial number: ${serialNumber}`);
        return;
    }

    try {
        // 1. Get device options
        console.log('\n=== Getting Device Options ===');
        await device.getOptions();

        // 2. Send users to device
        console.log('\n=== Sending Users to Device ===');
        await device.sendUsers();

        // 3. Receive existing users from device
        console.log('\n=== Receiving Users from Device ===');
        await device.receiveUsers();

        // 4. Get transactions
        console.log('\n=== Getting Transactions ===');
        await device.receiveTransactions();

        // 5. Get biometric templates
        console.log('\n=== Getting Biometric Templates ===');
        await device.receiveTemplates();

        // 6. Get face templates
        console.log('\n=== Getting Face Templates ===');
        await device.receiveBiophotos();

    } catch (error) {
        console.error('Error performing device operations:', error);
    }
}

// Example of how to use the system
async function main() {
    try {
        // Start the server on port 8000
        manager.start(3000);

        // Example: If you know a device's serial number and want to interact with it directly
        // Note: This is just an example, normally you'd wait for the device to connect
        manager.processRequest();
        setTimeout(async () => {
             await performDeviceOperations(testSerialNumber);
        }, 5000); // Wait 5 seconds after server start

        // Handle process termination
        process.on('SIGINT', () => {
            console.log('\nShutting down server...');
            manager.stop();
            process.exit(0);
        });

    } catch (error) {
        console.error('Error in main:', error);
        process.exit(1);
    }
}

// Run the example
main().catch(console.error);

/*
Example Usage:

1. Run this file:
   node example.js

2. The server will start on port 8000 and wait for device connections

3. When a ZKTeco device connects:
   - It will automatically be registered
   - The current date/time will be synchronized
   - You'll see all device messages in the console

4. After 5 seconds, it will attempt to perform operations on a test device
   (Note: This is just for demonstration, real devices need to connect first)

5. To stop the server:
   Press Ctrl+C

Expected Output:
[Server] Server started on port 8000
[Device Connected] Serial Number: ABCD123456
[Device ABCD123456] Date and time synchronized
=== Getting Device Options ===
[Device ABCD123456] OPTIONS: DeviceName - ExampleDevice
[Device ABCD123456] OPTIONS: FirmVer - 1.0.0
...

Notes:
- The actual device serial number will be different
- You'll see different messages depending on the device's responses
- Some operations might fail if the device doesn't support them
*/ 
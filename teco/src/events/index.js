class DeviceMessageEventArgs {
    constructor(serialNumber, message) {
        this.serialNumber = serialNumber;
        this.message = message;
    }
}

class DeviceEventArgs {
    constructor(serialNumber, device) {
        this.serialNumber = serialNumber;
        this.device = device;
    }
}

class ServerLogEventArgs {
    constructor(message) {
        this.message = message;
    }
}

module.exports = {
    DeviceMessageEventArgs,
    DeviceEventArgs,
    ServerLogEventArgs
}; 
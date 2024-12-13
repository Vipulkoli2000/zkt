class Transaction {
    constructor(data = {}) {
        this.pin = data.pin || '';
        this.dateTime = data.dateTime || new Date();
        this.status = data.status || 0;
    }

    getTableName() {
        return 'transaction';
    }

    toProtocol() {
        return [
            'Pin=' + this.pin,
            'DateTime=' + Math.floor(this.dateTime.getTime() / 1000),
            'Status=' + this.status
        ].join('\t');
    }
}

module.exports = Transaction; 
class Biophoto {
    constructor(data = {}) {
        this.pin = data.pin || '';
        this.fileName = data.fileName || '';
        this.size = data.size || 0;
    }

    getTableName() {
        return 'biophoto';
    }

    toProtocol() {
        return [
            'Pin=' + this.pin,
            'FileName=' + this.fileName,
            'Size=' + this.size
        ].join('\t');
    }
}

module.exports = Biophoto; 
class Templatev10 {
    constructor(data = {}) {
        this.pin = data.pin || '';
        this.fingerIndex = data.fingerIndex || 0;
        this.template = data.template || '';
    }

    getTableName() {
        return 'templatev10';
    }

    toProtocol() {
        return [
            'Pin=' + this.pin,
            'FingerIndex=' + this.fingerIndex,
            'Template=' + this.template
        ].join('\t');
    }
}

module.exports = Templatev10; 
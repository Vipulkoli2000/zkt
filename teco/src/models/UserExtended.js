class UserExtended {
    constructor(data = {}) {
        this.pin = data.pin || '';
        this.verifyMode = data.verifyMode || 0;
        this.enabled = data.enabled || true;
    }

    getTableName() {
        return 'userextended';
    }

    toProtocol() {
        return [
            'Pin=' + this.pin,
            'VerifyMode=' + this.verifyMode,
            'Enabled=' + (this.enabled ? 1 : 0)
        ].join('\t');
    }
}

module.exports = UserExtended; 
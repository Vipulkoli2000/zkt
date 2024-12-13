class UserAuthorize {
    constructor(data = {}) {
        this.pin = data.pin || '';
        this.authorizationToken = data.authorizationToken || '';
        this.validityPeriod = data.validityPeriod || 0;
    }

    getTableName() {
        return 'userauthorize';
    }

    toProtocol() {
        return [
            'Pin=' + this.pin,
            'AuthorizationToken=' + this.authorizationToken,
            'ValidityPeriod=' + this.validityPeriod
        ].join('\t');
    }
}

module.exports = UserAuthorize; 
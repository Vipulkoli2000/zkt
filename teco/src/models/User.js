class User {
    constructor(data = {}) {
        this.pin = data.pin || '';
        this.name = data.name || '';
        this.privilege = data.privilege || 0;
        this.password = data.password || '';
        this.group = data.group || 1;
        this.cardNumber = data.cardNumber || '';
    }

    getTableName() {
        return 'user';
    }

    toProtocol() {
        return [
            'Pin=' + this.pin,
            'Name=' + this.name,
            'Pri=' + this.privilege,
            'Passwd=' + this.password,
            'Grp=' + this.group,
            'Card=' + this.cardNumber
        ].join('\t');
    }
}

module.exports = User; 
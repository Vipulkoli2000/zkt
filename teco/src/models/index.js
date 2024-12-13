const RequestState = {
    AwaitingTransmission: 0,
    AwaitingResponse: 1,
    Completed: 2
};

class User {
    constructor(pin, name, password, privilege = 0, cardNumber = null) {
        this.pin = pin;
        this.name = name;
        this.password = password;
        this.privilege = privilege;
        this.cardNumber = cardNumber;
    }

    getTableName() {
        return 'user';
    }

    toProtocol() {
        return `pin=${this.pin}\tname=${this.name}\tprivilege=${this.privilege}\tpassword=${this.password}\tcardno=${this.cardNumber || this.pin}`;
    }
}

class UserExtended {
    constructor(pin, firstName) {
        this.pin = pin;
        this.firstName = firstName;
    }

    getTableName() {
        return 'userextended';
    }

    toProtocol() {
        return `pin=${this.pin}\tfirstname=${this.firstName}`;
    }
}

class UserAuthorize {
    constructor(pin) {
        this.pin = pin;
    }

    getTableName() {
        return 'userauthorize';
    }

    toProtocol() {
        return `pin=${this.pin}`;
    }
}

class Transaction {
    constructor(pin, cardNumber, eventType, inOutState, doorId, verified, dateTime) {
        this.pin = pin;
        this.cardNumber = cardNumber;
        this.eventType = eventType;
        this.inOutState = inOutState;
        this.doorId = doorId;
        this.verified = verified;
        this.dateTime = dateTime;
    }

    static fromDictionary(dict, getDateAndTimeFromSeconds) {
        return new Transaction(
            parseInt(dict['pin']),
            parseInt(dict['transaction cardno']),
            parseInt(dict['eventtype']),
            parseInt(dict['inoutstate']),
            parseInt(dict['doorid']),
            parseInt(dict['verified']),
            getDateAndTimeFromSeconds(parseInt(dict['time_second']))
        );
    }
}

class Templatev10 {
    constructor(pin, fingerId, valid, template) {
        this.pin = pin;
        this.fingerId = fingerId;
        this.valid = valid;
        this.template = template;
    }

    getTableName() {
        return 'templatev10';
    }

    toProtocol() {
        return `pin=${this.pin}\tfingerid=${this.fingerId}\tvalid=${this.valid}\ttemplate=${this.template}`;
    }
}

class Biophoto {
    constructor(pin, size, fileName, content) {
        this.pin = pin;
        this.size = size;
        this.fileName = fileName;
        this.content = content;
    }

    getTableName() {
        return 'biophoto';
    }

    toProtocol() {
        return `pin=${this.pin}\tsize=${this.size}\tfilename=${this.fileName}\tcontent=${this.content}`;
    }
}

class ZKPushRequest {
    constructor(commandText = '') {
        this.commandText = commandText;
        this.responseCommand = '';
        this.responseData = '';
        this.stateRequest = RequestState.AwaitingTransmission;
    }
}

module.exports = {
    RequestState,
    ZKPushRequest,
    User,
    UserExtended,
    UserAuthorize,
    Transaction,
    Templatev10,
    Biophoto
}; 
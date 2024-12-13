const { EventEmitter } = require('events');
const { DeviceMessageEventArgs } = require('../events');
const { User, UserExtended, UserAuthorize, Transaction, Templatev10, Biophoto, ZKPushRequest, RequestState } = require('../models');

class ZKPush extends EventEmitter {
    constructor(serialNumber) {
        super();
        this.serialNumber = serialNumber;
        this.timeWait = null;
        this.communicationRequest = null;
        this._lockRequest = false;
    }

    processRequest(req, res) {
        let data = '';
        
        req.on('data', chunk => {
            data += chunk.toString('ascii');
        });

        req.on('end', () => {
            const rawUrl = req.url;
            
            this.emit('deviceMessage', new DeviceMessageEventArgs(
                this.serialNumber,
                `${new Date().toLocaleTimeString()} - ${rawUrl}`
            ));

            this.verifyRequest(req, res, rawUrl, data);
        });
    }

    verifyRequest(req, res, route, data) {
        if (this._lockRequest) {
            return res.end('LOCKED');
        }

        this._lockRequest = true;

        try {
            if (route.includes('/iclock/registry')) {
                const registryCode = new Date().format('MMddHHmmss');
                this.answerRequest(res, `RegistryCode=${registryCode}`);
            }
            else if (route.includes('/iclock/push')) {
                const parameters = this.configureParameters();
                this.answerRequest(res, parameters);
            }
            else if (route.includes('/iclock/getrequest')) {
                if (this.communicationRequest?.stateRequest === RequestState.AwaitingTransmission) {
                    this.communicationRequest.stateRequest = RequestState.AwaitingResponse;
                    this.answerRequest(res, this.communicationRequest.commandText);
                } else {
                    this.answerRequest(res, 'OK');
                }
            }
            else if (route.includes('/iclock/ping')) {
                this.timeWait = new Date();
                this.answerRequest(res, 'OK');
            }
            else if (route.includes('/iclock/devicecmd')) {
                if (this.communicationRequest) {
                    this.communicationRequest.stateRequest = RequestState.Completed;
                    this.communicationRequest.responseCommand = data;
                }
                this.answerRequest(res, 'OK');
            }
            else if (route.includes('/iclock/querydata')) {
                if (this.communicationRequest) {
                    if (this.communicationRequest.responseData) {
                        this.communicationRequest.responseData += '\r\n';
                    }
                    this.communicationRequest.responseData += data;
                }
                this.answerRequest(res, 'OK');
            }
            else {
                this.answerRequest(res, 'OK');
            }
        } catch (error) {
            this.emit('deviceMessage', new DeviceMessageEventArgs(
                this.serialNumber,
                `Error: ${error.message}`
            ));
            res.writeHead(500);
            res.end('Internal server error');
        } finally {
            this._lockRequest = false;
        }
    }

    answerRequest(res, data) {
        res.setHeader('Connection', 'close');
        res.setHeader('Content-Type', 'text/plain;charset=UTF-8');
        res.end(data);
    }

    configureParameters() {
        return [
            'ServerVersion=3.0.1',
            'ServerName=ADMS',
            'PushVersion=3.0.1',
            'ErrorDelay=10',
            'RequestDelay=3',
            'TransInterval=1',
            'TransTables=User Transaction Facev7 templatev10',
            'TimeZone=-3',
            'RealTime=1',
            'TimeoutSec=10'
        ].join('\n');
    }

    async sendCommand(command) {
        if (Array.isArray(command)) {
            return this.sendCommandList(command);
        }

        this.communicationRequest = new ZKPushRequest(command);
        await this.awaitRequest();
    }

    async sendCommandList(listData) {
        const listCommands = listData.map((data, index) => 
            `C:${index + 1}:DATA UPDATE ${data.getTableName()} ${data.toProtocol()}`
        );

        this.communicationRequest = new ZKPushRequest(listCommands.join('\r\n'));
        await this.awaitRequest();
    }

    async awaitRequest() {
        this.timeWait = new Date();
        
        while (this.communicationRequest.stateRequest !== RequestState.Completed && 
               (new Date() - this.timeWait) < 10000) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (this.communicationRequest.stateRequest !== RequestState.Completed) {
            this.emit('deviceMessage', new DeviceMessageEventArgs(
                this.serialNumber,
                'REQUEST_TIMEOUT'
            ));
            return;
        }

        const listResponse = this.treatReceivedResponse(this.communicationRequest.responseCommand);

        for (const response of listResponse) {
            const returnCode = parseInt(response['Return']);
            this.emit('deviceMessage', new DeviceMessageEventArgs(
                this.serialNumber,
                `RETURN_CODE: ${returnCode}`
            ));
        }
    }

    // Date/Time Management
    static getDateAndTimeInSeconds() {
        const utc = new Date();
        const result = ((utc.getUTCFullYear() - 2000) * 12 * 31 + 
            ((utc.getUTCMonth()) * 31) + utc.getUTCDate() - 1) * 
            (24 * 60 * 60) + (utc.getUTCHours() * 60 + utc.getUTCMinutes()) * 60 + 
            utc.getUTCSeconds();
        return result;
    }

    static getDateAndTimeFromSeconds(secs) {
        let segs = secs;
        const seconds = segs % 60;
        segs = Math.floor(segs / 60);
        
        const minutes = segs % 60;
        segs = Math.floor(segs / 60);
        
        const hours = segs % 24;
        segs = Math.floor(segs / 24);
        
        const days = segs % 31 + 1;
        segs = Math.floor(segs / 31);
        
        const months = segs % 12 + 1;
        segs = Math.floor(segs / 12);
        
        const years = segs + 2000;
        
        return new Date(years, months - 1, days, hours, minutes, seconds);
    }

    async sendDateAndTime() {
        await this.sendCommand(`C:1:SET OPTIONS DateTime=${ZKPush.getDateAndTimeInSeconds()}`);
    }

    // User Management
    async sendUsers() {
        const listUsers = this.getUserList();
        await this.sendCommandList(listUsers);

        const listUserExtended = this.getUserExtendedList();
        await this.sendCommandList(listUserExtended);

        const listUserAuthorize = this.getUserAuthorizeList();
        await this.sendCommandList(listUserAuthorize);
    }

    async receiveUsers() {
        await this.sendCommand("C:1:DATA QUERY tablename=user,fielddesc=*,filter=*");
        
        if (!this.communicationRequest?.responseData) return;

        const users = this.communicationRequest.responseData
            .split(/\r|\n/)
            .filter(line => line.trim());

        const listUsers = users.map(user => {
            const dict = this.treatReceivedData(user);
            return new User(
                parseInt(dict['pin']),
                dict['name'],
                dict['password'],
                parseInt(dict['privilege'])
            );
        });

        listUsers.forEach(user => {
            this.emit('deviceMessage', new DeviceMessageEventArgs(
                this.serialNumber,
                `USER: PIN - ${user.pin} - NAME - ${user.name}`
            ));
        });
    }

    getUserList() {
        return Array.from({ length: 10 }, (_, i) => {
            const code = i + 1;
            return new User(
                code,
                `User ${code}`,
                code.toString(),
                0,  // CommonUser privilege
                code
            );
        });
    }

    getUserExtendedList() {
        return Array.from({ length: 10 }, (_, i) => {
            const code = i + 1;
            return new UserExtended(code, `User ${code}`);
        });
    }

    getUserAuthorizeList() {
        return Array.from({ length: 10 }, (_, i) => {
            return new UserAuthorize(i + 1);
        });
    }

    // Transaction Management
    async receiveTransactions() {
        await this.sendCommand("C:1:DATA QUERY tablename=transaction,fielddesc=*,filter=*");
        
        if (!this.communicationRequest?.responseData) return;

        const transactions = this.communicationRequest.responseData
            .split(/\r|\n/)
            .filter(line => line.trim());

        const listTransactions = transactions.map(transaction => {
            const dict = this.treatReceivedData(transaction);
            return Transaction.fromDictionary(dict, ZKPush.getDateAndTimeFromSeconds);
        });

        listTransactions.forEach(transaction => {
            this.emit('deviceMessage', new DeviceMessageEventArgs(
                this.serialNumber,
                `TRANSACTION: PIN - ${transaction.pin} - DATETIME - ${transaction.dateTime}`
            ));
        });
    }

    // Biometric Management
    async receiveTemplates() {
        await this.sendCommand("C:1:DATA QUERY tablename=templatev10,fielddesc=*,filter=*");
        
        if (!this.communicationRequest?.responseData) return;

        const templates = this.communicationRequest.responseData
            .split(/\r|\n/)
            .filter(line => line.trim());

        const listTemplates = templates.map(template => {
            const dict = this.treatReceivedData(template);
            return new Templatev10(
                parseInt(dict['pin']),
                parseInt(dict['fingerid']),
                parseInt(dict['valid']),
                dict['template']
            );
        });

        listTemplates.forEach(template => {
            this.emit('deviceMessage', new DeviceMessageEventArgs(
                this.serialNumber,
                `TEMPLATEV10: PIN - ${template.pin} - FINGER_ID - ${template.fingerId}`
            ));
        });
    }

    async receiveBiophotos() {
        await this.sendCommand("C:1:DATA QUERY tablename=biophoto,fielddesc=*,filter=*");
        
        if (!this.communicationRequest?.responseData) return;

        const biophotos = this.communicationRequest.responseData
            .split(/\r|\n/)
            .filter(line => line.trim());

        const listBiophotos = biophotos.map(biophoto => {
            const dict = this.treatReceivedData(biophoto);
            return new Biophoto(
                parseInt(dict['biophoto pin']),
                parseInt(dict['size']),
                dict['filename'],
                dict['content']
            );
        });

        listBiophotos.forEach(biophoto => {
            this.emit('deviceMessage', new DeviceMessageEventArgs(
                this.serialNumber,
                `BIOPHOTO: PIN - ${biophoto.pin} - FILE_NAME - ${biophoto.fileName}`
            ));
        });
    }

    // Device Options Management
    async getOptions() {
        await this.sendCommand("C:1:GET OPTIONS ~DeviceName,FirmVer,IPAddress,NetMask,GATEIPAddress");
        
        if (!this.communicationRequest?.responseData) return;

        const configurationDictionary = this.treatReceivedConfigurations(this.communicationRequest.responseData);

        Object.entries(configurationDictionary).forEach(([key, value]) => {
            this.emit('deviceMessage', new DeviceMessageEventArgs(
                this.serialNumber,
                `OPTIONS: ${key} - ${value}`
            ));
        });
    }

    treatReceivedResponse(text) {
        if (!text) return [];
        
        return text.split(/\r|\n/)
            .filter(line => line.trim())
            .map(response => {
                const listText = response.split('&');
                return this.createResponseDictionary(listText);
            });
    }

    treatReceivedData(text) {
        const listText = text.split('\t');
        return this.createResponseDictionary(listText);
    }

    treatReceivedConfigurations(text) {
        const listText = text.replace(/~/g, '').split(',').filter(Boolean);
        return this.createResponseDictionary(listText);
    }

    createResponseDictionary(response) {
        const dictionary = {};
        
        for (const item of response) {
            const [key, ...values] = item.split('=');
            if (key) {
                dictionary[key] = values.join('=') || '';
            }
        }
        
        return dictionary;
    }
}

module.exports = ZKPush; 
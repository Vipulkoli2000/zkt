// /iclock/cdata?SN=CIZW232460001&options=all&language=69&pushver=2.4.1


const express = require('express');
const bodyParser = require('body-parser')
const moment = require('moment-timezone');
const logger = require('../../config/logger');
const Device = require('../../models/device.model');
const { createDevice } = require('../../services/device.service');
const { createDeviceLog } = require('../../services/device.zk.service');
const fs = require('fs');

const router = express.Router();

router.use(bodyParser.text({type:"*/*", limit: "500mb"}))

router.get('/cdata', (req, res) => {
    const {SN, options, language, pushver} = req.query;
    if(options === "all"){
        const cmd =  `GET OPTION FROM: ${SN}\nTransFlag=101111111101\nTimeZone=7\nRealtime=1\nTransInterval=3\nAccessRuleType=0\nDeviceType=att`
        return res.send(cmd)
    }
    logger.info(JSON.stringify(req.query, null, 2));
    return res.send("OK")
});

router.post('/cdata', async (req, res) => {
    const { SN, options, language, pushver, table, Stamp } = req.query;
    fs.appendFileSync(`./${SN}-${moment().format('YYYY-MM-DD')}.txt`, req.body + "\n");
    if(table === "OPERLOG"){
        //enroll Face : 101
        //enroll Finger : 6
        //TODO: implement OPERLOG
        logger.info('OPERLOG');
        logger.info(req.body.split("\t"));
        logger.info(JSON.stringify(req.query, null, 2));
        logger.info(JSON.stringify(req.body, null, 2));
    }
    else if(table === "ATTLOG"){
        logger.info('ATTLOG');
        // DONE
        await createDeviceLog(SN, req.body);
    }
    else if(table === "BIODATA"){

        // upload user bio data
        logger.info('BIODATA');
        logger.info(JSON.stringify(req.body, null, 2));
        
    }
    else if(table === "ATTPHOTO"){
        const data = req.body.split("\n");
        logger.info('ATTPHOTO');
    }
  
    else {
        logger.info('cdata======');
        logger.info(JSON.stringify(req.query, null, 2));
        logger.info(JSON.stringify(req.body, null, 2));
    }

   

    return res.send("OK")
});


router.get('/getrequest', async (req, res) => {
    logger.info('getrequest');
    if(req.query.INFO){
        logger.info('INFO');
        const data = req.query.INFO.split(",");
        const device = {
            SN: req.query.SN,
            FW: data[0],
            enrolledUser: data[1],
            enrolledFinger: data[2],
            attendanceRecord: data[3],
            IP: data[4],
            fingerprintVersion: data[5],
            faceVersion: data[6],
            facesRequire: data[7],
            enrolledFace: data[8],
            supported: data[9]
        }
        try {
            await createDevice(device);
        } catch (error) {
            
        }
        return res.send("OK")
    }

    if(global.commands.has(req.query.SN)){
        const cmd = global.commands.get(req.query.SN);
        global.commands.delete(req.query.SN);
        logger.info('-------------getrequest-----------');
        logger.info(cmd.slice(0, 100));
        logger.info('-------------end getrequest-----------');
        return res.send(cmd);
    }
    else {
        return res.send("OK")
    }
    // if (!sendNewcmd) {
    //     logger.info('-------------sendNewcmd-----------');
    //     sendNewcmd = true;

    //     // logger.info('sendNewcmd');
    //     // const cmd = `C:${"123456789723241"}:DATA UPDATE USERINFO PIN=${"112"}\tName=${"Tuyen Tran Trung"}\tPri=${0}\tCard=12345678`
    //     // const cmd = `C:${"123"}:DATA UPDATE USERINFO PIN=${"113"}\tName=${"Tuyen Tran Trung"}\tPri=${0}`

    //     // const cmd = "C:1222:ENROLL_BIO TYPE=2\tPIN=112\tCardNo=12345678\tRETRY=1\tOVERWRITE=1"
    //     // const cmd =`C:${"12333"}:ENROLL_FP PIN=122\tFID=1\tRETRY=1\tOVERWRITE=1`
    //     // const cmd = "C:123:ENROLL_MF PIN=113\tRETRY=0"
    //     const base64img = fs.readFileSync('./sample-faceface.jpeg', {encoding: 'base64'});
    //     //update photo
    //     let cmd = `C:${122}:DATA UPDATE USERINFO PIN=${"112"}\tName=${"Tuyen Tran Trung"}\tPri=${0}\tCard=12345678\n`
    //     cmd += `C:${123}:DATA UPDATE BIOPHOTO PIN=112\tType=2 Size=${base64img.length}\tContent=${base64img}\tFormat=0`
    //     // const cmd = "OK"
    //     return res.send(cmd);
    // }
    // else {
    //     logger.info('-------------sendNewcmd-----------');

    //     // \tPasswd=${XXX}${HT}Card=${XXX}${HT}Grp=${XXX}${HT}TZ=${XXX}${HT}Verify=${XXX}${HT}ViceCard=${XXX}`

    //     return res.send("OK")
    // }
});

router.post('/devicecmd', (req, res) => {

    logger.info('devicecmd');
    logger.info(JSON.stringify(req.query, null, 2));
    // console.log(req);
    logger.info(`body: ${JSON.stringify(req.body, null, 2)}`);
    // logger.info(JSON.stringify(req.body, null, 2));
    // logger.info(JSON.stringify(req, null, 2));
    logger.info("===")
    return res.send("OK")
});

router.post
('/fdata', async (req, res) => {
    const { SN, table, PhotoStamp } = req.query;
    switch (table) {
        case "ATTPHOTO":
            // console.log(req.body)
            // const data = req.body.split("CMD=uploadphoto\0");

            // logger.info(data.length);
            // if(data.length > 1){
            //     const buff = Buffer.from(data[1].trim(), 'binary');

            //     fs.writeFile(`./${SN}-${moment().format('YYYY-MM-DD')}.jpeg`, data[1], (err) => {
            //         if(err) console.log(err);
            //         else console.log("success");
            //     })
            // }
            // console.log(data)
            // data.forEach(element => {
            //    logger.info(element);
            //     // if(element.slice(0, 15) === "CMD=uploadphoto"){
            //     //     element[0] = "CMD"
                    
            //     // }
            //     // else element = element.split("=");
            //     // logger.info(element[0]);
                
            // });

    }

    return res.send("OK")
});

router.post('/registry', (req, res) => {
   logger.info('registry');
    logger.info(JSON.stringify(req.query, null, 2));
    logger.info(JSON.stringify(req.body, null, 2));
    return res.send("OK")
});

router.all('*', (req, res) => {
    logger.info('all');
    logger.info(JSON.stringify(req.query, null, 2));
    logger.info(JSON.stringify(req.body, null, 2));
    return res.send("OK")
});


module.exports = router;
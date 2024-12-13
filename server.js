// Import Express
const express = require("express");
const moment = require("moment");

// Initialize Express app
const app = express();
let logger = console.log;

// Middleware to parse JSON and URL-encoded data
app.use(express.json()); // Parses application/json
app.use(express.urlencoded({ extended: true })); // Parses application/x-www-form-urlencoded

function convertToGMT(date) {
  if (!(date instanceof Date)) {
    throw new Error("Input must be a Date object");
  }

  return date.toUTCString(); // Converts the date to a human-readable GMT string
}

// Example usage:
const now = new Date();
logger(convertToGMT(now)); // e.g., "Wed, 13 Dec 2024 11:15:30 GMT"

// Listen to all requests on /iclock/cdata
app.get("/iclock/cdata", (req, res) => {
  logger("cdata endpoint hit");
  const { SN } = req.query;
  logger(req.body);
  logger(req.query);

  const now = new Date();

  // Create the response body
  const body = `GET OPTION FROM: ${SN || "0316144680030"}
ATTLOGStamp=None
OPERLOGStamp=9999
ATTPHOTOStamp=None
ErrorDelay=30
Delay=10
TransTimes=00:00;14:05
TransInterval=1
TransFlag=TransData AttLog OpLog
ChgFP
UserPic
TimeZone=8
Realtime=1
Encrypt=None
P a g e | 25
AttPhoto
EnrollUser
ChgUser EnrollFP`;

  // Set headers
  res.set({
    "Content-Type": "text/plain",
    "Content-Length": Buffer.byteLength(body, "utf-8"),
    Connection: "close",
    Pragma: "no-cache",
    "Cache-Control": "no-store",
    Date: now.toUTCString(),
    Server: "nginx/1.6.0",
  });

  // Send the response
  return res.status(200).send(body);
});

app.get("/iclock/getrequest", (req, res) => {
  logger("getrequest endpoint hit");
  const { SN, options, language, pushver } = req.query;

  // Example response
  const cmd = `C:${
    SN || "unknown"
  }:DATA UPDATE USERINFO PIN=${"1"}\tName=${"Tuyen Tran Trung"}\tPri=${0}\tCard=12345678`;

  return res.status(200).send(cmd);
});

// Set the port for the server
const PORT = 3000;

// Start the server
app.listen(PORT, () => {
  logger(`Server is running on http://localhost:${PORT}`);
});

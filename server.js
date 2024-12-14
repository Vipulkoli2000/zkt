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
logger(convertToGMT(now));

app.get("/iclock/cdata", (req, res) => {
  const now = new Date();

  try {
    logger("cdata endpoint hit");

    // Extract and validate the SN parameter
    console.log(req.query);
    console.log(req.headers);
    const { SN } = req.query;
    if (!SN || typeof SN !== "string") {
      logger("SN query parameter missing or invalid");
      return res
        .status(400)
        .send("Bad Request: SN is required and must be a string");
    }

    // Create the response body (use \n for line breaks)
    const body = `GET OPTION FROM:${SN}\nATTLOGStamp=None\nOPERLOGStamp=9999`;

    const contentLength = Buffer.byteLength(body, "utf-8");

    // Prepare response headers
    res.set({
      "Content-Type": "text/plain",
      "Content-Length": contentLength,
      Pragma: "no-cache",
      "Cache-Control": "no-store",
      Date: convertToGMT(now),
      Server: "nginx/1.6.0",
    });

    // Log response info
    logger("Response Size:", contentLength);
    logger("Response Date:", convertToGMT(now));

    // Send response
    return res.status(200).send(body);
  } catch (error) {
    logger("Error occurred:", error);
    return res.status(500).send("Internal Server Error");
  }
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

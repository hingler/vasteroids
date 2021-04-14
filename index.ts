import express = require("express");
import ws = require("ws");

const app = express();
const port = process.env.PORT || 8080;

const wss = new ws.Server({ noServer: true });
wss.on("connection", (ws, req) => {
  console.log("new connection!");
  console.log(req);
  // do something with the socket
  ws.send("fuck off");
  ws.close();
});
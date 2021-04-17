import express = require("express");
import * as WebSocket from "ws";
import { SocketManager } from "./server/SocketManager";

const app = express();
const port = process.env.PORT || 8080;

const mgr = new SocketManager(4, 4);

const socketStorage : Set<WebSocket> = new Set();

const wss = new WebSocket.Server({ noServer: true });
wss.on("connection", (ws, req) => {
  console.log("new connection!");
  console.log(req);
  // do something with the socket

  // interpret next message as name -- thereafter, socketmgr handles
  ws.once("message", (e) => {
    let name = e.data;
    socketStorage.delete(ws);
    mgr.addSocket(ws, name);
  });

  // pin it somewhere for now
  // delete anything that's been there too long?
  // create a new class which can distinguish reconnects from new connects, etc.
  socketStorage.add(ws);
});



const server = app.listen(port, () => {
  console.log("eat shit");
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});
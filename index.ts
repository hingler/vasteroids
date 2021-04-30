import * as express from "express";
import * as WebSocket from "ws";
import { SocketManager } from "./server/SocketManager";

const app = express();
const port = process.env.PORT || 8080;

const mgr = new SocketManager(16, 1024);

const socketStorage : Set<WebSocket> = new Set();

const wss = new WebSocket.Server({ noServer: true });
wss.on("connection", (ws, req) => {
  console.log("new connection!");
  // do something with the socket

  // interpret next message as name -- thereafter, socketmgr handles
  ws.once("message", (e) => {
    let name = e;
    console.log(name);
    socketStorage.delete(ws);
    mgr.addSocket(ws, name);
  });

  // pin it somewhere for now
  // delete anything that's been there too long?
  // create a new class which can distinguish reconnects from new connects, etc.
  socketStorage.add(ws);
});

app.use(express.json());

app.post("/respawn", (req, res) => {
  // request should contain only a token
  let body = req.body;
  if (!body.token) {
    res.status(400);
    res.send("Missing token field.");
    console.log("missing token field :(");
    return;
  }

  let ship = mgr.respawnShip(body.token);
  res.json({
    success: (!!ship),
    ship: ship
  });
})

app.get("/heroku", (req, res) => {
  res.header("Content-type", "text/plain");
  res.send("OK");
})

express.static.mime.define({
  'text/javascript': ['js'],
  'text/plain': ['glsl', 'frag', 'vert']
});
app.use(express.static("client"));


const server = app.listen(port, () => {
  console.log("eat shit");
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    console.log("new conn :))");
    wss.emit("connection", ws, request);
  });
});
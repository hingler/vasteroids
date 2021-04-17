import * as WebSocket from "ws";
import { CreateWorldSim, WorldSim } from "./WorldSim";
import { generateID } from "./IDGen";
import { ServerPacket } from "./ServerPacket";
import { ConnectionPacket } from "./ConnectionPacket";
import { ClientPacket } from "./ClientPacket";
import { BiMap } from "./BiMap";

class SocketManager {
  game: WorldSim;

  // map from a player token to an ID
  players: Map<string, number>;

  // maps connections to their respective IDs
  sockets: BiMap<WebSocket, number>;

  timeouts: Map<WebSocket, NodeJS.Timeout>;

  update: NodeJS.Timeout;

  // todo: alow sockets to reconnect with a connection packet

  constructor(chunks: number, asts: number) {
    this.game = CreateWorldSim(chunks, asts);
    this.players = new Map();
    this.sockets = new BiMap();
    this.timeouts = new Map();
    // start some regular update event
    this.update = setInterval(this.handleUpdates.bind(this), 62.5);
  }

  async addSocket(socket: WebSocket, name: string) : Promise<void> {
    let ship_new = this.game.AddShip(name);
    this.sockets.insert(socket, ship_new.id);
    let token = await generateID(32);
    this.players.set(token, ship_new.id);
    let packet = {} as ConnectionPacket;
    packet.ship = ship_new;
    packet.playerToken = token;
    socket.send(JSON.stringify(packet));

    let timeout = setTimeout(() => {
      this.timeoutFunc_(socket)
    }, 15000);
    this.timeouts.set(socket, timeout);
    // set up msg listener and close listener.
    socket.addEventListener("message", (e) => { this.socketOnMessage_(socket, e.data); });
    socket.addEventListener("close", () => { this.socketOnClose_(socket); });
  }

  private socketOnMessage_(socket: WebSocket, message: any) {
    // get packet
    let packet = JSON.parse(message) as ClientPacket;
    // match packet to socket id
    let id = this.sockets.getEntryT(socket);
    if (!id) {
      let errmsg = "incoming message does not have associated ID!";
      console.error(errmsg);
      return;
    }

    if (id !== packet.ship.id) {
      console.error("Bad socket id -- client sent " + packet.ship.id + ", server records " + id);
      socket.close();
      return;
    }

    let id_verify = this.players.get(message.playerToken);
    if (id_verify !== id) {
      console.error("Socket was rejected because its token and stored ID did not agree.");
      socket.close();
      return;
    }

    let timeout = this.timeouts.get(socket);
    if (!timeout) {
      console.warn("timeout was not created for ID " + id);
    } else {
      // clear old timeout
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      this.timeoutFunc_(socket)
    }, 15000);
    this.timeouts.set(socket, timeout);

    this.game.HandleClientPacket(packet);
  }

  private timeoutFunc_(socket: WebSocket) {
    socket.close();
  }

  private socketOnClose_(socket: WebSocket) {
    let id = this.sockets.getEntryT(socket);
    if (!id) {
      console.error("Closing a socket with no associated ID");
    }

    this.timeouts.delete(socket);
    this.sockets.removeT(socket);
    this.game.DeleteShip(id);
  }

  handleUpdates() {
    let res = this.game.UpdateSim();
    for (let socket of this.sockets) {
      let id = socket[1];
      let pkt = res[id.toString()] as ServerPacket;
      if (!pkt) {
        console.error("connected socket ID " + id + " not in server packet object!");
      } else {
        socket[0].send(JSON.stringify(pkt));
      }
    }
  }

  async createPlayerToken() : Promise<string> {
    let str : string;
    do {
      str = await generateID(32);
    } while (this.players.get(str));
      
    return str;
  }
}

export { SocketManager };
import { Asteroid } from "../../../instances/Asteroid";
import { ClientShip } from "../../../instances/Ship";
import { ClientPacket } from "../../../server/ClientPacket";
import { ConnectionPacket } from "../../../server/ConnectionPacket";
import { ServerPacket } from "../../../server/ServerPacket";
import { ShipManager } from "./ShipManager";
import { UpdateInstance } from "./UpdateInstance";

/**
 * Establishes a connection with the game server and interprets game updates.
 */
export class GameStateManager {
  socket: WebSocket;
  token: string;
  ship: ShipManager;

  asteroids: Map<number, Asteroid>;
  ships: Map<number, ClientShip>;
  socketUpdate: NodeJS.Timeout;

  dims: number;

  constructor(name: string) {
    let socketURL : string;
    if (window.location.protocol === "https:") {
      socketURL = "wss://";
    } else {
      socketURL = "ws://";
    }

    socketURL += window.location.host;
    console.log(socketURL);
    this.token = null;
    this.socket = new WebSocket(socketURL);

    this.asteroids = new Map();
    this.ships = new Map();

    // on open: send message
    // on message (response containing data):
    //    - change onmessage so that we call some method which handles public data
    this.socket.onopen = () => { 
      this.socket.send(name);
    };

    this.socket.onmessage = this.socketInit_.bind(this);
    // setup event listeners
  }

  getShip() : ClientShip {
    return this.ship.getShip();
  }

  private socketInit_(event: MessageEvent) {
    console.log(event);
    let packet = JSON.parse(event.data) as ConnectionPacket;
    console.log(packet);
    console.log("ship");
    console.log(packet.ship);
    this.token = packet.playerToken;
    console.log(this.token);
    // create ship manager
    this.dims = packet.chunkDims;
    console.log(this.dims);
    this.ship = new ShipManager(packet.ship);
    this.socket.onmessage = this.socketUpdate_.bind(this);
    // ~16.66 updates per second
    this.socketUpdate = setInterval(this.socketSend_.bind(this), 60);
    // call update manually as part of delta?
    // that would probably be better actually
  }

  private socketSend_() {
    let a = {} as ClientPacket;
    a.playerToken = this.token;
    a.projectileFired = false;
    a.ship = this.ship.getShip();
    console.log(this.token);
    console.log(a);
    this.socket.send(JSON.stringify(a));
  }

  private socketUpdate_(event: MessageEvent) {
    let packet = JSON.parse(event.data) as ServerPacket;
    // store local objects
    for (let a of packet.asteroids) {
      // if already stored, replaces it
      // replace delta since we just received an update
      a.last_delta = performance.now();
      this.asteroids.set(a.id, a);
    }

    for (let s of packet.ships) {
      s.last_delta = performance.now();
      this.ships.set(s.id, s);
    }

    for (let d of packet.deltas) {
      let at = this.asteroids.get(d.id);
      if (at) {
        at.last_delta = performance.now();
        at.position = d.position;
        at.rotation = d.rotation;
        at.velocity = d.velocity;
        at.rotation_velocity = d.rotation_velocity;
        this.asteroids.set(at.id, at);
        return;
      }

      let sh = this.ships.get(d.id);
      if (sh) {
        sh.last_delta = performance.now();
        sh.position = d.position;
        sh.rotation = d.rotation;
        sh.velocity = d.velocity;
        sh.rotation_velocity = d.rotation_velocity;
        this.ships.set(sh.id, sh);
      }
    }

    for (let del of packet.deleted) {
      // clear from both
      this.asteroids.delete(del);
      this.ships.delete(del);
    }
  }

  update() {
    if (this.ship) {
      this.ship.update(this.dims);
      // update all instances
      for (let a of this.asteroids.values()) {
        UpdateInstance(a, this.dims);
      }
  
      for (let s of this.ships.values()) {
        UpdateInstance(s, this.dims);
      }
    }
  }
}
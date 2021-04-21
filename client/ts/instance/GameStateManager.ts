import { Asteroid } from "../../../instances/Asteroid";
import { Instance } from "../../../instances/GameTypes";
import { ClientShip } from "../../../instances/Ship";
import { ClientPacket } from "../../../server/ClientPacket";
import { ConnectionPacket } from "../../../server/ConnectionPacket";
import { ServerPacket } from "../../../server/ServerPacket";
import { ShipManager } from "./ShipManager";
import { UpdateAndInterpolate, UpdateInstance } from "./UpdateInstance";

/**
 * Establishes a connection with the game server and interprets game updates.
 */
export class GameStateManager {
  socket: WebSocket;
  token: string;
  ship: ShipManager;

  // local simulated results displayed to client.
  asteroids: Map<number, Asteroid>;
  ships: Map<number, ClientShip>;

  // simulation based off packet data. used to constrain sim results
  asteroidsPacket: Map<number, Instance>;
  shipsPacket: Map<number, Instance>;

  socketUpdate: NodeJS.Timeout;

  connectPromise: Promise<void>;
  connectResolve: any;

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

    this.connectPromise = new Promise((res, rej) => {
      this.connectResolve = res;
    });

    this.asteroids = new Map();
    this.ships = new Map();

    this.asteroidsPacket = new Map();
    this.shipsPacket = new Map();


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

  getDims() : number {
    return this.dims;
  }

  getInstances() : ServerPacket {
    let a = {} as ServerPacket;
    a.asteroids = Array.from(this.asteroids.values());
    a.ships = Array.from(this.ships.values());
    a.deleted = [];
    a.deltas = [];
    return a;
  }

  private socketInit_(event: MessageEvent) {
    let packet = JSON.parse(event.data) as ConnectionPacket;
    this.token = packet.playerToken;
    // create ship manager
    this.dims = packet.chunkDims;
    this.ship = new ShipManager(packet.ship);
    this.socket.onmessage = this.socketUpdate_.bind(this);
    // ~16.66 updates per second
    this.socketUpdate = setInterval(this.socketSend_.bind(this), 60);
    this.connectResolve();
    // call update manually as part of delta?
    // that would probably be better actually
  }

  waitUntilConnected() : Promise<void> {
    return this.connectPromise;
  }

  private socketSend_() {
    let a = {} as ClientPacket;
    a.playerToken = this.token;
    a.projectileFired = false;
    a.ship = this.ship.getShip();
    this.socket.send(JSON.stringify(a));
  }

  private socketUpdate_(event: MessageEvent) {
    let packet = JSON.parse(event.data) as ServerPacket;
    // store local objects
    for (let a of packet.asteroids) {
      // if already stored, replaces it
      // replace delta since we just received an update
      console.log("new asteroid :)");
      a.last_delta = performance.now() / 1000;
      this.asteroids.set(a.id, a);
    }

    // new ships need to be handled here
    for (let s of packet.ships) {
      console.log("new ship :)");
      s.last_delta = performance.now() / 1000;
      this.ships.set(s.id, s);
    }

    for (let d of packet.deltas) {
      let at = this.asteroids.get(d.id);
      if (at) {
        let atDelta = {} as Instance;
        atDelta.id = at.id;
        atDelta.last_delta = performance.now() / 1000;
        atDelta.position = d.position;
        atDelta.rotation = d.rotation;
        atDelta.velocity = d.velocity;
        atDelta.rotation_velocity = d.rotation_velocity;
        this.asteroidsPacket.set(atDelta.id, atDelta);
        continue;
      }

      let sh = this.ships.get(d.id);
      if (sh) {
        let shDelta = {} as Instance;
        shDelta.id = sh.id;
        shDelta.last_delta = performance.now() / 1000;
        shDelta.position = d.position;
        shDelta.rotation = d.rotation;
        shDelta.velocity = d.velocity;
        shDelta.rotation_velocity = d.rotation_velocity;
        this.shipsPacket.set(shDelta.id, shDelta);
        continue;
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
        let packetInst = this.asteroidsPacket.get(a.id);
        if (packetInst) {
          UpdateAndInterpolate(a, packetInst, this.dims);
        } else {
          UpdateInstance(a, this.dims);
        }
      }
  
      for (let s of this.ships.values()) {
        let packetInst = this.shipsPacket.get(s.id);
        if (packetInst) {
          UpdateAndInterpolate(s, packetInst, this.dims);
        } else {
          UpdateInstance(s, this.dims);
        }
      }
    }
  }
}
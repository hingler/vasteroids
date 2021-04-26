import { Asteroid } from "../../../instances/Asteroid";
import { Instance, Point2D, WorldPosition } from "../../../instances/GameTypes";
import { Projectile } from "../../../instances/Projectile";
import { ClientShip } from "../../../instances/Ship";
import { ClientPacket } from "../../../server/ClientPacket";
import { ConnectionPacket } from "../../../server/ConnectionPacket";
import { ServerPacket } from "../../../server/ServerPacket";
import { Input } from "../input/InputManager";
import { ShipManager } from "./ShipManager";
import { getOriginTime, UpdateAndInterpolate, UpdateInstance } from "./UpdateInstance";

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
  projectiles: Map<number, Projectile>;

  // avoid sending new projectiles more than we have to
  projectilesHot: Map<number, Projectile>;
  // stores projectiles which have been generated on the client, but which the server is not yet aware of
  projectilesLocal: Map<number, Projectile>;

  projectileID: number;

  // simulation based off packet data. used to constrain sim results
  asteroidsPacket: Map<number, Instance>;
  shipsPacket: Map<number, Instance>;
  projectilesPacket: Map<number, Instance>;

  socketUpdate: NodeJS.Timeout;

  connectPromise: Promise<void>;
  connectResolve: any;

  // start time wrt performance now
  startTimeOffset: number;

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
    this.projectiles = new Map();
    this.projectilesHot = new Map();
    this.projectilesLocal = new Map();
    this.projectileID = 0;

    this.asteroidsPacket = new Map();
    this.shipsPacket = new Map();
    this.projectilesPacket = new Map();


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

  setDims(dims: number) : void {
    this.dims = dims;
  }

  getDims() : number {
    return this.dims;
  }

  getInstances() : ServerPacket {
    let a = {} as ServerPacket;
    a.asteroids = Array.from(this.asteroids.values());
    a.ships = Array.from(this.ships.values());
    a.projectiles = Array.from(this.projectiles.values());

    for (let proj of this.projectilesHot.values()) {
      a.projectiles.push(proj);
    }

    for (let proj of this.projectilesLocal.values()) {
      a.projectiles.push(proj);
    }

    a.deleted = [];
    a.deltas = [];
    return a;
  }

  private socketInit_(event: MessageEvent) {
    let packet = JSON.parse(event.data) as ConnectionPacket;
    this.token = packet.playerToken;
    // create ship manager
    this.dims = packet.chunkDims;
    this.ship = new ShipManager(packet.ship, packet.serverTime);
    this.socket.onmessage = this.socketUpdate_.bind(this);
    // ~33.33 updates per second
    this.socketUpdate = setInterval(this.socketSend_.bind(this), 50);
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
    a.ship = this.ship.getShip();
    a.projectiles = Array.from(this.projectilesHot.values());
    for (let proj of a.projectiles) {
      this.projectilesLocal.set(proj.clientID, proj);
    }

    // everything which was in hot is now in local -- wipe it.
    this.projectilesHot.clear();

    this.socket.send(JSON.stringify(a));
  }

  private socketUpdate_(event: MessageEvent) {
    let packet = JSON.parse(event.data) as ServerPacket;
    this.ship.ship.score = packet.score;
    // store local objects
    for (let a of packet.asteroids) {
      // if already stored, replaces it
      // replace delta since we just received an update
      console.log("new asteroid :)");
      // asteroid contains its last delta
      this.asteroids.set(a.id, a);
    }

    // new ships need to be handled here
    for (let s of packet.ships) {
      console.log("new ship :)");
      this.ships.set(s.id, s);
    }

    // check to see if any packets resolved
    // none of the hot ones will because we havent sent them yet
    for (let p of packet.projectilesLocal) {
      if (this.projectilesLocal.has(p.clientID)) {
        // move to main storage
        let local = this.projectilesLocal.get(p.clientID);
        local.id = p.id;
        this.projectiles.set(p.id, local);
        this.projectilesPacket.set(p.id, p);
        this.projectilesLocal.delete(p.clientID);
      }
    }

    for (let p of packet.projectiles) {
      this.projectiles.set(p.id, p);
    }

    for (let d of packet.deltas) {
      let at = this.asteroids.has(d.id);
      if (at) {
        let atDelta = {} as Instance;
        atDelta.id = d.id;
        atDelta.last_delta = d.last_delta;
        atDelta.position = d.position;
        atDelta.rotation = d.rotation;
        atDelta.velocity = d.velocity;
        atDelta.rotation_velocity = d.rotation_velocity;
        this.asteroidsPacket.set(atDelta.id, atDelta);
        continue;
      }

      let sh = this.ships.has(d.id);
      if (sh) {
        let shDelta = {} as Instance;
        shDelta.id = d.id;
        shDelta.last_delta = d.last_delta;
        shDelta.position = d.position;
        shDelta.rotation = d.rotation;
        shDelta.velocity = d.velocity;
        shDelta.rotation_velocity = d.rotation_velocity;
        // score info doesn't send here
        this.shipsPacket.set(shDelta.id, shDelta);
        continue;
      }

      let pr = this.projectiles.has(d.id);
      if (pr) {
        let prDelta = {} as Instance;
        prDelta.id = d.id;
        prDelta.last_delta = d.last_delta;
        prDelta.position = d.position;
        prDelta.rotation = d.rotation;
        prDelta.velocity = d.velocity;
        prDelta.rotation_velocity = d.rotation_velocity;
        this.projectilesPacket.set(prDelta.id, prDelta);
      }
    }

    for (let del of packet.deleted) {
      // clear from both
      this.asteroids.delete(del);
      this.ships.delete(del);
      this.projectiles.delete(del);

      this.asteroidsPacket.delete(del);
      this.shipsPacket.delete(del);
      this.projectilesPacket.delete(del);

      // send client ID of deleted particles to client
    }

    for (let del of packet.deletedLocal) {
      this.projectilesLocal.delete(del);
      this.projectilesHot.delete(del);
    }
  }

  private generateProjectile_(ship: ClientShip) {
    let p = {} as Projectile;
    let delta_v : Point2D = {x: 7.5, y: 0};
    delta_v.y = -(delta_v.x * Math.sin(ship.rotation));
    delta_v.x = delta_v.x * Math.cos(ship.rotation);
    p.position = {} as WorldPosition;
    p.position.chunk = {} as Point2D;
    p.position.position = {} as Point2D;
    p.position.chunk.x = ship.position.chunk.x;
    p.position.chunk.y = ship.position.chunk.y;
    p.position.position.x = ship.position.position.x;
    p.position.position.y = ship.position.position.y;
    p.last_delta = getOriginTime() + (performance.now() / 1000);
    p.rotation = ship.rotation;
    p.rotation_velocity = 0;
    p.id = 0;
    p.clientID = this.projectileID++;
    p.velocity = delta_v;
    this.projectilesHot.set(p.clientID, p);
  }

  update() {
    if (this.ship) {
      this.ship.update(this.dims);

      // poll input, see if we need to generate a projectile
      if (this.ship.isShoot()) {
        this.generateProjectile_(this.ship.getShip());
      }

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

      for (let p of this.projectiles.values()) {
        let packetInst = this.projectilesPacket.get(p.id);
        if (packetInst) {
          UpdateAndInterpolate(p, packetInst, this.dims);
        } else {
          UpdateInstance(p, this.dims);
        }
      }

      for (let pl of this.projectilesLocal.values()) {
        // no server side equiv yet!
        UpdateInstance(pl, this.dims);
      }

      for (let ph of this.projectilesHot.values()) {
        UpdateInstance(ph, this.dims);
      }
    }
  }
}
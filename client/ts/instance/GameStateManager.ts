import { Asteroid } from "../../../instances/Asteroid";
import { Biome } from "../../../instances/Biome";
import { CollisionLocal } from "../../../instances/CollisionLocal";
import { Instance, Point2D, WorldPosition } from "../../../instances/GameTypes";
import { Projectile } from "../../../instances/Projectile";
import { ClientShip } from "../../../instances/Ship";
import { ServerPacketDecoder } from "../../../packet/ServerPacketDecoder";
import { ClientPacket } from "../../../server/ClientPacket";
import { ConnectionPacket } from "../../../server/ConnectionPacket";
import { ServerPacket } from "../../../server/ServerPacket";
import { Input, InputManager, InputMethod } from "../input/InputManager";
import { Collide, GetDistance } from "./AsteroidColliderJS";
import { ClientBiomeMap } from "./ClientBiomeMap";
import { ShipManager } from "./ShipManager";
import { getOriginTime, UpdateAndInterpolate, UpdateInstance } from "./UpdateInstance";

/**
 * Establishes a connection with the game server and interprets game updates.
 */
export class GameStateManager {
  socket: WebSocket;
  token: string;
  ship: ShipManager;

  inputmethod: InputMethod;

  // local simulated results displayed to client.
  asteroids: Map<number, Asteroid>;
  ships: Map<number, ClientShip>;
  projectiles: Map<number, Projectile>;
  collisions: Map<number, CollisionLocal>;

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

  biomemgr: ClientBiomeMap;

  // start time wrt performance now
  startTimeOffset: number;

  dims: number;

  constructor(name: string, inputmethod: InputMethod) {
    this.inputmethod = inputmethod;
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
    this.collisions = new Map();
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
    for (let c of this.collisions.values()) {
      for (let i of c.particles) {
        // breaks if we need ClientID.
        // i don't think we will >:)
        a.projectiles.push(i as Projectile); 
      }
    }

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

  private respawnShip_() {
    fetch("/respawn", {
      method: "POST",
      mode: "cors",
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        'token': this.token
      })
    })
      .then((r) => {
        if (r.status < 200 || r.status >= 400) {
          return Promise.reject("could not res ship!");
        }

        return r.text();        
      })

      .then((txt) => {
        let pkt = JSON.parse(txt);
        console.log(pkt);
        if (pkt.success) {
          let ship = pkt.ship;
          this.ship.ship.destroyed = false;
          this.ship.ship.position = ship.position;
          this.ship.ship.velocity = ship.velocity;
          this.ship.ship.rotation = ship.rotation;
          this.ship.ship.rotation_velocity = ship.rotation_velocity;
          this.ship.ship.lives = ship.lives;
          this.ship.ship.last_delta = ship.last_delta;
        } else {
          return Promise.reject("game is over");
        }
      })

      .catch((err) => {
        console.error("GAME OVER :(");
      });
  }

  private socketInit_(event: MessageEvent) {
    let packet = JSON.parse(event.data) as ConnectionPacket;
    this.token = packet.playerToken;
    // create ship manager
    this.dims = packet.chunkDims;
    this.biomemgr = new ClientBiomeMap(this.dims);
    this.ship = new ShipManager(packet.ship, packet.serverTime, this.inputmethod);
    this.socket.onmessage = this.socketUpdate_.bind(this);
    // ~33.33 updates per second
    this.socketUpdate = setInterval(this.socketSend_.bind(this), 30);
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

  private async socketUpdate_(event: MessageEvent) {
    console.log(event.data)
    let data = event.data as Blob;
    let packet = new ServerPacketDecoder(await data.arrayBuffer()).decode() as ServerPacket;
    this.ship.ship.score = packet.score;
    // store local objects
    for (let a of packet.asteroids) {
      a.hidden = false;
      this.asteroids.set(a.id, a);
    }

    // new ships need to be handled here
    for (let s of packet.ships) {
      console.log("new ship :)");
      s.hidden = false;
      this.ships.set(s.id, s);

    }

    for (let c of packet.collisions) {
      let cl = c as CollisionLocal;
      // for collisions: we don't care about updates, only deletions
      if (!this.collisions.has(cl.id)) {
        cl.particles = [];
        for (let i = 0; i < 32; i++) {
          let p = {} as Instance;
          let rot = Math.random() * Math.PI * 2;
          let delta_v : Point2D = {x: (Math.random() / 2 + 0.4), y: 0};
          delta_v.y = -(delta_v.x * Math.sin(rot));
          delta_v.x = delta_v.x * Math.cos(rot);
          p.position = {} as WorldPosition;
          p.position.chunk = {} as Point2D;
          p.position.position = {} as Point2D;
          p.position.chunk.x = c.position.chunk.x;
          p.position.chunk.y = c.position.chunk.y;
          p.position.position.x = c.position.position.x;
          p.position.position.y = c.position.position.y;
          p.last_delta = getOriginTime() + (performance.now() / 1000);
          p.rotation = rot;
          p.rotation_velocity = 0;
          p.id = 0;
          p.velocity = delta_v;
          cl.particles.push(p);
        }
  
        this.collisions.set(cl.id, cl);
      }
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
      p.hidden = false;
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
        this.asteroids.get(atDelta.id).hidden = false;
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
        this.ships.get(shDelta.id).hidden = false;
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
        this.projectiles.get(prDelta.id).hidden = false;
      }
    }

    for (let del of packet.deleted) {
      // clear from both
      this.asteroids.delete(del);
      this.ships.delete(del);
      this.projectiles.delete(del);
      this.collisions.delete(del);

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
    if (this.ship.getShip().destroyed) {
      // ignore projectile creation if our ship is destroyed
      return;
    }

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

    // copy to origin field
    p.origin = {} as WorldPosition;
    p.origin.chunk = {} as Point2D;
    p.origin.position = {} as Point2D;
    p.origin.chunk.x = ship.position.chunk.x;
    p.origin.chunk.y = ship.position.chunk.y;
    p.origin.position.x = ship.position.position.x;
    p.origin.position.y = ship.position.position.y;

    p.last_delta = getOriginTime() + (performance.now() / 1000);
    p.creationTime = p.last_delta;
    p.rotation = ship.rotation;
    p.rotation_velocity = 0;
    p.id = 0;
    p.clientID = this.projectileID++;
    p.velocity = delta_v;

    p.hidden = false;
    this.projectilesHot.set(p.clientID, p);
  }

  hideIfDistance(player: ClientShip, i: Instance) {
    let chunkDist = {
      x: Math.abs(player.position.chunk.x - i.position.chunk.x),
      y: Math.abs(player.position.chunk.y - i.position.chunk.y)
    };

    if (chunkDist.x > this.dims / 2) {
      chunkDist.x = this.dims - chunkDist.x;
    }

    if (chunkDist.y > this.dims / 2) {
      chunkDist.y = this.dims - chunkDist.y;
    }

    if (Math.max(chunkDist.x, chunkDist.y) >= 2) {
      i.hidden = true;
    }
  }

  getCurrentBiome() : Biome {
    let chunk = this.ship.getShip().position.chunk;
    return this.biomemgr.getChunkType(chunk.x, chunk.y);
  }

  update() {
    if (this.ship) {
      this.ship.update(this.dims);
      this.biomemgr.updateStoredChunks(this.ship.getShip().position.chunk);

      // poll input, see if we need to generate a projectile
      if (this.ship.isShoot()) {
        this.generateProjectile_(this.ship.getShip());
      }

      // calculate chunk dist between object and player
      // if >= 2, hide it.

      // update all instances
      for (let a of this.asteroids.values()) {
        if (a.hidden) {
          continue;
        }

        let packetInst = this.asteroidsPacket.get(a.id);
        if (packetInst) {
          UpdateAndInterpolate(a, packetInst, this.dims);
        } else {
          UpdateInstance(a, this.dims);
        }

        if (GetDistance(a, this.ship.getShip().position, this.dims) < 12) {
          if (Collide(a, this.ship.getShip().position, this.dims)) {
            if (!this.ship.ship.destroyed) {
              setTimeout(this.respawnShip_.bind(this), 3000);
            }
            
            this.ship.collide();
          }
        }

        this.hideIfDistance(this.ship.getShip(), a);
      }
  
      for (let s of this.ships.values()) {
        if (s.hidden) {
          continue;
        }
        let packetInst = this.shipsPacket.get(s.id);
        if (packetInst) {
          UpdateAndInterpolate(s, packetInst, this.dims);
        } else {
          UpdateInstance(s, this.dims);
        }

        this.hideIfDistance(this.ship.getShip(), s);
      }

      for (let p of this.projectiles.values()) {
        if (p.hidden) {
          continue;
        }

        let packetInst = this.projectilesPacket.get(p.id);
        if (packetInst) {
          UpdateAndInterpolate(p, packetInst, this.dims);
        } else {
          UpdateInstance(p, this.dims);
        }

        this.hideIfDistance(this.ship.getShip(), p);
      }

      let delColl = [];
      for (let c of this.collisions.values()) {
        for (let p of c.particles) {
          UpdateInstance(p, this.dims);
        }

        if ((getOriginTime() + performance.now() / 1000) - c.creationTime > 2.0) {
          delColl.push(c.id);
        }
      }

      for (let i of delColl) {
        this.collisions.delete(i);
      }

      for (let pl of this.projectilesLocal.values()) {
        // no server side equiv yet!
        UpdateInstance(pl, this.dims);
        this.hideIfDistance(this.ship.getShip(), pl);
      }

      for (let ph of this.projectilesHot.values()) {
        UpdateInstance(ph, this.dims);
        this.hideIfDistance(this.ship.getShip(), ph);
      }
    }
  }
}
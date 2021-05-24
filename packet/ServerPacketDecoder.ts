import { Asteroid } from "../instances/Asteroid";
import { Collision } from "../instances/Collision";
import { Instance, Point2D, WorldPosition } from "../instances/GameTypes";
import { Projectile } from "../instances/Projectile";
import { ClientShip } from "../instances/Ship";
import { ServerPacket } from "../server/ServerPacket";
import { DataStream } from "./DataStream";

// "WFSM"
const SERVER_PACKET_MAGIC = 0x5746534D;

const INSTANCE_SIZE = 45;

const HEADER_SIZE = 20;
const FOOTER_SIZE = 12;

const FLOAT32_POINT_SIZE = 8;
const UINT16_POINT_SIZE = 4;

const FLOAT64_SIZE = 8;

const ASTEROID_SIZE_BASE = INSTANCE_SIZE + 2;
const CLIENT_SHIP_SIZE_BASE = INSTANCE_SIZE + 9;
const COLLISION_SIZE = INSTANCE_SIZE + 8;
const PROJECTILE_SIZE = INSTANCE_SIZE + 24;

export class ServerPacketDecoder {
  private packet: ServerPacket;

  constructor(data: ServerPacket | ArrayBuffer) {
    if (data.constructor === ArrayBuffer) {
      this.decode_(data);
    } else {
      this.packet = data as ServerPacket;
    }
  }

  /**
   * @returns the contained server packet.
   */
  decode() : ServerPacket {
    return this.packet;
  }

  encode() : ArrayBuffer {
    let res = new ArrayBuffer(this.getPacketByteSize_());
    let view = new DataStream(res);

    let p = this.packet;

    view.writeUint32(SERVER_PACKET_MAGIC);
    
    view.writeUint16(p.asteroids.length);
    view.writeUint16(p.ships.length);
    view.writeUint16(p.collisions.length);
    view.writeUint16(p.deltas.length);
    view.writeUint16(p.projectiles.length);
    view.writeUint16(p.projectilesLocal.length);
    view.writeUint16(p.deleted.length);
    view.writeUint16(p.deletedLocal.length);

    for (let a of p.asteroids) {
      this.writeAsteroid(a, view);
    }

    for (let s of p.ships) {
      this.writeClientShip(s, view);
    }

    for (let c of p.collisions) {
      this.writeCollision(c, view);
    }

    for (let d of p.deltas) {
      this.writeInstance(d, view);
    }

    for (let pr of p.projectiles) {
      this.writeProjectile(pr, view);
    }

    for (let pl of p.projectilesLocal) {
      this.writeProjectile(pl, view);
    }

    for (let d of p.deleted) {
      view.writeFloat64(d);
    }

    for (let d of p.deletedLocal) {
      view.writeFloat64(d);
    }

    view.writeFloat64(p.serverTime);
    view.writeUint32(p.score);

    return res;
  }

  private getPacketByteSize_() : number {
    let s = HEADER_SIZE;

    for (let asteroid of this.packet.asteroids) {
      s += ASTEROID_SIZE_BASE + asteroid.geometry.length * FLOAT32_POINT_SIZE;
    }

    for (let ship of this.packet.ships) {
      s += CLIENT_SHIP_SIZE_BASE + ship.name.length;
    }

    s += this.packet.collisions.length *        COLLISION_SIZE;
    s += this.packet.deltas.length *            INSTANCE_SIZE;
    s += this.packet.projectiles.length *       PROJECTILE_SIZE;
    s += this.packet.projectilesLocal.length *  PROJECTILE_SIZE;
    s += this.packet.deleted.length *           FLOAT64_SIZE;
    s += this.packet.deletedLocal.length *      FLOAT64_SIZE;

    s += FOOTER_SIZE;

    return s;
  }

  private decode_(buffer: ArrayBuffer) {
    let res = {} as ServerPacket;
    let view : DataStream = new DataStream(buffer);
    
    // verify header
    let magic = view.nextUint32();
    if (magic !== SERVER_PACKET_MAGIC) {
      // invalid read
      this.packet = null;
      console.error("server packet magic is invalid.");
      throw "Inputted buffer's magic value did not match!";
    }

    // number of instances per category
    let asteroidCount = view.nextUint16();
    let shipCount = view.nextUint16();
    let collisionCount = view.nextUint16();
    let deltaCount = view.nextUint16();
    let projectileCount = view.nextUint16();
    let projectilesLocalCount = view.nextUint16();
    let deletionCount = view.nextUint16();
    let deletedLocalCount = view.nextUint16();

    res.asteroids = [];
    for (let i = 0; i < asteroidCount; i++) {
      res.asteroids.push(this.readAsteroid(view));
    }

    res.ships = [];
    for (let i = 0; i < shipCount; i++) {
      res.ships.push(this.readClientShip(view));
    }

    res.collisions = [];
    for (let i = 0; i < collisionCount; i++) {
      res.collisions.push(this.readCollision(view));
    }

    res.deltas = [];
    for (let i = 0; i < deltaCount; i++) {
      res.deltas.push(this.readInstance(view));
    }

    res.projectiles = [];
    for (let i = 0; i < projectileCount; i++) {
      res.projectiles.push(this.readProjectile(view));
    }

    res.projectilesLocal = [];
    for (let i = 0; i < projectilesLocalCount; i++) {
      res.projectilesLocal.push(this.readProjectile(view));
    }

    res.deleted = [];
    for (let i = 0; i < deletionCount; i++) {
      res.deleted.push(view.nextFloat64());
    }

    res.deletedLocal = [];
    for (let i = 0; i < deletedLocalCount; i++) {
      res.deletedLocal.push(view.nextFloat64());
    }

    // footer
    res.serverTime = view.nextFloat64();
    res.score = view.nextUint32();

    this.packet = res;
  }

  private readInstance(view: DataStream) : Instance {
    let res = {} as Instance;
    res.position = {} as WorldPosition;
    res.position.chunk = {} as Point2D;
    res.position.position = {} as Point2D;
    res.velocity = {} as Point2D;

    res.position.chunk.x = view.nextUint16();
    res.position.chunk.y = view.nextUint16();
    res.position.position.x = view.nextFloat32();
    res.position.position.y = view.nextFloat32();
    res.velocity.x = view.nextFloat32();
    res.velocity.y = view.nextFloat32();
    res.rotation = view.nextFloat32();
    res.rotation_velocity = view.nextFloat32();

    // best i can do for now
    res.id = view.nextFloat64();
    res.last_delta = view.nextFloat64();

    res.hidden = (view.nextUint8() > 0);

    return res;
  }

  private writeInstance(i: Instance, view: DataStream) {
    view.writeUint16(i.position.chunk.x);
    view.writeUint16(i.position.chunk.y);
    view.writeFloat32(i.position.position.x);
    view.writeFloat32(i.position.position.y);
    view.writeFloat32(i.velocity.x);
    view.writeFloat32(i.velocity.y);
    view.writeFloat32(i.rotation);
    view.writeFloat32(i.rotation_velocity);

    view.writeFloat64(i.id);
    view.writeFloat64(i.last_delta);

    view.writeUint8((i.hidden ? 1 : 0));
  }

  private readAsteroid(view: DataStream) : Asteroid {
    let res = this.readInstance(view) as Asteroid;
    let pointCount = view.nextUint16();
    let points = [] as Array<Point2D>;
    while (pointCount > 0) {
      let x = view.nextFloat32();
      let y = view.nextFloat32();
      points.push({
        "x": x,
        "y": y
      });

      pointCount--;
    }

    res.geometry = points;
    return res;
  }

  private writeAsteroid(a: Asteroid, view: DataStream) {
    this.writeInstance(a, view);
    view.writeUint16(a.geometry.length);
    for (let i = 0; i < a.geometry.length; i++) {
      view.writeFloat32(a.geometry[i].x);
      view.writeFloat32(a.geometry[i].y);
    }
  }

  private readClientShip(view: DataStream) : ClientShip {
    let res = this.readInstance(view) as ClientShip;
    let namelen = view.nextUint16();
    let charcodes : Array<number> = [];
    while (namelen > 0) {
      charcodes.push(view.nextUint8());
      namelen--;
    }
    
    res.name = String.fromCharCode(...charcodes);
    res.score = view.nextUint32();
    res.destroyed = (view.nextUint8() > 0);
    res.lives = view.nextUint16();
    
    return res;
  }

  private writeClientShip(s: ClientShip, view: DataStream) {
    this.writeInstance(s, view);
    view.writeUint16(s.name.length);
    for (let i = 0; i < s.name.length; i++) {
      view.writeUint8(s.name.charCodeAt(i));
    }

    view.writeUint32(s.score);
    view.writeUint8((s.destroyed ? 1 : 0));
    view.writeUint16(s.lives);
  }

  private readCollision(view: DataStream) : Collision {
    let res = this.readInstance(view) as Collision;
    res.creationTime = view.nextFloat64();

    return res;
  }

  private writeCollision(c: Collision, view: DataStream) {
    this.writeInstance(c, view);
    view.writeFloat64(c.creationTime);
  }

  private readProjectile(view: DataStream) : Projectile {
    let res = this.readInstance(view) as Projectile;
    res.origin = {} as WorldPosition;
    res.origin.chunk = {} as Point2D;
    res.origin.position = {} as Point2D;
    res.clientID = view.nextUint32();
    res.creationTime = view.nextFloat64();
    res.origin.chunk.x = view.nextUint16();
    res.origin.chunk.y = view.nextUint16();
    res.origin.position.x = view.nextFloat32();
    res.origin.position.y = view.nextFloat32();

    return res;
  }

  private writeProjectile(p: Projectile, view: DataStream) {
    this.writeInstance(p, view);
    view.writeUint32(p.clientID);
    view.writeFloat64(p.creationTime);
    view.writeUint16(p.origin.chunk.x);
    view.writeUint16(p.origin.chunk.y);
    view.writeFloat32(p.origin.position.x);
    view.writeFloat32(p.origin.position.y);
  }
}
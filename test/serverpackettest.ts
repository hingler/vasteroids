import { expect } from "chai";
import { Asteroid } from "../instances/Asteroid";
import { Collision } from "../instances/Collision";
import { Instance, Point2D, WorldPosition } from "../instances/GameTypes";
import { Projectile } from "../instances/Projectile";
import { ClientShip } from "../instances/Ship";
import { ServerPacketDecoder } from "../packet/ServerPacketDecoder";
import { ServerPacket } from "../server/ServerPacket";

function reencodeAndCompare(input: ServerPacket) {
  let encoder = new ServerPacketDecoder(input);
  let b = encoder.encode();
  let decoder = new ServerPacketDecoder(b);
  let compare = decoder.decode();

  expect(compare.asteroids.length).to.equal(input.asteroids.length);
  expect(compare.ships.length).to.equal(input.ships.length);
  expect(compare.collisions.length).to.equal(input.collisions.length);
  expect(compare.deltas.length).to.equal(input.deltas.length);
  expect(compare.projectiles.length).to.equal(input.projectiles.length);
  expect(compare.projectilesLocal.length).to.equal(input.projectilesLocal.length);
  expect(compare.deleted.length).to.equal(input.deleted.length);
  expect(compare.deletedLocal.length).to.equal(input.deletedLocal.length);

  for (let i = 0; i < compare.asteroids.length; i++) {
    compareAsteroids(compare.asteroids[i], input.asteroids[i]);
  }

  for (let i = 0; i < compare.ships.length; i++) {
    compareShips(compare.ships[i], input.ships[i]);
  }

  for (let i = 0; i < compare.collisions.length; i++) {
    compareCollisions(compare.collisions[i], input.collisions[i]);
  }

  for (let i = 0; i < compare.deltas.length; i++) {
    compareInstances(compare.deltas[i], input.deltas[i]);
  }

  for (let i = 0; i < compare.projectiles.length; i++) {
    compareProjectiles(compare.projectiles[i], input.projectiles[i]);
  }

  for (let i = 0; i < compare.projectilesLocal.length; i++) {
    compareProjectiles(compare.projectilesLocal[i], input.projectilesLocal[i]);
  }

  for (let i = 0; i < compare.deleted.length; i++) {
    expect(compare.deleted[i]).to.equal(input.deleted[i]);
  }

  for (let i = 0; i < compare.deletedLocal.length; i++) {
    expect(compare.deletedLocal[i]).to.equal(input.deletedLocal[i]);
  }
}

function compareInstances(a: Instance, b: Instance) {
  expect(a.id).to.equal(b.id);
  expect(a.position.position.x).to.approximately(b.position.position.x, 0.001);
  expect(a.position.position.y).to.approximately(b.position.position.y, 0.001);
  expect(a.position.chunk.x).to.equal(b.position.chunk.x);
  expect(a.position.chunk.y).to.equal(b.position.chunk.y);
  expect(a.rotation).to.approximately(b.rotation, 0.001);
  expect(a.rotation_velocity).to.approximately(b.rotation_velocity, 0.001);
  expect(a.velocity.x).to.approximately(b.velocity.x, 0.0001);
  expect(a.velocity.y).to.approximately(b.velocity.y, 0.0001);
  expect(a.last_delta).to.approximately(b.last_delta, 0.0001);
  expect(a.hidden).to.equal(b.hidden);
}

function compareAsteroids(a: Asteroid, b: Asteroid) {
  compareInstances(a, b);
  expect(a.geometry.length).to.equal(b.geometry.length);
  for (let i = 0; i < a.geometry.length; i++) {
    expect(a.geometry[i].x).to.approximately(b.geometry[i].x, 0.0001);
    expect(a.geometry[i].y).to.approximately(b.geometry[i].y, 0.0001);
  }
}

function compareShips(a: ClientShip, b: ClientShip) {
  compareInstances(a, b);
  expect(a.name).to.equal(b.name);
  expect(a.score).to.equal(b.score);
  expect(a.lives).to.equal(b.lives);
  expect(a.destroyed).to.equal(b.destroyed);
}

function compareProjectiles(a: Projectile, b: Projectile) {
  compareInstances(a, b);
  expect(a.clientID).to.equal(b.clientID);
  expect(a.creationTime).to.approximately(b.creationTime, 0.0001);
  expect(a.origin.position.x).to.approximately(b.origin.position.x, 0.001);
  expect(a.origin.position.y).to.approximately(b.origin.position.y, 0.001);
  expect(a.origin.chunk.x).to.equal(b.origin.chunk.x);
  expect(a.origin.chunk.y).to.equal(b.origin.chunk.y);
}

function compareCollisions(a: Collision, b: Collision) {
  compareInstances(a, b);
  expect(a.creationTime).to.approximately(b.creationTime, 0.0001);
}

function createServerPacket() : ServerPacket {
  let res = {} as ServerPacket;
  res.asteroids = [];
  res.collisions = [];
  res.deleted = [];
  res.deletedLocal = [];
  res.deltas = [];
  res.projectiles = [];
  res.projectilesLocal = [];
  res.score = 0;
  res.serverTime = 0;
  res.ships = [];

  return res;
}

function createNewInstance() : Instance {
  let res = {} as Instance;
  res.position = {} as WorldPosition;
  res.position.chunk = {} as Point2D;
  res.position.position = {} as Point2D;

  res.position.chunk.x = 0;
  res.position.chunk.y = 0;
  res.position.position.x = 0;
  res.position.position.y = 0;

  res.velocity = {} as Point2D;
  
  res.velocity.x = 0;
  res.velocity.y = 0;

  res.id = 0;
  res.hidden = false;
  res.rotation = 0;
  res.rotation_velocity = 0;

  res.last_delta = 0;

  return res;
}


describe("ServerPacketDecoder", function() {
  describe("Single-type handling", function() {
    it("Should handle asteroid data properly", function() {
      // build server packets
      // call the reencode function
      // over and over and over :(
      let res = createServerPacket();
      for (let i = 0; i < 16; i++) {
        let a = createNewInstance() as Asteroid;
        a.position.position.x = i;
        a.position.position.y = i;
        a.position.chunk.x = i;
        a.position.chunk.y = i;

        a.hidden = false;
        a.rotation = i * Math.PI / 16;
        a.rotation_velocity = -i / 16;
        a.velocity.x = -i;
        a.velocity.y = -i;

        a.id = i;

        a.geometry = [];

        for (let j = 0; j < 12; j++) {
          a.geometry.push({
            x: (i + 1) * Math.cos(j * 2 * Math.PI / 12),
            y: (i + 1) * Math.sin(j * 2 * Math.PI / 12)
          });
        }

        res.asteroids.push(a);
      }

      reencodeAndCompare(res);
    });
  });

  it("Should handle ship data correctly", function() {
    let res = createServerPacket();
    for (let i = 0; i < 16; i++) {
      let s = createNewInstance() as ClientShip;
      s.destroyed = !!(i & 1);
      s.lives = i + 1;
      s.name = Math.sin(i * 128.44).toString(16);
      s.score = i * 1000 + 50;
      
      s.position.position.x = i;
      s.position.position.y = i;
      s.position.chunk.x = i;
      s.position.chunk.y = i;

      s.hidden = false;
      s.rotation = i * Math.PI / 16;
      s.rotation_velocity = -i / 16;
      s.velocity.x = -i;
      s.velocity.y = -i;

      s.id = i;

      res.ships.push(s);
    }

    reencodeAndCompare(res);
  })

  it("Should handle collision data correctly", function() {
    let res = createServerPacket();
    for (let i = 0; i < 16; i++) {
      let c = createNewInstance() as Collision;
      
      c.position.position.x = i;
      c.position.position.y = i;
      c.position.chunk.x = i;
      c.position.chunk.y = i;

      c.hidden = false;
      c.rotation = i * Math.PI / 16;
      c.rotation_velocity = -i / 16;
      c.velocity.x = -i;
      c.velocity.y = -i;

      c.id = i;

      c.creationTime = i * 32;

      res.collisions.push(c);
    }

    reencodeAndCompare(res);
  });

  it("Should handle deltas correctly", function() {
    let res = createServerPacket();
    for (let i = 0; i < 16; i++) {
      let l = createNewInstance() as Instance;
      
      l.position.position.x = i;
      l.position.position.y = i;
      l.position.chunk.x = i;
      l.position.chunk.y = i;

      l.hidden = false;
      l.rotation = i * Math.PI / 16;
      l.rotation_velocity = -i / 16;
      l.velocity.x = -i;
      l.velocity.y = -i;

      l.id = i;

      res.deltas.push(l);
    }

    reencodeAndCompare(res);
  });

  it("Should handle projectiles correctly", function() {
    let res = createServerPacket();
    for (let i = 0; i < 16; i++) {
      let p = createNewInstance() as Projectile;

      p.position.position.x = i;
      p.position.position.y = i;
      p.position.chunk.x = i;
      p.position.chunk.y = i;

      p.hidden = false;
      p.rotation = i * Math.PI / 16;
      p.rotation_velocity = -i / 16;
      p.velocity.x = -i;
      p.velocity.y = -i;

      p.clientID = 32 - i;
      p.creationTime = i * 32.0;
      p.origin = {} as WorldPosition;
      p.origin.chunk = {} as Point2D;
      p.origin.position = {} as Point2D;

      p.origin.chunk.x = i * 64.0;
      p.origin.chunk.y = i * 32.0;
      p.origin.position.x = i * 16.0;
      p.origin.position.y = i * 8.0;
    
      res.projectiles.push(p);
    }

    reencodeAndCompare(res);
  });

  it("Should handle local projectiles correctly", function() {
    let res = createServerPacket();
    for (let i = 0; i < 16; i++) {
      let p = createNewInstance() as Projectile;

      p.position.position.x = i;
      p.position.position.y = i;
      p.position.chunk.x = i;
      p.position.chunk.y = i;

      p.hidden = false;
      p.rotation = i * Math.PI / 16;
      p.rotation_velocity = -i / 16;
      p.velocity.x = -i;
      p.velocity.y = -i;

      p.clientID = 32 - i;
      p.creationTime = i * 32.0;
      p.origin = {} as WorldPosition;
      p.origin.chunk = {} as Point2D;
      p.origin.position = {} as Point2D;

      p.origin.chunk.x = i * 64.0;
      p.origin.chunk.y = i * 32.0;
      p.origin.position.x = i * 16.0;
      p.origin.position.y = i * 8.0;
    
      res.projectilesLocal.push(p);
    }

    reencodeAndCompare(res);
  });

  it("Should handle deletions correctly", function() {
    let res = createServerPacket();
    for (let i = 0; i < 32; i++) {
      res.deleted.push(i * 64);
      res.deletedLocal.push(2048 - i * 64);
    }

    reencodeAndCompare(res);
  });

  it("Should properly encode and decode a myriad of data types", function() {
    let res = createServerPacket();
    let insts = []
    for (let i = 0; i < 192; i++) {
      let inst = createNewInstance();
      inst.position.position.x = i;
      inst.position.position.y = i;
      inst.position.chunk.x = i;
      inst.position.chunk.y = i;

      inst.hidden = false;
      inst.rotation = i * Math.PI / 16;
      inst.rotation_velocity = -i / 16;
      inst.velocity.x = -i;
      inst.velocity.y = -i;
    
      insts.push(inst);
    }

    // asteroids
    for (let i = 0; i < 32; i++) {
      let a = insts[i] as Asteroid;
      a.geometry = [] as Array<Point2D>;
      for (let j = 0; j < 12; j++) {
        a.geometry.push({
          x: (i + 1) * Math.cos(j * 2 * Math.PI / 12),
          y: (i + 1) * Math.sin(j * 2 * Math.PI / 12)
        });
      }

      res.asteroids.push(a);
    }
    // collisions
    for (let i = 32; i < 64; i++) {
      let c = insts[i] as Collision;
      c.creationTime = i * 32;
      res.collisions.push(c);
    }

    // ships
    for (let i = 64; i < 96; i++) {
      let s = insts[i] as ClientShip;
      s.destroyed = !!(i & 1);
      s.lives = i + 1;
      s.name = Math.sin(i * 128.44).toString(16);
      s.score = i * 1000 + 50;

      res.ships.push(s);
    }
    // deltas

    for (let i = 96; i < 128; i++) {
      let d = insts[i];
      res.deltas.push(d);
    }
    // projectiles

    for (let i = 128; i < 160; i++) {
      let p = insts[i] as Projectile;

      p.clientID = 256 - i;
      p.creationTime = i * 32.0;
      p.origin = {} as WorldPosition;
      p.origin.chunk = {} as Point2D;
      p.origin.position = {} as Point2D;

      p.origin.chunk.x = i * 64.0;
      p.origin.chunk.y = i * 32.0;
      p.origin.position.x = i * 16.0;
      p.origin.position.y = i * 8.0;
    
      res.projectiles.push(p);
    }
    // projectileslocal
    for (let i = 160; i < 192; i++) {
      let p = insts[i] as Projectile;

      p.clientID = 256 - i;
      p.creationTime = i * 32.0;
      p.origin = {} as WorldPosition;
      p.origin.chunk = {} as Point2D;
      p.origin.position = {} as Point2D;

      p.origin.chunk.x = i * 64.0;
      p.origin.chunk.y = i * 32.0;
      p.origin.position.x = i * 16.0;
      p.origin.position.y = i * 8.0;
    
      res.projectilesLocal.push(p);
    }

    reencodeAndCompare(res);
  })
});
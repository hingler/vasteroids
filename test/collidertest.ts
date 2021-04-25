const ColliderTest = require("bindings")("collidertest");
import { expect } from "chai";
import { WorldPosition, Point2D } from "../instances/GameTypes"
import { Asteroid } from "../instances/Asteroid";

describe("ColliderFunction", function() {
  it("Should return correctly when a collision occurs", function() {
    // manually describe an asteroid
    let a = {} as Asteroid;
    a.last_delta = 0;
    a.geometry = [];
    a.position = {
      chunk: { x: 0, y: 0 },
      position: {x: 0, y: 0 }
    };

    a.rotation = 0;
    a.rotation_velocity = 0;
    a.velocity = {x: 0, y: 0};
    a.id = 0;
    for (let i = 0; i < 12; i++) {
      let theta = ((Math.PI) / 6) * i;
      a.geometry.push({
        x: Math.cos(theta) * 2,
        y: Math.sin(theta) * 2
      });
    }

    let worldpos = {
      chunk: { x: 0, y: 0 },
      position: { x: 0, y: 0 }
    } as WorldPosition;

    worldpos.position = {
      x: 1.0,
      y: 1.0
    };

    let res = ColliderTest.collide(a, worldpos, 1);
    expect(res).is.true;

    worldpos.position = {
      x: 1.5,
      y: 1.5
    };

    res = ColliderTest.collide(a, worldpos, 1);
    expect(res).is.false;

    worldpos.position = {
      x: 1.0,
      y: 0.0
    };

    res = ColliderTest.collide(a, worldpos, 1);
    expect(res).is.true;

    worldpos.position = {
      x: -0.5,
      y: -0.5
    };

    res = ColliderTest.collide(a, worldpos, 1);
    expect(res).is.true;

    worldpos.position = {
      x: 0.0,
      y: 0.0
    };

    res = ColliderTest.collide(a, worldpos, 1);
    expect(res).is.true;

    worldpos.position = {
      x: 2.001,
      y: 0.0
    }

    res = ColliderTest.collide(a, worldpos, 1);
    expect(res).is.false;
  });

  it("Should account for rotation", function() {
    let a = {} as Asteroid;
    a.id = 0;
    a.geometry = [];
    a.position = {
      position: { x: 0, y: 0 },
      chunk: { x: 0, y: 0 }
    };
    a.rotation = 0;
    a.rotation_velocity = 0;
    a.velocity = {x: 0, y: 0};
    a.last_delta = 0;
    for (let i = 0; i < 12; i++) {
      let theta = ((Math.PI) / 6) * i;
      // radius oscillates between 0.5 and 2.5 -- odd indices are 0.5, even indices are 2.5
      a.geometry.push({
        x: Math.cos(theta) * (1.5 + Math.cos(theta * 6)),
        y: Math.sin(theta) * (1.5 + Math.cos(theta * 6))
      });
    }

    let point = {
      chunk: { x: 0, y: 0 },
      position: { x: 1.0, y: 0.0 }
    } as WorldPosition;

    let res : boolean; 
    for (let i = 0; i < 12; i++) {
      a.rotation = (i * (Math.PI)) / 6;
      res = ColliderTest.collide(a, point, 1);
      if (i & 1) {
        expect(res).is.false;
      } else {
        expect(res).is.true;
      }
    }
  });

  it("should handle collisions across world border", function() {
    let a = {} as Asteroid;
    a.id = 0;
    a.geometry = [];
    a.position = {
      position: { x: 0.5, y: 0.5 },
      chunk: { x: 0, y: 0 }
    };

    a.rotation = 0;
    a.rotation_velocity = 0;
    a.velocity = {x: 0, y: 0};
    a.last_delta = 0;

    let point = {
      chunk: {x: 15, y: 15 },
      position: {x: 127.9, y: 127.9 }
    } as WorldPosition;

    for (let i = 0; i < 12; i++) {
      let theta = ((Math.PI) / 6) * i;
      a.geometry.push({
        x: Math.cos(theta) * 1.5,
        y: Math.sin(theta) * 1.5
      });
    }

    expect(ColliderTest.collide(a, point, 16)).is.true;
    expect(ColliderTest.collide(a, point, 32)).is.false;
  })
});
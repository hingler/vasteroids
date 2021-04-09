const ColliderTest = require("bindings")("collidertest");
import { expect } from "chai";
import { WorldPosition, Point2D } from "../instances/GameTypes"
import { Asteroid } from "../instances/Asteroid";

describe("ColliderFunction", function() {
  it("Should return correctly when a collision occurs", function() {
    // manually describe an asteroid
    let a = {} as Asteroid;
    a.geometry = [];
    a.position = {
      chunk: { x: 0, y: 0 },
      position: {x: 0, y: 0 }
    };

    a.rotation = 0;
    a.rotation_velocity = 0;
    a.velocity = {x: 0, y: 0};
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

    let res = ColliderTest.collide(a, worldpos);
    expect(res).is.true;

    worldpos.position = {
      x: 1.5,
      y: 1.5
    };

    res = ColliderTest.collide(a, worldpos);
    expect(res).is.false;

    worldpos.position = {
      x: 1.0,
      y: 0.0
    };

    res = ColliderTest.collide(a, worldpos);
    expect(res).is.true;

    worldpos.position = {
      x: 0.0,
      y: 0.0
    };

    res = ColliderTest.collide(a, worldpos);
    expect(res).is.true;

    worldpos.position = {
      x: 2.001,
      y: 0.0
    }

    res = ColliderTest.collide(a, worldpos);
    expect(res).is.false;
  });

  it("Should account for rotation", function() {
    let a = {} as Asteroid;
    a.geometry = [];
    a.position = {
      position: { x: 0, y: 0 },
      chunk: { x: 0, y: 0 }
    };
    a.rotation = 0;
    a.rotation_velocity = 0;
    a.velocity = {x: 0, y: 0};
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
      res = ColliderTest.collide(a, point);
      if (i & 1) {
        expect(res).is.false;
      } else {
        expect(res).is.true;
      }
    }
  })
});
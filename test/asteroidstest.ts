const AsteroidsTest = require("bindings")("asteroidstest");
import { expect } from "chai";
import { Asteroid } from "../addons-ts/Asteroid"

describe("Asteroids", function() {
  it("Should return an asteroid on valid input", function() {
    let ast = AsteroidsTest.generateAsteroid(1.5, 12) as Asteroid;
    expect(ast.geometry.length).to.equal(12);
    
    for (let point of ast.geometry) {
      expect(Math.sqrt(point.x * point.x + point.y * point.y)).to.be.lessThan(1.5);
    }
  });
});

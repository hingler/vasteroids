const AsteroidsTest = require("bindings")("asteroidstest");
const expect = require("chai").expect;

describe("Asteroids", function() {
  it("Should return an asteroid on valid input", function() {
    let ast = AsteroidsTest.generateAsteroid(1.5, 12);
    expect(ast.geometry.length).to.equal(12);
  });
});

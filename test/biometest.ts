const BiomeTest = require("bindings")("biometest");

describe("Biomes", function() {
  it("should pass :^)", function() { BiomeTest.RUNBIOMETEST() });
})
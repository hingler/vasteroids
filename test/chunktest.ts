const ChunkTest = require("bindings")("chunktest");

describe("Chunks", function() {
  it("Should pass our test gauntlet >:)", function() { ChunkTest.RUNCHUNKTEST() });
});
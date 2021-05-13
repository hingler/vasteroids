import { expect } from "chai";
import { Biome, BiomeInfo } from "../instances/Biome";
import { BiomePacket } from "../packet/BiomePacket";

describe("BiomePacket", function() {
  it("Should properly encode input", function() {
    let arr: Array<BiomeInfo> = [];
    arr.push({
      chunk: {
        x: 0,
        y: 0
      },

      biome: Biome.BLACKHOLE
    });

    let pkt = new BiomePacket(arr);
    let buf = pkt.encode();

    let view = new DataView(buf);
    expect(view.getUint32(0, true)).to.equal(1);
    expect(view.getUint16(4, true)).to.equal(0);
    expect(view.getUint16(6, true)).to.equal(0);
    expect(view.getUint8(8)).to.equal(Biome.BLACKHOLE);
  });

  it("Should properly decode input", function() {
    let buf = new ArrayBuffer(9);
    let view = new DataView(buf);
    view.setUint32(0, 1, true);
    view.setUint16(4, 0, true);
    view.setUint16(6, 0, true);
    view.setUint8(8, Biome.NEBULA);

    let pkt = new BiomePacket(buf);
    let res = pkt.decode();

    expect(res.length).to.equal(1);
    let info = res[0];
    expect(info.chunk.x).to.equal(0);
    expect(info.chunk.y).to.equal(0);
    expect(info.biome).to.equal(Biome.NEBULA);
  });
});
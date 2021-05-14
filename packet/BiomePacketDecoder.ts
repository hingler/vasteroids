import { Biome, BiomeInfo } from "../instances/Biome";
import { Point2D } from "../instances/GameTypes";

// size of each BiomeInfo, in bytes
const BIOME_SIZE = 5;

/**
 * Data packet representing a series of biomes.
 */
export class BiomePacketDecoder {
  private biomes: Array<BiomeInfo>;
  /**
   * Constructs a new BiomePacket from data.
   * 
   * @param data - input data
   */
  constructor(data: Array<BiomeInfo> | ArrayBuffer) {
    if (data.constructor === Array) {
      this.biomes = data;
    } else {
      this.decode_(data as ArrayBuffer);
    }
  }

  /**
   * Decode the contents of this BiomePacket to an array of BiomeInfos.
   */
  decode() : Array<BiomeInfo> {
    return Array.from(this.biomes);
  }

  /**
   * Encode the contents of this BiomePacket to an ArrayBuffer.
   */
  encode() : ArrayBuffer {
    let bufferSize = (BIOME_SIZE * this.biomes.length) + 4;
    let buf = new ArrayBuffer(bufferSize);
    let view = new DataView(buf);
    let offset = 0;
    view.setUint32(offset, this.biomes.length, true);
    offset += 4;

    for (let i = 0; i < this.biomes.length; i++) {
      let biome = this.biomes[i];
      view.setUint16(offset, biome.chunk.x, true);
      offset += 2;
      view.setUint16(offset, biome.chunk.y, true);
      offset += 2;
      view.setUint8(offset, biome.biome);
      offset += 1;
    }

    return buf;
  }

  private decode_(buffer: ArrayBuffer) {
    let view = new DataView(buffer);
    let offset = 0;
    let chunkCount = view.getUint32(offset, true);
    offset += 4;
    this.biomes = [];

    for (let i = 0; i < chunkCount; i++) {
      let info = {} as BiomeInfo;
      info.chunk = {} as Point2D;
      info.chunk.x = view.getUint16(offset, true);
      offset += 2;
      info.chunk.y = view.getUint16(offset, true);
      offset += 2;
      info.biome = view.getUint8(offset);
      offset += 1;

      this.biomes.push(info);
    }
  }
}
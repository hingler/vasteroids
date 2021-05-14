import { Biome } from "../../../instances/Biome";
import { Point2D } from "../../../instances/GameTypes";
import { BiomePacketDecoder } from "../../../packet/BiomePacketDecoder";

// number of chunks around ship whose biomes should be known
const SAFE_RANGE = 8;

/**
 * Maintains list of nearby biomes per chunk
 */
export class ClientBiomeMap {
  // tracks known biomes
  // fuck it: just store the whole thing and build it as we go
  private chunks: Array<Array<Biome>>;
  private dims: number;
  private updateLock: boolean;

  private lastChunk: Point2D;

  // if we fetch a chunk which hasn't been fetched yet, return invalid temporarily
  // try to fetch chunks in "strips," since this is how we'll typically access them
  // for the first set though, we can load all at once-
  constructor(chunk_dims: number) {
    this.dims = chunk_dims;
    this.chunks = [];
    this.updateLock = false;
    this.lastChunk = null;
    for (let i = 0; i < this.dims; i++) {
      this.chunks[i] = [];
      for (let j = 0; j < this.dims; j++) {
        // initialize all to invalid.
        this.chunks[i][j] = Biome.INVALID;
      }
    }
  }

  getChunkType(x: number, y: number) {
    return this.chunks[x][y];
  }

  updateStoredChunks(chunk: Point2D) {
    if (this.updateLock) {
      return;
    }

    if (this.lastChunk === null) {
      this.lastChunk = {
        x: chunk.x,
        y: chunk.y
      };

      this.updateInit_(this.lastChunk);
    } else {
      // create an array of promises and store them all in sequence
      // set updatelock to true
      // promise all and then set false.
      let chunk_delta_x = chunk.x - this.lastChunk.x;
      let x_sign = (chunk_delta_x >= 0 ? 1 : -1);
      let x_abs = Math.abs(chunk_delta_x);
      if (x_abs > 0) {
        for (let i = 0; i < x_abs; i++) {
          this.visitColumn(chunk.x + (x_sign * (SAFE_RANGE - i)), chunk.y);
        }
      }

      let chunk_delta_y = chunk.y - this.lastChunk.y;
      let y_sign = (chunk_delta_y >= 0 ? 1 : -1);
      let y_abs = Math.abs(chunk_delta_y);
      if (y_abs > 0) {
        for (let i = 0; i < y_abs; i++) {
          this.visitRow(chunk.y + (y_sign * (SAFE_RANGE - i)), chunk.x);
        }
      }

      this.lastChunk.x = chunk.x;
      this.lastChunk.y = chunk.y;
    }
  }

  /**
   * Visits a row and fetches new biome info if necessary.
   * @param y - row being fetched.
   * @param x - current occupied chunk in x -- used to scan local.
   */
  private visitRow(y: number, x: number) {
    for (let i = -(SAFE_RANGE); i <= SAFE_RANGE; i++) {
      if (this.chunks[x + i][y] === Biome.INVALID) {
        this.updateBounds_(
          {
            'x': x - SAFE_RANGE,
            'y': y
          },
          {
            'x': (2 * SAFE_RANGE + 1),
            'y': 1
          }
        );

        return;
      }
    }
  }

  /**
   * Visits a column and fetches new biome info if necessary.
   * @param x - column being fetched.
   * @param y - current occupied chunk in y -- used to scan local.
   */
  private visitColumn(x: number, y: number) {
    for (let i = -(SAFE_RANGE); i <= SAFE_RANGE; i++) {
      if (this.chunks[x][y + i] === Biome.INVALID) {
        this.updateBounds_(
          {
            'x': x,
            'y': y - SAFE_RANGE
          }, 
          {
            'x': 1,
            'y': (2 * SAFE_RANGE + 1)
          }
        );

        return;
      }
    }
    
  }

  private updateInit_(chunk: Point2D) {
    let origin: Point2D = {
      x: chunk.x - SAFE_RANGE,
      y: chunk.y - SAFE_RANGE
    };

    let dims: Point2D = {
      x: 2 * SAFE_RANGE + 1,
      y: 2 * SAFE_RANGE + 1
    };

    this.updateBounds_(origin, dims);
  }

  private updateBounds_(origin: Point2D, dims: Point2D) {
    // will be handled once ready -- race conditions aren't a problem!
    fetch("/biome", {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-type": "application/json"
      },

      body: JSON.stringify({
        "origin": origin,
        "dims": dims
      })
    }).then((r) => {
      if (r.status < 200 || r.status >= 400) {
        return Promise.reject("could not update bounds!");
      }

      return r.arrayBuffer();
    }).then((buf) => {
      let pkt: BiomePacketDecoder = new BiomePacketDecoder(buf);
      let biomeinfo = pkt.decode();
      for (let info of biomeinfo) {
        this.chunks[info.chunk.x][info.chunk.y] = info.biome;
      }
    }).catch((err) => {
      console.error(err);
    });
  }
}
/**
 * Wrapper arounds arrays which supports resizing, etc.
 * @param DataType - the type we are working with.
 * @param StorageType - the type which is stored under the hood.
 */
export interface Vector<DataType, StorageType> {
  push_back(d: DataType) : void;
  clear() : void;
  size() : number;
  byteLength() : number;
  data() : StorageType;
}

export class FloatVector implements Vector<number, Float32Array> {
  buffer: Float32Array;
  elementCount: number;

  constructor() {
    this.buffer = new Float32Array(32);
    this.elementCount = 0;
  }

  push_back(d: number) {
    if (this.elementCount >= this.buffer.length) {
      this.resize_();
    }

    this.buffer[this.elementCount++] = d;
  }

  clear() {
    this.elementCount = 0;
  }

  size() {
    return this.elementCount;
  }

  byteLength() {
    return this.elementCount * this.buffer.BYTES_PER_ELEMENT;
  }

  data() {
    return this.buffer;
  }

  private resize_() {
    let buf = new Float32Array(this.buffer.length * 2);
    buf.set(this.buffer, 0);
    this.buffer = buf;
  }
}

export class Uint32Vector implements Vector<number, Uint32Array> {
  buffer: Uint32Array;
  elementCount: number;

  constructor() {
    this.buffer = new Uint32Array(32);
    this.elementCount = 0;
  }

  push_back(d: number) {
    if (this.elementCount >= this.buffer.length) {
      this.resize_();
    }

    this.buffer[this.elementCount++] = d;
  }

  clear() {
    this.elementCount = 0;
  }

  size() {
    return this.elementCount;
  }

  byteLength() {
    return this.elementCount * this.buffer.BYTES_PER_ELEMENT;
  }

  data() {
    return this.buffer;
  }

  private resize_() {
    let buf = new Uint32Array(this.buffer.length * 2);
    buf.set(this.buffer, 0);
    this.buffer = buf;
  }
}
// a dataview-like class which treats data as a stream, automatically updating offset.

export class DataStream {
  buffer: ArrayBuffer;
  view: DataView;
  offset: number;
  len: number;

  littleEnd: boolean;

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.view = new DataView(buffer);
    this.offset = 0;
    this.len = this.buffer.byteLength;
    this.littleEnd = true;
  }

  nextUint8() {
    let res = this.view.getUint8(this.offset);
    this.offset += 1;
    return res;
  }

  writeUint8(n: number) {
    this.view.setUint8(this.offset, n);
    this.offset += 1;
  }

  nextUint16() {
    let res = this.view.getUint16(this.offset, this.littleEnd);
    this.offset += 2;
    return res;
  }

  writeUint16(n: number) {
    this.view.setUint16(this.offset, n, this.littleEnd);
    this.offset += 2;
  }

  nextUint32() {
    let res = this.view.getUint32(this.offset, this.littleEnd);
    this.offset += 4;
    return res;
  }

  writeUint32(n: number) {
    this.view.setUint32(this.offset, n, this.littleEnd);
    this.offset += 4;
  }

  nextFloat32() {
    let res = this.view.getFloat32(this.offset, this.littleEnd);
    this.offset += 4;
    return res;
  }

  writeFloat32(n: number) {
    this.view.setFloat32(this.offset, n, this.littleEnd);
    this.offset += 4;
  }

  nextFloat64() {
    let res = this.view.getFloat64(this.offset, this.littleEnd);
    this.offset += 8;
    return res;
  }

  writeFloat64(n: number) {
    this.view.setFloat64(this.offset, n, this.littleEnd);
    this.offset += 8;
  }
}
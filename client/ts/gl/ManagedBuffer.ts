import { Vector } from "./vector/Vector";

/**
 * Interface for a managed buffer which stores a particular type of information.
 */
export class ManagedBuffer<T extends Vector<number, ArrayBuffer>> {
  buffer: T;

  glBuffer: WebGLBuffer;
  glBufferSize: number;
  constructor(init: T) {
    this.buffer = init;
    this.glBuffer = null;
  }

  insertData(data: number) {
    this.buffer.push_back(data);
  }

  clear() {
    this.buffer.clear();
  }

  getBufferSize() {
    return this.buffer.byteLength();
  }
  getElementCount() : number {
    return this.buffer.size();
  }

  bindBuffer(gl: WebGLRenderingContext, target: number) : void {
    if (!this.glBuffer) {
      this.glBuffer = gl.createBuffer();
      this.glBufferSize = 0;
    }

    gl.bindBuffer(target, this.glBuffer);
    if (this.glBufferSize < this.buffer.byteLength()) {
      gl.bufferData(target, this.buffer.byteLength(), gl.DYNAMIC_DRAW);
      this.glBufferSize = this.buffer.byteLength();
    }

    gl.bufferSubData(target, 0, this.buffer.data());
  }
}
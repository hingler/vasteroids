import { ManagedBuffer } from "./ManagedBuffer";
import { FloatVector, Uint32Vector } from "./vector/Vector";

export class VectorMesh2D {
  vertexBuffer: ManagedBuffer<FloatVector>;
  indexBuffer: ManagedBuffer<Uint32Vector>;

  constructor() {
    this.vertexBuffer = new ManagedBuffer(new FloatVector());
    this.indexBuffer = new ManagedBuffer(new Uint32Vector());
  }

  addVertex(point: [number, number]) {
    this.vertexBuffer.insertData(point[0]);
    this.vertexBuffer.insertData(point[1]);
  }

  addTriangle(tri: [number, number, number]) {
    this.indexBuffer.insertData(tri[0]);
    this.indexBuffer.insertData(tri[1]);
    this.indexBuffer.insertData(tri[2]);
  }

  draw(gl: WebGLRenderingContext, location?: number) {
    this.vertexBuffer.bindBuffer(gl, gl.ARRAY_BUFFER);
    this.indexBuffer.bindBuffer(gl, gl.ELEMENT_ARRAY_BUFFER);
    let attribLoc = 0;
    if (location) {
      attribLoc = location;
    }

    gl.vertexAttribPointer(attribLoc, 2, gl.FLOAT, false, 0, 0);
    gl.drawElements(gl.TRIANGLES, this.indexBuffer.getElementCount(), gl.UNSIGNED_INT, 0);
  }

  getVertexCount() : number {
    return this.vertexBuffer.getElementCount() / 2;
  }

  getIndexCount() : number {
    return this.indexBuffer.getElementCount();
  }
}
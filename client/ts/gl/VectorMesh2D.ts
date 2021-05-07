import { ManagedBuffer } from "./ManagedBuffer";
import { FloatVector, Uint32Vector } from "./vector/Vector";

export class VectorMesh2D {
  vertexBuffer: ManagedBuffer<FloatVector>;
  indexBuffer: ManagedBuffer<Uint32Vector>;

  constructor() {
    this.vertexBuffer = new ManagedBuffer(new FloatVector());
    this.indexBuffer = new ManagedBuffer(new Uint32Vector());
  }

  addVertex(pointX: number, pointY: number, color?: [number, number, number, number]) {
    if (!color) {
      color = [1.0, 1.0, 1.0, 1.0];
    }

    this.vertexBuffer.insertData(pointX);
    this.vertexBuffer.insertData(pointY);

    this.vertexBuffer.insertData(color[0]);
    this.vertexBuffer.insertData(color[1]);
    this.vertexBuffer.insertData(color[2]);
    this.vertexBuffer.insertData(color[3]);
  }

  addTriangle(vertA: number, vertB: number, vertC: number) {
    this.indexBuffer.insertData(vertA);
    this.indexBuffer.insertData(vertB);
    this.indexBuffer.insertData(vertC);
  }

  draw(gl: WebGLRenderingContext, locationGeometry: number, locationColor?: number) {
    this.vertexBuffer.bindBuffer(gl, gl.ARRAY_BUFFER);
    this.indexBuffer.bindBuffer(gl, gl.ELEMENT_ARRAY_BUFFER);

    gl.vertexAttribPointer(locationGeometry, 2, gl.FLOAT, false, 6 * this.vertexBuffer.bytesPerElement(), 0);
    gl.enableVertexAttribArray(locationGeometry);
    if (locationColor) {
      gl.vertexAttribPointer(locationColor, 4, gl.FLOAT, false, 6 * this.vertexBuffer.bytesPerElement(), 2 * this.vertexBuffer.bytesPerElement());
      gl.enableVertexAttribArray(locationColor);
    }

    gl.drawElements(gl.TRIANGLES, this.indexBuffer.getElementCount(), gl.UNSIGNED_INT, 0);
  }

  getVertexCount() : number {
    return this.vertexBuffer.getElementCount() / 6;
  }

  getIndexCount() : number {
    return this.indexBuffer.getElementCount();
  }

  clear() {
    this.vertexBuffer.clear();
    this.indexBuffer.clear();
  }
}
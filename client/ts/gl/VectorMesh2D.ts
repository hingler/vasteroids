import { ManagedBuffer } from "./ManagedBuffer";
import { FloatVector, Uint32Vector } from "./vector/Vector";

export class VectorMesh2D {
  vertexBuffer: ManagedBuffer<FloatVector>;
  indexBuffer: ManagedBuffer<Uint32Vector>;

  constructor() {
    this.vertexBuffer = new ManagedBuffer(new FloatVector());
    this.indexBuffer = new ManagedBuffer(new Uint32Vector());
  }

  addVertex(point: [number, number], color?: [number, number, number, number]) {
    if (!color) {
      color = [1.0, 1.0, 1.0, 1.0];
    }

    this.vertexBuffer.insertData(point[0]);
    this.vertexBuffer.insertData(point[1]);

    this.vertexBuffer.insertData(color[0]);
    this.vertexBuffer.insertData(color[1]);
    this.vertexBuffer.insertData(color[2]);
    this.vertexBuffer.insertData(color[3]);
  }

  addTriangle(tri: [number, number, number]) {
    this.indexBuffer.insertData(tri[0]);
    this.indexBuffer.insertData(tri[1]);
    this.indexBuffer.insertData(tri[2]);
  }

  draw(gl: WebGLRenderingContext, locationGeometry: number, locationColor: number) {
    this.vertexBuffer.bindBuffer(gl, gl.ARRAY_BUFFER);
    this.indexBuffer.bindBuffer(gl, gl.ELEMENT_ARRAY_BUFFER);

    gl.vertexAttribPointer(locationGeometry, 2, gl.FLOAT, false, 6 * this.vertexBuffer.bytesPerElement(), 0);
    gl.enableVertexAttribArray(locationGeometry);
    gl.vertexAttribPointer(locationColor, 4, gl.FLOAT, false, 6 * this.vertexBuffer.bytesPerElement(), 2 * this.vertexBuffer.bytesPerElement());
    gl.enableVertexAttribArray(locationColor);

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
import { VectorMesh2D } from "../client/ts/gl/VectorMesh2D";
import { expect } from "chai";

describe("VectorMesh2D", function() {
  it("Should properly maintain a list of vertices", function() {
    let vec = new VectorMesh2D();
    expect(vec.getIndexCount()).to.equal(0);
    expect(vec.getVertexCount()).to.equal(0);
    vec.addVertex([0, 0]);
    expect(vec.getIndexCount()).to.equal(0);
    expect(vec.getVertexCount()).to.equal(1);
    vec.addVertex([2, 2]);
    vec.addVertex([1, 1]);
    expect(vec.getIndexCount()).to.equal(0);
    expect(vec.getVertexCount()).to.equal(3);
    vec.addTriangle([0, 1, 2]);
    expect(vec.getIndexCount()).to.equal(3);
    expect(vec.getVertexCount()).to.equal(3);
    for (let i = 3; i < 512; i++) {
      vec.addVertex([i, i]);
    }

    expect(vec.getIndexCount()).to.equal(3);
    expect(vec.getVertexCount()).to.equal(512);
  });
});
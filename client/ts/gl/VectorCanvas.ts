import { Point2D } from "../../../instances/GameTypes";
import { VectorDraw } from "./material/VectorDraw";
import { VectorMesh2D } from "./VectorMesh2D";

// TODO: VectorCanvas needs a way to communicate that compilation is complete.

/**
 * A client-side class which uses webGL to mimick vector graphics.
 */
export class VectorCanvas {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  mesh: VectorMesh2D;
  shader: VectorDraw;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl");
    this.mesh = new VectorMesh2D();
    this.shader = new VectorDraw(this.gl);
    
    const ext = this.gl.getExtension("OES_element_index_uint");
    if (!ext) {
      console.error("what the fuck are you doing");
    }

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
  }

  /**
   * Draws a line onto the screen.
   * Coordinates are specified in pixels from top left of screen.
   * @param startX - initial X
   * @param startY - initial Y
   * @param endX - terminal X
   * @param endY - terminal Y
   * @param stroke - width of line in px
   */
  addLine(startX: number, startY: number, endX: number, endY: number, stroke: number) {
    let width = this.canvas.clientWidth, height = this.canvas.clientHeight;
    let screenSX = ((startX * 2) /   width) - 1;
    let screenSY = ((startY * 2) /  -height) + 1;
    let screenEX = ((endX * 2)   /   width) - 1;
    let screenEY = ((endY * 2)   /  -height) + 1;

    // create perpendicular vector by swapping coords
    stroke = Math.abs(stroke);
    let strokeY = (endX - startX);
    let strokeX = (endY - startY);
    
    // correct for w/h of window
    strokeX *= (height / width);
    console.log([strokeX, strokeY]);
    [strokeX, strokeY] = this.normalize_(strokeX, strokeY);
    console.log([strokeX, strokeY]);

    let strokeDX = (strokeX * stroke) / width;
    let strokeDY = (strokeY * stroke) / width;

    let vertCount = this.mesh.getVertexCount();

    this.mesh.addVertex([screenSX + strokeDX, screenSY + strokeDY]);
    this.mesh.addVertex([screenSX - strokeDX, screenSY - strokeDY]);
    this.mesh.addVertex([screenEX + strokeDX, screenEY + strokeDY]);
    this.mesh.addVertex([screenEX - strokeDX, screenEY - strokeDY]);

    this.mesh.addTriangle([vertCount,     vertCount + 1, vertCount + 2]);
    this.mesh.addTriangle([vertCount + 1, vertCount + 3, vertCount + 2]);
  }

  drawToScreen() {
    // prepare a material beforehand
    // draw to a premade frame buffer
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.shader.drawMaterial(this.gl, this.mesh);
    // run a postfx pass to add some effects, etc.
    // render to screen
  }

  waitUntilCompiled() : Promise<void> {
    return this.shader.waitUntilCompiled();
  }

  private normalize_(x: number, y: number) : [number, number] {
    let mag = Math.sqrt(x * x + y * y);
    x /= mag;
    y /= mag;
    return [x, y];
  }
};
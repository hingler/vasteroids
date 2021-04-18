import { Point2D } from "../../../instances/GameTypes";
import { VectorMesh2D } from "./VectorMesh2D";

/**
 * A client-side class which uses webGL to mimick vector graphics.
 */
export class VectorCanvas {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  mesh: VectorMesh2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl");
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
    let screenSY = ((startY * 2) /  -width) + 1;
    let screenEX = ((endX * 2)   /   width) - 1;
    let screenEY = ((endY * 2)   /  -width) + 1;

    // create perpendicular vector by swapping coords
    stroke = Math.abs(stroke);
    let strokeY = (screenEX - screenSX);
    let strokeX = -(screenEY - screenSY);
    [strokeX, strokeY] = this.normalize_(strokeX, strokeY);

    let strokeDX = (strokeX) / width;
    let strokeDY = (strokeY) / width;

    let vertCount = this.mesh.getVertexCount();

    this.mesh.addVertex([screenSX + strokeDX, screenSY + strokeDY]);
    this.mesh.addVertex([screenSX - strokeDX, screenSY - strokeDY]);
    this.mesh.addVertex([screenEX + strokeDX, screenEY + strokeDY]);
    this.mesh.addVertex([screenEX - strokeDX, screenEY - strokeDY]);

    this.mesh.addTriangle([vertCount,     vertCount + 1, vertCount + 2]);
    this.mesh.addTriangle([vertCount + 1, vertCount + 3, vertCount + 2]);
  }

  drawToScreen(gl: WebGLRenderingContext) {
    // prepare a material beforehand
    // draw to a premade frame buffer
    this.mesh.draw(gl);
    // run a postfx pass to add some effects, etc.
    // render to screen
  }

  private normalize_(x: number, y: number) : [number, number] {
    let mag = x * x + y * y;
    x /= mag;
    y /= mag;
    return [x, y];
  }
};
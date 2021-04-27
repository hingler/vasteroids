import { Point2D } from "../../../instances/GameTypes";
import { letters } from "../render/letters";
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
    
    // store this -- use uint16t if not available
    const ext = this.gl.getExtension("OES_element_index_uint");
    if (!ext) {
      console.error("what the fuck are you doing");
    }

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
  }

  getWidth() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    return this.canvas.width;
  }

  getHeight() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    return this.canvas.height;
  }

  addText(startX: number, startY: number, text: string, stroke: number, size: [number, number]) {
    // multiply text size by scale
    let originX = startX;
    text = text.toLowerCase();
    for (let char of text) {
      if (!letters.hasOwnProperty(char)) {
        continue;
      }

      let coords = letters[char];
      for (let line of coords) {
        this.addLine(originX + line[0] * size[0], startY + (2.0 - line[1]) * size[1],
                     originX + line[2] * size[0], startY + (2.0 - line[3]) * size[1],
                     stroke);
      }

      originX += (1.25 * size[0] + stroke);
    }
  }

  // private arrayToLine(coords: Array<Array<number>>) {
  //   for (let arr of coords) {
  //     this.addLine(arr[0], arr[1], arr[2], arr[3], 2);
  //   }
  // }

  /**
   * Draws a line onto the screen.
   * Coordinates are specified in pixels from top left of screen.
   * @param startX - initial X
   * @param startY - initial Y
   * @param endX - terminal X
   * @param endY - terminal Y
   * @param stroke - width of line in px
   */
  addLine(startX: number, startY: number, endX: number, endY: number, stroke: number, color?: [number, number, number, number]) {
    if (!color) {
      color = [1.0, 1.0, 1.0, 1.0];
    }
    
    let width = this.canvas.clientWidth, height = this.canvas.clientHeight;

    if (startX > width && endX > width) {
      return;
    }

    if (startX < 0 && endX < 0) {
      return;
    }

    if (startY > height && endY > height) {
      return;
    }

    if (startY < 0 && endY < 0) {
      return;
    }

    let screenSX = ((startX * 2) /   width) - 1;
    let screenSY = ((startY * 2) /  -height) + 1;
    let screenEX = ((endX * 2)   /   width) - 1;
    let screenEY = ((endY * 2)   /  -height) + 1;

    // create perpendicular vector by swapping coords
    stroke = Math.abs(stroke);
    let strokeY = (endX - startX);
    let strokeX = (endY - startY);
    
    [strokeX, strokeY] = this.normalize_(strokeX, strokeY);

    let strokeDX = (strokeX * stroke) / width;
    let strokeDY = (strokeY * stroke) / height;

    let vertCount = this.mesh.getVertexCount();

    this.mesh.addVertex([screenSX + strokeDX, screenSY + strokeDY], color);
    this.mesh.addVertex([screenSX - strokeDX, screenSY - strokeDY], color);
    this.mesh.addVertex([screenEX + strokeDX, screenEY + strokeDY], color);
    this.mesh.addVertex([screenEX - strokeDX, screenEY - strokeDY], color);

    this.mesh.addTriangle([vertCount,     vertCount + 1, vertCount + 2]);
    this.mesh.addTriangle([vertCount + 1, vertCount + 3, vertCount + 2]);
  }

  drawToScreen() {
    // ensure canvas display remains 1:1
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    // prepare a material beforehand
    // draw to a premade frame buffer
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.shader.drawMaterial(this.gl, this.mesh);
    // run a postfx pass to add some effects, etc.
    // render to screen
  }

  clearCanvas() {
    this.mesh.clear();
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
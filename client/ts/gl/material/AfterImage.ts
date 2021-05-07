import { VectorMesh2D } from "../VectorMesh2D";
import { CompileShaders } from "./CompileShaders";

export class AfterImage {
  private prog: WebGLProgram;
  private loc: number;

  private unifTextureInit: WebGLUniformLocation;
  private unifTextureAftr: WebGLUniformLocation;
  private unifDelta      : WebGLUniformLocation;
  private unifDims       : WebGLUniformLocation;

  textureInit: WebGLTexture;
  textureAfter: WebGLTexture;

  private compilePromise: Promise<void>;
  private compiled: boolean;

  private time_last: number;

  constructor(gl: WebGLRenderingContext) {
    this.compiled = false;
    let base = window.location.protocol + "//" + window.location.host;
    let respVert = fetch(base + "/glsl/afterimage.vert");
    let respFrag = fetch(base + "/glsl/afterimage.frag");
    this.time_last = performance.now() / 1000;
    this.compilePromise = Promise.all([respVert, respFrag])
      .then(async (res) => {
        this.prog = CompileShaders(gl, await res[0].text(), await res[1].text());
        this.prepareAttributes(gl);
        this.compiled = true;
      }).catch(err => {
        console.error(err);
      });
  }

  prepareAttributes(gl: WebGLRenderingContext) : void {
    this.loc = gl.getAttribLocation(this.prog, "aPosition");

    this.unifTextureInit = gl.getUniformLocation(this.prog, "texInit");
    this.unifTextureAftr = gl.getUniformLocation(this.prog, "texAfter");
    this.unifDelta       = gl.getUniformLocation(this.prog, "delta");
    this.unifDims        = gl.getUniformLocation(this.prog, "dims");
  }

  async waitUntilCompiled() {
    await this.compilePromise;
  }

  isCompiled() : boolean {
    return this.compiled;
  }

  drawMaterial(gl: WebGLRenderingContext, mesh: VectorMesh2D) {
    gl.useProgram(this.prog);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textureInit);
    gl.uniform1i(this.unifTextureInit, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.textureAfter);
    gl.uniform1i(this.unifTextureAftr, 1);

    let time = performance.now() / 1000;
    let delta = time - this.time_last;
    this.time_last = time;

    gl.uniform1f(this.unifDelta, delta);

    gl.uniform2f(this.unifDims, gl.canvas.width, gl.canvas.height);

    mesh.draw(gl, this.loc);
  }
}
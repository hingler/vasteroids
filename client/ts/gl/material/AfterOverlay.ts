import { VectorMesh2D } from "../VectorMesh2D";
import { CompileShaders } from "./CompileShaders";

export class AfterOverlay {
  private prog: WebGLProgram;
  private loc: number;

  private unifTextureMain: WebGLUniformLocation;
  private unifTextureAftr: WebGLUniformLocation;
  private unifAfterOpac  : WebGLUniformLocation;

  textureMain : WebGLTexture;
  textureAfter: WebGLTexture;
  afterOpacity: number;

  private compilePromise: Promise<void>;
  private compiled: boolean;

  constructor(gl: WebGLRenderingContext) {
    this.compiled = false;
    let base = window.location.protocol + "//" + window.location.host;
    let respVert = fetch(base + "/glsl/afteroverlay.vert");
    let respFrag = fetch(base + "/glsl/afteroverlay.frag");
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

    this.unifTextureMain = gl.getUniformLocation(this.prog, "texMain");
    this.unifTextureAftr = gl.getUniformLocation(this.prog, "texAfter");
    this.unifAfterOpac   = gl.getUniformLocation(this.prog, "afterOpac");
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
    gl.bindTexture(gl.TEXTURE_2D, this.textureMain);
    gl.uniform1i(this.unifTextureMain, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.textureAfter);
    gl.uniform1i(this.unifTextureAftr, 1);

    gl.uniform1f(this.unifAfterOpac, this.afterOpacity);

    mesh.draw(gl, this.loc);
  }
}
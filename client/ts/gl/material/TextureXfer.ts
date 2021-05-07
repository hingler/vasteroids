import { VectorMesh2D } from "../VectorMesh2D";
import { CompileShaders } from "./CompileShaders";

export class TextureXfer {
  prog: WebGLProgram;
  loc: number;

  unifTexture: WebGLUniformLocation;
  textureIden: WebGLTexture;

  compilePromise: Promise<void>;
  compiled: boolean;

  constructor(gl: WebGLRenderingContext) {
    this.compiled = false;
    let base = window.location.protocol + "//" + window.location.host;
    let respVert = fetch(base + "/glsl/texturexfer.vert");
    let respFrag = fetch(base + "/glsl/texturexfer.frag");
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
    this.unifTexture = gl.getUniformLocation(this.prog, "tex");
  }

  setTexture(tex: WebGLTexture) {
    this.textureIden = tex;
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
    gl.bindTexture(gl.TEXTURE_2D, this.textureIden);
    // uniform1i receives active texture slot, not texture identifier
    gl.uniform1i(this.unifTexture, 0);
    // reuse mesh, but ignore color data.
    mesh.draw(gl, this.loc);
  }
}
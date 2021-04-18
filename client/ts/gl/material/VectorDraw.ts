import { CompileShaders } from "./CompileShaders";

export class VectorDraw {
  prog: WebGLProgram;

  compilePromise: Promise<void>;

  constructor(gl: WebGLRenderingContext) {
    let respFrag = fetch("./glsl/vectordraw.frag");
    let respVert = fetch("./glsl/vectordraw.vert");
    this.compilePromise = Promise.all([respVert, respFrag])
      .then(async (res) => {
        this.prog = CompileShaders(gl, await res[0].text(), await res[1].text());
        this.prepareAttributes(gl);
      })
  }

  prepareAttributes(gl: WebGLRenderingContext) : void {
    let loc = gl.getAttribLocation(this.prog, "aPosition");
  }

  async waitUntilCompiled() {
    await this.compilePromise;
  }

  useMaterial(gl: WebGLRenderingContext) {
    gl.useProgram(this.prog);
  }
}
export function CompileShaders(gl: WebGLRenderingContext, vertText: string, fragText: string) : WebGLProgram {
  let vertShader = compileShader(gl, vertText, gl.VERTEX_SHADER);
  let fragShader = compileShader(gl, vertText, gl.FRAGMENT_SHADER);

  let prog = gl.createProgram();
  gl.attachShader(prog, vertShader);
  gl.attachShader(prog, fragShader);
  gl.linkProgram(prog);
  if (gl.getProgramParameter(prog, gl.LINK_STATUS) !== gl.NO_ERROR) {
    let err = gl.getProgramInfoLog(prog);
    console.error(err);
    throw Error(err);
  }

  return prog;
}

function compileShader(gl: WebGLRenderingContext, shader: string, type: number) : WebGLShader {
  let glShader = gl.createShader(type);
  gl.shaderSource(glShader, shader);
  gl.compileShader(shader);
  if (gl.getShaderParameter(glShader, gl.COMPILE_STATUS) !== gl.NO_ERROR) {
    console.error(gl.getShaderInfoLog(glShader));
    throw Error(gl.getShaderInfoLog(glShader));
  }

  return glShader;
}
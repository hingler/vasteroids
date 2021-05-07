export class Framebuffer {
  private width: number;
  private height: number;

  private fb: WebGLFramebuffer;

  private color_texture: WebGLTexture;
  private depth_stencil: WebGLRenderbuffer;

  private gl: WebGLRenderingContext;

  constructor(gl: WebGLRenderingContext, width: number, height: number) {
    this.gl = gl;

    this.fb = gl.createFramebuffer();
    this.color_texture = gl.createTexture();
    this.depth_stencil = gl.createRenderbuffer();

    this.width = width;
    this.height = height;

    this.genFramebuffers_();
  }

  /**
   * Sets the dimensions of this framebuffer.
   * @param w - width
   * @param h - height
   */
  setFramebufferDimensions(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.genFramebuffers_();
  }

  getFramebufferDimensions() {
    return [this.width, this.height];
  }

  bindFramebuffer(target: number) {
    this.gl.bindFramebuffer(target, this.fb);
  }

  getColorTexture() {
    return this.color_texture;
  }

  private genFramebuffers_() {
    let w = this.width, h = this.height;
    let gl = this.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
    gl.bindTexture(gl.TEXTURE_2D, this.color_texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.color_texture, 0);

    gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth_stencil);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, w, h);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, this.depth_stencil);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
      console.error("Incomplete framebuffer!");
    }
  }
}
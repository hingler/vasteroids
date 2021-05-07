#version 100

#define SMOOTH_RED   0.0025
#define SMOOTH_GREEN 0.01
#define SMOOTH_BLUE  0.0015

#define RED_FADE 1.06
#define GREEN_FADE 1.04
#define BLUE_FADE 1.2

precision highp float;

varying vec2 vCoord;

uniform vec2 dims;

uniform sampler2D texInit;
uniform sampler2D texAfter;

// time since last frame rendered (we can use performance.now() / 1000 for this in the mat itself)
uniform float delta;

// simple 3x3 convolution blur
vec4 blur(sampler2D tex) {
  vec2 px_step = vec2(1. / dims.x, 1. / dims.y);
  vec4 result = vec4(0);

  vec2 vCoord_mod = vCoord;
  vCoord_mod -= px_step;

  result += texture2D(tex, vCoord_mod) * .0625;

  vCoord_mod.x += px_step.x;
  result += texture2D(tex, vCoord_mod) * .125;

  vCoord_mod.x += px_step.x;
  result += texture2D(tex, vCoord_mod) * .0625;

  vCoord_mod.y += px_step.y;
  vCoord_mod.x -= 2. * px_step.x;

  result += texture2D(tex, vCoord_mod) * .125;

  vCoord_mod.x += px_step.x;
  result += texture2D(tex, vCoord_mod) * .25;

  vCoord_mod.x += px_step.x;
  result += texture2D(tex, vCoord_mod) * .125;

  vCoord_mod.y += px_step.y;
  vCoord_mod.x -= 2. * px_step.x;

  result += texture2D(tex, vCoord_mod) * .0625;

  vCoord_mod.x += px_step.x;
  result += texture2D(tex, vCoord_mod) * .125;

  vCoord_mod.x += px_step.x;
  result += texture2D(tex, vCoord_mod) * .0625;

  return result;
}

void main() {
  vec4 init = texture2D(texInit, vCoord);
  vec4 after = blur(texAfter);
  after.r *= pow(SMOOTH_RED, delta);
  after.g *= pow(SMOOTH_GREEN, delta);
  after.b *= pow(SMOOTH_BLUE, delta);
  // after.r -= RED_FADE * delta;
  // after.g -= GREEN_FADE * delta;
  // after.b -= BLUE_FADE * delta;
  // after.r = max(after.r, 0);
  // after.g = max(after.g, 0);
  // after.b = max(after.b, 0);
  gl_FragColor = after + init;
}

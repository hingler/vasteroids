#version 100

precision highp float;

varying vec2 vCoord;

uniform sampler2D texMain;
uniform sampler2D texAfter;
uniform float afterOpac;

void main() {
  vec4 lookup = vec4(texture2D(texAfter, vCoord));
  lookup.x = pow(lookup.x, 1.2);
  lookup.y = pow(lookup.y, 1.2);
  lookup.z = pow(lookup.z, 1.2);
  lookup.w = pow(lookup.w, 1.2);
  gl_FragColor = texture2D(texMain, vCoord) + lookup * afterOpac;
}
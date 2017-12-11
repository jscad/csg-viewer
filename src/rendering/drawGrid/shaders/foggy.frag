precision mediump float;
uniform vec4 color;
varying vec3 fragNormal, fragPosition;
varying vec4 worldPosition;

#define FOG_DENSITY 0.03
#pragma glslify: fog_exp = require(glsl-fog/exp)

uniform vec4 fogColor;


void main() {
  float fogDistance = gl_FragCoord.z / gl_FragCoord.w;
  float fogAmount = fog_exp(fogDistance * 0.1, FOG_DENSITY);

  float dist = distance( vec2(0.,0.), vec2(worldPosition.x,worldPosition.y));
  dist *= 0.0016;
  dist = clamp(dist, 0.0, 1.0);
  //0 ===> 200
  //
  //vec4 col = vec4(fogColor.r, color.g, color.b, 0.);
  //gl_FragColor = col;//mix(color, fogColor, fogAmount);
  gl_FragColor = mix(color, fogColor, dist);
}

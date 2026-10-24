import { PULSES, PULSE_TAIL } from "./config";

// GLSL for the photo cards (pillow-curved quads) and the spiral arm lines.
export const CARD_VS = `#version 300 es
in vec2 aPos;          // card-local, -0.5..0.5, y down
uniform vec2 uHalf;    // half viewport, css px
uniform float uFocal;
uniform vec2 uCenter;  // card centre, px from screen centre, y down
uniform vec2 uSize;
uniform float uBow;
uniform vec3 uPress;   // xy pointer px, z lift px
out vec2 vUv;
void main() {
  vUv = aPos + 0.5;
  vec2 p = uCenter + aPos * uSize;
  // Pillow: middle forward, corners back.
  float z = uBow * (0.5 - 2.0 * dot(aPos, aPos));
  vec2 m = (p - uPress.xy) / (max(uSize.x, uSize.y) * 0.7);
  z += uPress.z * exp(-dot(m, m));
  gl_Position = vec4(p.x / uHalf.x, -p.y / uHalf.y, 0.0, (uFocal - z) / uFocal);
}`;

export const CARD_FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec4 uCrop;    // xy offset, zw extent of the cover-fit window
uniform vec2 uSize;
uniform float uRadius;
uniform float uSoft;
uniform float uSplit;
uniform float uFade;
uniform float uLoaded;
uniform float uRim;
uniform vec3 uBase;
uniform vec3 uRimColor;
in vec2 vUv;
out vec4 outColor;

vec3 tap(vec2 uv, float lod) {
  return texture(uTex, clamp(uv, uCrop.xy, uCrop.xy + uCrop.zw), lod).rgb;
}

void main() {
  vec2 uv = uCrop.xy + vUv * uCrop.zw;
  vec3 c;
  if (uSoft > 0.0005) {
    // Defocus: a golden-angle disc of taps on a blurrier mip.
    float lod = log2(1.0 + uSoft * 60.0);
    c = vec3(0.0);
    for (int i = 0; i < 10; i++) {
      float f = (float(i) + 0.5) / 10.0;
      float a = float(i) * 2.39996;
      c += tap(uv + vec2(cos(a), sin(a)) * sqrt(f) * uSoft * uCrop.zw, lod);
    }
    c /= 10.0;
  } else {
    // Lens fringe: red and blue drift apart toward the rim.
    vec2 d = vUv - 0.5;
    vec2 off = d * dot(d, d) * uSplit * uCrop.zw;
    c = vec3(tap(uv + off, 0.0).r, tap(uv, 0.0).g, tap(uv - off, 0.0).b);
  }
  c = mix(uBase, c, uLoaded);

  // Rounded corners and a hairline rim that follows them.
  vec2 q = abs((vUv - 0.5) * uSize) - (uSize * 0.5 - uRadius);
  float e = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
  float rim = 1.0 - smoothstep(0.0, 1.2, abs(e + 1.0));
  c = mix(c, uRimColor, rim * uRim);
  float a = uFade * clamp(0.5 - e, 0.0, 1.0);
  outColor = vec4(c * a, a);
}`;

export const LINE_VS = `#version 300 es
in vec2 aPos;
in vec2 aDir;          // unit offset direction for the ribbon width
in float aSide;        // -1 / +1
in float aAlong;       // 0..1 along an arm, < 0 for plain strokes
uniform vec2 uHalf;
uniform float uAngle;
uniform float uWidth;
uniform float uSwell;
uniform float uClock;  // pulse clock, already scaled by speed
uniform float uLag;
uniform float uReveal;
uniform float uWave;
out float vHot;
out float vSide;
out float vShow;
void main() {
  mat2 r = mat2(cos(uAngle), sin(uAngle), -sin(uAngle), cos(uAngle));
  vec2 p = r * aPos;
  float hot = 0.0;
  if (aAlong >= 0.0) {
    // Comets run outward; 'behind' is 0 at a head and grows down its tail.
    float behind = fract(uClock - aAlong * ${PULSES.toFixed(1)} + uLag);
    hot = exp(-behind / ${PULSE_TAIL}) * smoothstep(0.0, 0.006, behind);
    hot *= smoothstep(0.03, 0.12, aAlong);
  }
  float show = clamp((uReveal - length(aPos)) / uWave, 0.0, 1.0);
  vHot = hot * show;
  vShow = show;
  vSide = aSide;
  p += r * aDir * aSide * (uWidth + uSwell * hot) * 0.5;
  gl_Position = vec4(p.x / uHalf.x, -p.y / uHalf.y, 0.0, 1.0);
}`;

export const LINE_FS = `#version 300 es
precision highp float;
uniform vec3 uInk;
uniform vec3 uHotColor;
uniform float uAlpha;
uniform float uHotAlpha;
in float vHot;
in float vSide;
in float vShow;
out vec4 outColor;
void main() {
  float soft = 1.0 - smoothstep(0.35, 1.0, abs(vSide));
  float h = clamp(vHot, 0.0, 1.0);
  vec3 c = mix(uInk, uHotColor, h);
  float a = (uAlpha * vShow + uHotAlpha * h) * soft;
  outColor = vec4(c * a, a);
}`;

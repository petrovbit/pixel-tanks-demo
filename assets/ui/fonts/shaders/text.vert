attribute vec4 a_position;
attribute vec4 a_color;
attribute vec2 a_texCoord0;
uniform mat4 u_projTrans;
#ifdef TEXT_MESH
attribute vec4 a_glyphUV;
attribute vec4 a_bounds;
uniform vec2 u_offset;
uniform vec4 u_passColor;
#else
uniform vec4 u_glyphUV;
uniform vec4 u_bounds;
#endif
varying vec4 v_glyphUV;
varying vec4 v_bounds;
varying vec4 v_color;
#ifdef GL_ES
#ifdef GL_FRAGMENT_PRECISION_HIGH
varying highp vec2 v_texCoords;
#else
varying mediump vec2 v_texCoords;
#endif
#else
varying vec2 v_texCoords;
#endif
varying vec2 v_position;
void main() {
    v_color = a_color;
    v_color.a *= 255.0/254.0;
    v_texCoords = a_texCoord0;
    v_position = a_position.xy;
#ifdef TEXT_MESH
    v_color *= u_passColor;
    v_glyphUV = a_glyphUV;
    v_bounds = a_bounds;
    gl_Position = u_projTrans * (a_position + vec4(u_offset,0.0,0.0));
#else
    v_glyphUV = u_glyphUV;
    v_bounds = u_bounds;
    gl_Position = u_projTrans * a_position;
#endif
}

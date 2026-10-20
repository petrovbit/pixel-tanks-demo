#ifdef GL_ES
precision highp float;
#endif
varying vec4 v_color;
varying vec2 v_texCoords;
varying vec2 v_world;
uniform sampler2D u_texture;
uniform vec3 u_barrelPlane;
uniform vec2 u_barrelStrip;
void main() {
    // Walls themselves cover overlapping pixels in painter order. Mask only the
    // detached continuation of a barrel that entered a foreground wall from outside.
    float along = dot(v_world, u_barrelPlane.xy);
    float across = dot(v_world, vec2(-u_barrelPlane.y, u_barrelPlane.x));
    if (along > u_barrelPlane.z && abs(across-u_barrelStrip.x) < u_barrelStrip.y) discard;
    gl_FragColor = texture2D(u_texture, v_texCoords) * v_color;
}

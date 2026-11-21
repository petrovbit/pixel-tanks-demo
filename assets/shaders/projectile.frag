#ifdef GL_ES
precision mediump float;
#endif

varying vec4 v_color;
varying vec2 v_texCoords;
uniform sampler2D u_texture;

// Red selects ribbon (1) or the small luminous head (0). Alpha carries the
// freshness at each end of the quad, avoiding per-projectile uniforms/flushes.
void main() {
    vec3 orange = vec3(1.0, 0.490, 0.094);
    vec3 gold = vec3(1.0, 0.655, 0.145);
    vec3 pale = vec3(1.0, 0.933, 0.627);
    vec3 color;
    float alpha;
    if (v_color.r > 0.5) {
        float fresh = clamp(v_color.a, 0.0, 1.0);
        float taper = mix(0.24, 1.0, fresh);
        float y = abs(v_texCoords.y * 2.0 - 1.0) / taper;
        float glow = exp(-y * y * 6.0) * 0.37;
        float flame = exp(-y * y * 28.0) * 0.72;
        float core = 1.0 - smoothstep(0.065, 0.115, y);
        color = mix(mix(orange, gold, flame), pale, core);
        alpha = min(1.0, glow + flame + core) * pow(fresh, 1.8);
        alpha *= 1.0 - smoothstep(0.82, 1.0, abs(v_texCoords.y * 2.0 - 1.0));
    } else {
        vec2 p = (v_texCoords - 0.5) * 14.0;
        float glow = max(0.0, exp(-dot(p, p) / 12.0) - 0.015) * 0.55;
        float core = 1.0 - smoothstep(0.8, 1.05, length(p / vec2(3.1, 1.7)));
        color = mix(orange, vec3(1.0, 0.980, 0.859), core);
        alpha = min(1.0, glow + core) * v_color.a;
    }
    gl_FragColor = vec4(color, alpha * texture2D(u_texture, v_texCoords).a);
}

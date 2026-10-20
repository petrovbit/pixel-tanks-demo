#ifdef GL_ES
precision mediump float;
#endif
varying vec4 v_color;
varying vec2 v_uv;
varying vec2 v_world;
uniform sampler2D u_texture;
uniform float u_phase;
uniform vec4 u_waterfall;

void main() {
    vec4 base = texture2D(u_texture, v_uv);
    // The approved frontier painting reserves blue/cyan for water. Land, lilies,
    // bridges and rocks retain their exact original pixels; no UVs cross a chunk edge.
    float water = smoothstep(0.06, 0.19, min(base.b, base.g) - base.r)
                * smoothstep(-0.025, 0.06, base.b - base.g);
    vec2 p = v_world * 0.065;
    float ripple = sin(p.y * 2.2 + sin(p.x * 0.85 + u_phase) * 1.3 - u_phase * 3.0);
    float crossing = sin(p.x * 1.4 - p.y * 0.65 + u_phase * 2.0);
    float glint = pow(max(0.0, ripple * crossing), 9.0);
    vec3 shift = vec3(0.045, 0.095, 0.11) * glint
               + vec3(0.012, 0.023, 0.028) * ripple;
    // A local foam shimmer moves down the painted waterfall; banks remain static.
    vec2 f = (v_world - u_waterfall.xy) / max(u_waterfall.zw, vec2(1.0));
    float fall = step(0.0, f.x) * step(f.x, 1.0) * step(0.0, f.y) * step(f.y, 1.0)
               * step(1.0, u_waterfall.z);
    float edge = smoothstep(0.0, 0.15, f.x) * (1.0 - smoothstep(0.85, 1.0, f.x));
    float foam = smoothstep(0.4, 0.85, min(base.r, min(base.g, base.b)));
    float flow = sin(f.y * 36.0 + u_phase * 24.0 + sin(f.x * 22.0) * 2.0);
    vec3 cascade = vec3(0.04, 0.06, 0.075) * flow * fall * edge * max(water, foam);
    gl_FragColor = vec4(base.rgb + shift * water + cascade, base.a) * v_color;
}

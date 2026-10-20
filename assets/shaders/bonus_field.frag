#ifdef GL_ES
precision highp float;
#endif
varying vec4 v_color;
varying vec2 v_texCoords;
uniform sampler2D u_texture;
uniform float u_time;
uniform float u_hit;
uniform float u_fade;

// A painted-looking energy shell: a clear rim, sparse hexagonal facets and moving arcs.
void main() {
    vec2 p = (v_texCoords - .5) * 2.0;
    float r = length(p);
    float inside = 1.0 - smoothstep(.90, .98, r);
    float rim = exp(-abs(r - .86) * 65.0);
    float halo = exp(-abs(r - .86) * 25.0);
    float angle = atan(p.y, p.x);
    float arcs = pow(.5 + .5 * cos(angle * 3.0 + u_time * 2.0), 6.0);
    float innerArcs = exp(-abs(r - .79) * 110.0) * smoothstep(.45, .8, cos(angle * 3.0 - u_time * 1.6));
    vec2 grid = p * vec2(6.0, 5.2);
    grid.x += mod(floor(grid.y), 2.0) * .5;
    vec2 q = abs(fract(grid) - .5);
    float hex = max(q.x * .8660254 + q.y * .5, q.y);
    float mesh = (1.0 - smoothstep(.018, .045, abs(hex - .43))) * inside;
    float facets = mesh * smoothstep(.25, .8, r) * (.10 + .035 * sin(u_time * 1.7));
    float fill = inside * (.035 + .045 * r * r);
    float alpha = (fill + facets + halo * .20 + rim * (.58 + arcs * .36) + innerArcs * .55 + u_hit * halo * .55) * u_fade;
    vec3 color = mix(vec3(.16, .66, .86), vec3(.72, .97, 1.0), clamp(rim + u_hit * .65, 0.0, 1.0));
    gl_FragColor = vec4(color, clamp(alpha, 0.0, .88)) * v_color * texture2D(u_texture, v_texCoords);
}

#ifdef GL_ES
precision mediump float;
#endif
varying vec4 v_color;
varying vec2 v_uv;
varying vec2 v_world;
uniform sampler2D u_texture;
uniform float u_phase;
uniform int u_kind;
uniform vec4 u_bounds;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
               mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
}
void main() {
    vec2 uv = (v_world-u_bounds.xy)/u_bounds.zw;
    vec2 p = uv*2.0-1.0;
    vec2 drift = vec2(cos(u_phase),sin(u_phase));
    float edge = length(p) + (noise(uv*7.0)-0.5)*0.16;
    float alpha = 1.0-smoothstep(0.78,1.0,edge);
    float n = noise(uv*9.0+drift*1.3);
    vec3 color;
    if (u_kind == 0) {
        float wave = sin(uv.y*75.0+sin(uv.x*23.0+u_phase)*2.0-u_phase*3.0);
        color = mix(vec3(.08,.27,.38),vec3(.13,.46,.58),n);
        color += vec3(.08,.14,.16)*pow(max(0.0,wave),12.0)*n;
        alpha *= .86;
    } else if (u_kind == 1) {
        float bands = sin(n*18.0 + uv.y*12.0 + u_phase);
        vec3 sheen = .5+.5*cos(vec3(0.,2.,4.)+bands*2.0+u_phase);
        color = vec3(.035,.038,.04)+sheen*.11*smoothstep(.28,.85,n);
        color += .05*pow(max(0.0,bands),14.0);
        alpha *= .95;
    } else if (u_kind == 2) {
        float crust = noise(uv*13.0+drift*.45);
        float cracks = 1.0-smoothstep(.025,.11,abs(crust-.5));
        float pulse = .8+.2*sin(u_phase*3.0+uv.x*9.0-uv.y*7.0);
        color = mix(vec3(.095,.045,.03),vec3(1.,.3,.015)*pulse,cracks);
        color += vec3(.28,.065,.005)*n;
    } else if (u_kind == 3) {
        // Layered flame tongues, rising waves; all phase multipliers are integers,
        // so the 16-second loop closes exactly without resetting random noise.
        float y = uv.y;
        float sway = sin(y*8.0-u_phase*9.0)*.09*y;
        float tongues = sin(uv.x*26.0+y*11.0-u_phase*12.0)*.08
                      + sin(uv.x*43.0-y*17.0+u_phase*7.0)*.035;
        float body = (1.0-y)*.78-abs(p.x+sway)+tongues;
        alpha = smoothstep(-.1,.12,body)*(1.0-smoothstep(.77,1.0,y))
              * smoothstep(0.,.08,y);
        float heat = clamp(body*2.0+(1.0-y)*.5,0.,1.);
        color = mix(vec3(.65,.07,.008),vec3(1.,.42,.025),heat);
        color = mix(color,vec3(1.,.88,.35),smoothstep(.65,1.,heat));
    } else {
        // Rising overlapping puffs; integer cycles keep the 16-second loop seamless.
        alpha = 0.0;
        for (int i = 0; i < 5; i++) {
            float seed = float(i);
            float age = fract(u_phase / 6.2831853 * 4.0 + seed / 5.0);
            vec2 center = vec2(.40 + age*.22 + sin(u_phase*2.0+seed)*.04,
                               .10 + age*.78);
            float radius = .09 + age*.22;
            float puff = 1.0-smoothstep(radius*.45,radius,
                length(uv-center)+(n-.5)*.045);
            alpha += puff * sin(age*3.14159265)*.25;
        }
        alpha *= smoothstep(0.,.08,uv.y)*(1.0-smoothstep(.82,1.0,uv.y));
        color = mix(vec3(.13,.14,.15),vec3(.34,.35,.36),uv.y);
    }
    gl_FragColor = vec4(color,alpha) * v_color * texture2D(u_texture,v_uv);
}

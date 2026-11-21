#ifdef GL_ES
precision mediump float;
#endif
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
uniform sampler2D u_texture;
uniform sampler2D u_tile;
// Zero is the exact legacy tint pass. Extended fill is opt-in.
uniform float u_effect;
varying vec4 v_bounds;
varying vec4 v_glyphUV;
uniform vec4 u_stop0;
uniform vec4 u_stop1;
uniform vec4 u_stop2;
uniform float u_mid;
uniform vec2 u_direction;
uniform float u_gradient;
uniform float u_tileMode;
uniform float u_tileOpacity;
uniform vec4 u_tileTransform;
uniform vec2 u_bevelUV;
uniform float u_bevel;
uniform vec4 u_light;
uniform vec4 u_dark;
float mask(vec2 uv) {
    vec2 lo = step(v_glyphUV.xy, uv), hi = step(uv, v_glyphUV.zw);
    return texture2D(u_texture, uv).a * lo.x*lo.y*hi.x*hi.y;
}
void main() {
    if (u_effect < -0.5) {
        gl_FragColor = v_color * texture2D(u_texture, v_texCoords);
        return;
    }
    float a = texture2D(u_texture, v_texCoords).a;
    vec4 c = v_color;
    if (u_effect > 0.5) {
        vec2 p = (v_position-v_bounds.xy)/max(v_bounds.zw,vec2(0.001));
        float t = clamp(0.5+dot(p-0.5,u_direction)/max(abs(u_direction.x)+abs(u_direction.y),0.001),0.0,1.0);
        vec4 ramp = t < u_mid ? mix(u_stop0,u_stop1,t/max(u_mid,0.001)) : mix(u_stop1,u_stop2,(t-u_mid)/max(1.0-u_mid,0.001));
        c = mix(u_stop0,ramp,u_gradient)*v_color;
        if (u_tileOpacity > 0.0) {
            vec4 tile = texture2D(u_tile,fract((v_position+u_tileTransform.zw)/max(u_tileTransform.xy,vec2(0.001))));
            vec3 blend = tile.rgb;
            if (u_tileMode > 0.5 && u_tileMode < 1.5) blend = c.rgb*tile.rgb;
            if (u_tileMode > 1.5 && u_tileMode < 2.5) blend = mix(2.0*c.rgb*tile.rgb,1.0-2.0*(1.0-c.rgb)*(1.0-tile.rgb),step(vec3(0.5),c.rgb));
            if (u_tileMode > 2.5) blend = 1.0-(1.0-c.rgb)*(1.0-tile.rgb);
            c.rgb = mix(c.rgb,blend,u_tileOpacity*tile.a);
        }
        if (u_bevel > 0.0) {
            float lit = max(0.0,a-mask(v_texCoords+u_bevelUV));
            float dark = max(0.0,a-mask(v_texCoords-u_bevelUV));
            c = mix(c,u_light,lit*u_light.a);
            c = mix(c,u_dark,dark*u_dark.a);
        }
    }
    gl_FragColor = vec4(c.rgb,c.a*a);
}

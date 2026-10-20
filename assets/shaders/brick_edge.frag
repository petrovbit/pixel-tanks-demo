// Фрагментный шейдер «завершённого торца кирпича» для прохода стен.
// Эффект (тот же, что процедурный algo_*): вдоль ОТКРЫТЫХ граней клетки
// (нет соседа-стены) тайл гаснет по альфе по неровной кромке + подсветка-«губа»
// на силуэте и мягкое AO-затемнение внутрь. Низ клетки не трогаем (его закрывает
// тёмная грань). Углы корректны автоматически: берём min-расстояние до открытых граней.
//
// v_color — флаги: r=верх открыт, g=лево открыто, b=право открыто (0/1).
// Локальные координаты клетки берём из v_texCoords (тайл = 1/4 атласа 256×256),
// что точнее по precision, чем мировые. Мировые нужны лишь для непрерывного шума.
#ifdef GL_ES
precision highp float;
#endif

varying vec4 v_color;
varying vec2 v_texCoords;
varying vec2 v_world;

uniform sampler2D u_texture;
uniform float u_ppt;        // мировых пикселей на тайл (для перевода доли клетки в пиксели)
uniform float u_margin;     // глубина кромки, доля тайла
uniform float u_amp;        // амплитуда волны кромки, доля тайла
uniform float u_freq;       // частота волны, циклов на тайл
uniform float u_litWidth;   // ширина светлой губы, доля тайла
uniform float u_litGain;    // сила подсветки губы
uniform float u_aoScale;    // ширина AO-затемнения, доля тайла
uniform float u_aoGain;     // сила AO-затемнения

float hash(float n) { return fract(sin(n) * 43758.5453123); }

// сглаженный 1D value-noise
float vnoise(float x) {
    float i = floor(x);
    float f = fract(x);
    float u = f * f * (3.0 - 2.0 * f);
    return mix(hash(i), hash(i + 1.0), u);
}

// расстояние «внутрь» от неровной кромки данной грани: >0 внутри, <0 снаружи
float inside(float d, float t) {
    float b = u_margin + u_amp * (vnoise(t * u_freq) - 0.5) * 2.0;
    return d - b;
}

void main() {
    vec4 tex = texture2D(u_texture, v_texCoords);

    // локальные координаты внутри клетки 0..1 (тайл = 1/4 атласа)
    vec2 lc = fract(v_texCoords * 4.0);
    float dTop   = lc.y;          // texCoords.y мал у верха клетки
    float dLeft  = lc.x;
    float dRight = 1.0 - lc.x;

    // тангенциальная мировая координата для непрерывного шума вдоль грани
    float tx = v_world.x / u_ppt;
    float ty = v_world.y / u_ppt;

    float s = 1000.0; // расстояние до ближайшей ОТКРЫТОЙ грани (доля тайла)
    if (v_color.r > 0.5) s = min(s, inside(dTop,   tx));
    if (v_color.g > 0.5) s = min(s, inside(dLeft,  ty));
    if (v_color.b > 0.5) s = min(s, inside(dRight, ty));

    // альфа: мягкий ~1px срез по кромке
    float alpha = clamp(s * u_ppt + 0.5, 0.0, 1.0);

    // затенение: светлая губа у силуэта + мягкое AO внутрь
    float si  = max(s, 0.0);
    float lit = u_litGain * max(0.0, 1.0 - si / u_litWidth);
    float ao  = -u_aoGain * exp(-si / u_aoScale);
    float shade = 1.0 + lit + ao;

    gl_FragColor = vec4(tex.rgb * shade, tex.a * alpha);
}

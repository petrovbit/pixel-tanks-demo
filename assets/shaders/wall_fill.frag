// Each wall row is one depth-sorted object: front face and raised top stay together.
//  Поле сэмплится по мировой позиции; паддинг снизу на darkH даёт «приподнятую» модель без сдвига.
#ifdef GL_ES
precision highp float;
#endif

varying vec2 v_world;

uniform sampler2D u_texture;    // brick_light (юнит 0, ставит SpriteBatch)
uniform sampler2D u_din;        // поле RGBA (юнит 1): R=darkness, A=din
uniform sampler2D u_dark;       // brick_dark 256×48 (юнит 2)
uniform sampler2D u_lightD1;    // тот же лист 4x4, кирпич потрескался (33 %)
uniform sampler2D u_lightD2;    // он же, сильное дробление (66 %)
uniform vec2  u_worldSize;      // (Wt*ppt, Ht*ppt + darkH) — учитывает нижний паддинг поля
uniform float u_ppt;            // мировых пикселей на тайл
uniform float u_feather;        // ширина альфа-перехода (доля тайла)
uniform float u_litW;
uniform float u_litG;
uniform float u_aoS;
uniform float u_aoG;
uniform float u_yShift;         // = ppt*DARK_FRAC = darkH (подъём света и v-маппинг тёмного)
uniform float u_row;            // source row, before the raised-top offset

void main() {
    // поле сэмплим по мировой позиции (паддинг снизу = приподнятая модель, без явного сдвига)
    vec2 uv = v_world / u_worldSize;
    vec4 fld = texture2D(u_din, uv);
    float din      = fld.a;
    float darkness = fld.r;
    if (din <= 0.0) discard;

    float outerA = clamp(din / u_feather, 0.0, 1.0);
    float lit = u_litG * max(0.0, 1.0 - din / u_litW);
    float ao  = -u_aoG * exp(-din / u_aoS);
    float shade = 1.0 + lit + ao;

    // светлый кирпич по ПРИПОДНЯТОЙ мировой позиции (фаза x mod 4, y mod 4 в листе 4×4)
    vec2 lp    = vec2(v_world.x, v_world.y - u_yShift);
    vec2 ltile = lp / u_ppt;
    vec2 lcell = floor(ltile);
    vec2 lfrac = ltile - lcell;
    vec2 lphase = mod(lcell, 4.0);
    vec2 luv   = (lphase + lfrac) * 0.25;
    vec3 lightCol = texture2D(u_texture, luv).rgb * shade;

    // тёмный кирпич по НЕсдвинутой позиции; v внутри грани 0(верх)..1(низ), 4 столбца по x mod 4
    float darkH = u_yShift;
    float rc    = floor(v_world.y / u_ppt);
    float dv    = clamp(((rc * u_ppt + darkH) - v_world.y) / darkH, 0.0, 1.0);
    float dcol  = mod(floor(v_world.x / u_ppt), 4.0);
    float du    = fract(v_world.x / u_ppt);
    vec2 duv = vec2((dcol + du) * 0.25, dv);
    vec3 darkCol = texture2D(u_dark, duv).rgb;

    bool darkPixel = darkness >= 0.5;
    float ownerRow = floor((v_world.y - (darkPixel ? 0.0 : u_yShift)) / u_ppt);
    if (abs(ownerRow - u_row) > 0.25) discard;
    vec3 col = darkPixel ? darkCol : lightCol;

    // Read the STATE at the source cell centre, never interpolate two neighbours'
    // states through the linearly filtered silhouette texture. Front and roof use
    // the same owner even when they occupy different world-space cells.
    vec2 stateUv = vec2((floor(v_world.x/u_ppt)+0.5)*u_ppt,
                        (ownerRow+0.5)*u_ppt+u_yShift) / u_worldSize;
    float damageState = floor(texture2D(u_din, stateUv).g * 2.0 + 0.5);
    // Урон — это ДРУГОЙ ЛИСТ КЛАДКИ, а не оверлей поверх целого: маска трещин на тайл
    // в 32 px неизбежно шла в алиасинг, а пороги по ней давали пятна вместо изломов.
    // Границы ячеек у всех трёх листов совпадают, поэтому стык остаётся чистым при
    // любом состоянии соседа. Фронтальная грань пока без повреждённого арта.
    if (damageState > 0.5 && !darkPixel) {
        vec3 dmg = damageState > 1.5 ? texture2D(u_lightD2, luv).rgb
                                     : texture2D(u_lightD1, luv).rgb;
        col = dmg * shade;
    }

    gl_FragColor = vec4(col, outerA);
}

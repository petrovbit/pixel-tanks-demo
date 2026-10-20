// Вершинный шейдер прохода стен: как стандартный SpriteBatch, плюс мировые
// координаты вершины (v_world) для шумовой кромки во фрагментном шейдере.
// v_color НЕ красит тайл — это флаги открытых граней клетки (r=верх, g=лево, b=право).
attribute vec4 a_position;
attribute vec4 a_color;
attribute vec2 a_texCoord0;
uniform mat4 u_projTrans;
varying vec4 v_color;
varying vec2 v_texCoords;
varying vec2 v_world;

void main() {
    v_color     = a_color;          // флаги граней, без 255/254-хака
    v_texCoords = a_texCoord0;
    v_world     = a_position.xy;     // мировые координаты (для шума кромки)
    gl_Position = u_projTrans * a_position;
}

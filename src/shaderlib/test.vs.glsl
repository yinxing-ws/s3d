attribute vec4 POSITION;
attribute vec4 COLOR_0;

uniform mat4 u_MVPMat;

varying vec4 v_color;

void main() {
    // 将位置和矩阵相乘
    gl_Position = u_MVPMat * POSITION;

    v_color = COLOR_0;
}
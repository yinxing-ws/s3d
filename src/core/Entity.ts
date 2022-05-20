import { Engine } from './Engine';
import { M4 } from './M4';

const vertexShaderSource = `
  attribute vec4 a_position;
  attribute vec4 a_color;
  
  uniform mat4 u_matrix;

  varying vec4 v_color;
  
  void main() {
    // 将位置和矩阵相乘
    gl_Position = u_matrix * a_position;

    v_color = a_color;
  }
`;

const fragmentShaderSource = `
  // 片断着色器没有默认精度，所以我们需要设置一个精度
  // mediump是一个不错的默认值，代表“medium precision”（中等精度）
  precision mediump float;

  varying vec4 v_color;

  void main() {
    // gl_FragColor是一个片断着色器主要设置的变量
    gl_FragColor = v_color;
  }
`;

const vertexData = [
  0, 0, 0, 30, 0, 0, 0, 150, 0, 0, 150, 0, 30, 0, 0, 30, 150, 0, 30, 0, 0, 100,
  0, 0, 30, 30, 0, 30, 30, 0, 100, 0, 0, 100, 30, 0, 30, 60, 0, 67, 60, 0, 30,
  90, 0, 30, 90, 0, 67, 60, 0, 67, 90, 0, 0, 0, 30, 30, 0, 30, 0, 150, 30, 0,
  150, 30, 30, 0, 30, 30, 150, 30, 30, 0, 30, 100, 0, 30, 30, 30, 30, 30, 30,
  30, 100, 0, 30, 100, 30, 30, 30, 60, 30, 67, 60, 30, 30, 90, 30, 30, 90, 30,
  67, 60, 30, 67, 90, 30, 0, 0, 0, 100, 0, 0, 100, 0, 30, 0, 0, 0, 100, 0, 30,
  0, 0, 30, 100, 0, 0, 100, 30, 0, 100, 30, 30, 100, 0, 0, 100, 30, 30, 100, 0,
  30, 30, 30, 0, 30, 30, 30, 100, 30, 30, 30, 30, 0, 100, 30, 30, 100, 30, 0,
  30, 30, 0, 30, 30, 30, 30, 60, 30, 30, 30, 0, 30, 60, 30, 30, 60, 0, 30, 60,
  0, 30, 60, 30, 67, 60, 30, 30, 60, 0, 67, 60, 30, 67, 60, 0, 67, 60, 0, 67,
  60, 30, 67, 90, 30, 67, 60, 0, 67, 90, 30, 67, 90, 0, 30, 90, 0, 30, 90, 30,
  67, 90, 30, 30, 90, 0, 67, 90, 30, 67, 90, 0, 30, 90, 0, 30, 90, 30, 30, 150,
  30, 30, 90, 0, 30, 150, 30, 30, 150, 0, 0, 150, 0, 0, 150, 30, 30, 150, 30, 0,
  150, 0, 30, 150, 30, 30, 150, 0, 0, 0, 0, 0, 0, 30, 0, 150, 30, 0, 0, 0, 0,
  150, 30, 0, 150, 0,
];

const colorData = [
  200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70,
  120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120,
  200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70,
  120, 200, 70, 120, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70,
  200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70,
  200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70,
  200, 80, 70, 200, 70, 200, 210, 70, 200, 210, 70, 200, 210, 70, 200, 210, 70,
  200, 210, 70, 200, 210, 200, 200, 70, 200, 200, 70, 200, 200, 70, 200, 200,
  70, 200, 200, 70, 200, 200, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210,
  100, 70, 210, 100, 70, 210, 100, 70, 210, 160, 70, 210, 160, 70, 210, 160, 70,
  210, 160, 70, 210, 160, 70, 210, 160, 70, 70, 180, 210, 70, 180, 210, 70, 180,
  210, 70, 180, 210, 70, 180, 210, 70, 180, 210, 100, 70, 210, 100, 70, 210,
  100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 76, 210, 100, 76, 210,
  100, 76, 210, 100, 76, 210, 100, 76, 210, 100, 76, 210, 100, 140, 210, 80,
  140, 210, 80, 140, 210, 80, 140, 210, 80, 140, 210, 80, 140, 210, 80, 90, 130,
  110, 90, 130, 110, 90, 130, 110, 90, 130, 110, 90, 130, 110, 90, 130, 110,
  160, 160, 220, 160, 160, 220, 160, 160, 220, 160, 160, 220, 160, 160, 220,
  160, 160, 220,
];

const createProgram = (
  gl: WebGL2RenderingContext,
  vShader: string,
  fShader: string
): WebGLProgram => {
  let vertexShader = createShader(gl, gl.VERTEX_SHADER, vShader);
  let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fShader);

  let program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return program;
  }

  gl.deleteProgram(program);
  return null;
};

// 创建着色器方法，输入参数：渲染上下文，着色器类型，数据源
const createShader = (
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader => {
  let shader = gl.createShader(type); // 创建着色器对象
  gl.shaderSource(shader, source); // 提供数据源
  gl.compileShader(shader); // 编译 -> 生成着色器
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader;
  }

  gl.deleteShader(shader);
  return null;
};

// 创建array buffer, 用于向attribute复制
const createArrayBuffer = (
  gl: WebGLRenderingContext,
  data: number[],
  type = gl.FLOAT
) => {
  // 创建buffer并绑定buffer数据
  let buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  let arrayData = null;
  if (type == gl.UNSIGNED_BYTE) arrayData = new Uint8Array(data);
  else arrayData = new Float32Array(data);

  gl.bufferData(gl.ARRAY_BUFFER, arrayData, gl.STATIC_DRAW);

  return buffer;
};

// 绑定数组数据
const bindArrayData = (
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  data: number[],
  key: string,
  size = 2,
  type = gl.FLOAT,
  normalize = false
) => {
  let positionBuffer = createArrayBuffer(gl, data, type);

  let positionAttributeLocation = gl.getAttribLocation(program, key);

  gl.enableVertexAttribArray(positionAttributeLocation);

  // 将绑定点绑定到缓冲数据（positionBuffer）
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // 告诉属性怎么从positionBuffer中读取数据 (ARRAY_BUFFER)
  gl.vertexAttribPointer(
    positionAttributeLocation,
    size,
    type,
    normalize,
    0,
    0 // 每次迭代运行运动多少内存到下一个数据开始点
  );
};

// 绑定顶点数据
const bindVertexData = (
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  vertexData: number[],
  key = 'a_position',
  size = 2
) => bindArrayData(gl, program, vertexData, key, size);

const degree2Radian = (degree: number) => (degree * Math.PI) / 180;

export class Entity {
  _engine: Engine;
  program: WebGLProgram;

  // 变换
  position: number[] = [200, 200, 0];
  rotation = [40, 30, 325];
  scale = [1, 1, 1];

  constructor(engine: Engine) {
    this._engine = engine;
    this.program = createProgram(
      engine.gl,
      vertexShaderSource,
      fragmentShaderSource
    );
  }

  render() {
    const gl = this._engine.gl;
    const program = this.program;

    gl.useProgram(program);

    // 绑定顶点数据
    bindArrayData(gl, program, vertexData, 'a_position', 3);
    // 绑定颜色数据
    bindArrayData(gl, program, colorData, 'a_color', 3, gl.UNSIGNED_BYTE, true);

    // 绑定resolution
    let matrixLocation = gl.getUniformLocation(program, 'u_matrix');

    // 物体的平移 旋转 缩放
    const position = this.position;
    const rotation = this.rotation;
    const scale = this.scale;

    // 计算矩阵
    let matrix = M4.perspective(1);
    matrix = M4.multiply(
      matrix,
      M4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400)
    );
    matrix = M4.translate(matrix, position[0], position[1], position[2]);
    matrix = M4.xRotate(matrix, degree2Radian(rotation[0]));
    matrix = M4.yRotate(matrix, degree2Radian(rotation[1]));
    matrix = M4.zRotate(matrix, degree2Radian(rotation[2]));
    matrix = M4.scale(matrix, scale[0], scale[1], scale[2]);

    // 设置矩阵
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    // 绑定Z值
    let fudgeFactorLocation = gl.getUniformLocation(program, 'u_fudgeFactor');
    gl.uniform1f(fudgeFactorLocation, 1);

    gl.enable(gl.DEPTH_TEST);
    // 这里清除颜色及深度缓冲
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 绘制
    gl.drawArrays(gl.TRIANGLES, 0, vertexData.length / 3);
  }
}

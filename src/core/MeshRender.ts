import { Matrix } from '@/math';
import { Component } from './Component';
import { Entity } from './Entity';

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

export class MeshRender extends Component {
  // 顶点数据
  vertex: number[];

  // 颜色数据
  color: number[];

  // shader名称
  private _name: string;

  get name() {
    return this._name;
  }

  set name(name: string) {
    this._name = name;
  }

  constructor(entity: Entity, name: string) {
    super(entity);

    this._name = name;
  }

  render() {
    const shader = this.engine.shaderPool.getShader(this.name);
    const gl = this._engine.gl;

    shader.bind();
    const program = shader.program;

    // 绑定顶点数据
    bindArrayData(gl, program, this.vertex, 'POSITION', 3);
    // 绑定颜色数据
    bindArrayData(
      gl,
      program,
      this.color,
      'COLOR_0',
      3,
      gl.UNSIGNED_BYTE,
      true
    );

    // 绑定resolution
    let matrixLocation = gl.getUniformLocation(program, 'u_MVPMat');

    // 计算矩阵
    const camera = this.engine.camera;

    const matrix = new Matrix();
    // view Project Matrix
    Matrix.multiply(camera.projectionMatrix, camera.viewMatrix, matrix);
    // mvp matrix
    Matrix.multiply(matrix, this.entity.transform.worldMatrix, matrix);

    // 设置矩阵
    gl.uniformMatrix4fv(matrixLocation, false, matrix.elements);

    gl.enable(gl.DEPTH_TEST);
    // 这里清除颜色及深度缓冲
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 绘制
    gl.drawArrays(gl.TRIANGLES, 0, this.vertex.length / 3);
  }
}

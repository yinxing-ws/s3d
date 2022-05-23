import { IRenderContext } from './IRenderContext';

export class Shader {
  _gl: IRenderContext;
  program: WebGLProgram;

  constructor(
    gl: IRenderContext,
    vertexSource: string,
    fragmentSource: string
  ) {
    this._gl = gl;

    const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentSource
    );

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    this.program = program;
  }

  bind() {
    this._gl.useProgram(this.program);
  }

  // 创建着色器方法，输入参数：渲染上下文，着色器类型，数据源
  private createShader = (
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
}

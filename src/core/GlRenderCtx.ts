export class GlRenderCtx {
  private _gl: WebGL2RenderingContext;

  get gl(): WebGL2RenderingContext {
    return this._gl;
  }

  constructor(canvas: HTMLCanvasElement) {
    this._gl = canvas.getContext('webgl2');
    this._gl.clearColor(0, 0, 0, 0);
    this._gl.clear(this._gl.COLOR_BUFFER_BIT);

    this.setSize(canvas.width, canvas.height);
  }

  setSize(width: number, height: number) {
    this._gl.viewport(0, 0, width, height);
  }
}

import { Time } from './base/Time';
import { Entity } from './Entity';
import { GlRenderCtx } from './GlRenderCtx';

export class Engine {
  protected _canvas: HTMLCanvasElement;
  protected _glCtx: GlRenderCtx;

  private _time: Time = new Time();
  private _isPaused: boolean = true;
  private _requestId: number;
  private _timeoutId: number;

  /**
   * Get the Time class.
   */
  get time(): Time {
    return this._time;
  }

  get gl(): WebGL2RenderingContext {
    return this._glCtx.gl;
  }

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;

    this._glCtx = new GlRenderCtx(canvas);
  }

  private _animate = () => {
    this._requestId = requestAnimationFrame(this._animate);
    this.update();
  };

  pause(): void {
    this._isPaused = true;
    cancelAnimationFrame(this._requestId);
    clearTimeout(this._timeoutId);
  }

  /**
   * Resume the engine.
   */
  resume(): void {
    if (!this._isPaused) return;
    this._isPaused = false;
    this.time.reset();
    requestAnimationFrame(this._animate);
  }

  /**
   * Update the engine loop manually. If you call engine.run(), you generally don't need to call this function.
   */
  update(): void {
    const time = this._time;
    const deltaTime = time.deltaTime;

    time.tick();

    if (this.entity) {
      this.entity.rotation[1] += 1;
      this.entity.render();
    }

    // this._render(scene);
  }

  run(): void {
    this.resume();
  }

  public entity: Entity;
}

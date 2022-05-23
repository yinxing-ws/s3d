import { Time } from './base/Time';
import { Camera } from './Camera';
import { Entity } from './Entity';
import { IRenderContext } from './IRenderContext';
import { MeshRender } from './MeshRender';
import { Script } from './Script';
import { ShaderPool } from './ShaderPool';

export class Engine {
  protected _canvas: HTMLCanvasElement;
  protected _gl: IRenderContext;

  private _time: Time = new Time();
  private _isPaused: boolean = true;
  private _requestId: number;
  private _timeoutId: number;

  get canvas(): HTMLCanvasElement {
    return this._canvas;
  }

  get time(): Time {
    return this._time;
  }

  get gl(): IRenderContext {
    return this._gl;
  }

  // 相机
  private _camera: Camera;

  get camera() {
    return this._camera;
  }

  set camera(camera: Camera) {
    this._camera = camera;
  }

  // shaderPool
  private _shaderPool: ShaderPool;

  get shaderPool() {
    return this._shaderPool;
  }

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;

    this._gl = canvas.getContext('webgl2');
    this._gl.clearColor(0, 0, 0, 0);
    this._gl.clear(this._gl.COLOR_BUFFER_BIT);

    this._shaderPool = new ShaderPool(this);
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

    if (this.camera) {
      // 收集所有entities
      let allEntities: Entity[] = [];

      this.rootEntities.forEach((rootEntity) => {
        allEntities = [
          ...allEntities,
          rootEntity,
          ...rootEntity.getAllChildren(),
        ];
      });

      let scripts: Script[] = [];
      let meshRenders: MeshRender[] = [];

      allEntities.forEach((entity) => {
        scripts = [
          ...scripts,
          ...(entity._components.filter(
            (component) => component instanceof Script
          ) as Script[]),
        ];

        meshRenders = [
          ...meshRenders,
          ...(entity._components.filter(
            (component) => component instanceof MeshRender
          ) as MeshRender[]),
        ];
      });

      scripts.forEach((script) => script.onUpdate(deltaTime));

      this.camera.render(meshRenders);
    }
  }

  run(): void {
    this.resume();
  }

  // 根节点
  private _rootEntities: Entity[] = [];

  get rootEntities() {
    return this._rootEntities;
  }

  createRootEntity() {
    const entity = new Entity(this);
    this._rootEntities.push(entity);
    return entity;
  }

  removeRootEntity(rootEntity: Entity) {
    const rootEntities = this._rootEntities;
    rootEntities.splice(rootEntities.indexOf(rootEntity), 1);
  }
}

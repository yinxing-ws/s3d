import { Engine } from './Engine';

/**
 * EngineObject.
 */
export abstract class EngineObject {
  private static _instanceIdCounter: number = 0;

  /** Engine unique id. */
  readonly instanceId: number = ++EngineObject._instanceIdCounter;

  protected _engine: Engine;
  protected _destroyed: boolean = false;

  /**
   * Get the engine which the object belongs.
   */
  get engine(): Engine {
    return this._engine;
  }

  /**
   * Whether it has been destroyed.
   */
  get destroyed(): boolean {
    return this._destroyed;
  }

  constructor(engine: Engine) {
    this._engine = engine;
  }

  /**
   * Destroy self.
   */
  destroy(): void {
    if (this._destroyed) return;

    this._destroyed = true;
  }
}
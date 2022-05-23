import { EngineObject } from './EngineObject';
import { Entity } from './Entity';

/**
 * The base class of the components.
 */
export abstract class Component extends EngineObject {
  _entity: Entity;
  _destroyed: boolean = false;

  get destroyed(): boolean {
    return this._destroyed;
  }

  get entity(): Entity {
    return this._entity;
  }

  constructor(entity: Entity) {
    super(entity.engine);
    this._entity = entity;
  }

  /**
   * Destroy this instance.
   */
  destroy(): void {
    if (this._destroyed) {
      return;
    }

    this._entity._removeComponent(this);
    this._destroyed = true;
    this._onDestroy();
  }

  _onAwake(): void {}

  _onDestroy(): void {}
}

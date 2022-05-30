import { Component } from "../Component";
import { ignoreClone } from "../clone/CloneManager";
import { ICollider } from "src/design";
import { ColliderShape } from "./shape/ColliderShape";
import { UpdateFlag } from "../UpdateFlag";
import { Entity } from "../Entity";

/**
 * Abstract class for collider shapes.
 */
export abstract class Collider extends Component {
  /** @internal */
  @ignoreClone
  _index: number = -1;
  /** @internal */
  _nativeCollider: ICollider;

  protected _updateFlag: UpdateFlag;

  private _shapes: ColliderShape[] = [];

  /**
   * The shapes of this collider.
   */
  get shapes(): Readonly<ColliderShape[]> {
    return this._shapes;
  }

  protected constructor(entity: Entity) {
    super(entity);
    this._updateFlag = this.entity.transform.registerWorldChangeFlag();
  }

  /**
   * Add collider shape on this collider.
   * @param shape - Collider shape
   */
  addShape(shape: ColliderShape): void {
    const oldCollider = shape._collider;
    if (oldCollider !== this) {
      if (oldCollider) {
        oldCollider.removeShape(shape);
      }
      this._shapes.push(shape);
      this.engine.physicsManager._addColliderShape(shape);
      this._nativeCollider.addShape(shape._nativeShape);
      shape._collider = this;
    }
  }

  /**
   * Remove a collider shape.
   * @param shape - The collider shape.
   */
  removeShape(shape: ColliderShape): void {
    const index = this._shapes.indexOf(shape);
    if (index !== -1) {
      this._shapes.splice(index, 1);
      this._nativeCollider.removeShape(shape._nativeShape);
      this.engine.physicsManager._removeColliderShape(shape);
      shape._collider = null;
    }
  }

  /**
   * Remove all shape attached.
   */
  clearShapes(): void {
    const shapes = this._shapes;
    for (let i = 0, n = shapes.length; i < n; i++) {
      this._nativeCollider.removeShape(shapes[i]._nativeShape);
      this.engine.physicsManager._removeColliderShape(shapes[i]);
    }
    shapes.length = 0;
  }

  /**
   * @internal
   */
  _onUpdate() {
    if (this._updateFlag.flag) {
      const { transform } = this.entity;
      this._nativeCollider.setWorldTransform(transform.worldPosition, transform.worldRotationQuaternion);
      this._updateFlag.flag = false;

      const worldScale = transform.lossyWorldScale;
      for (let i = 0, n = this.shapes.length; i < n; i++) {
        this.shapes[i]._nativeShape.setWorldScale(worldScale);
      }
    }
  }

  /**
   * @internal
   */
  _onLateUpdate() {}

  /**
   * @override
   * @internal
   */
  _onEnable() {
    this.engine.physicsManager._addCollider(this);
    this.engine._componentsManager.addCollider(this);
  }

  /**
   * @override
   * @internal
   */
  _onDisable() {
    this.engine.physicsManager._removeCollider(this);
    this.engine._componentsManager.removeCollider(this);
  }

  /**
   * @override
   * @internal
   */
  _onDestroy() {
    this.clearShapes();
  }
}

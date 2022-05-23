import { ColliderShape } from "./ColliderShape";
import { IBoxColliderShape } from "@/design";
import { Vector3 } from "@/math";
import { PhysicsManager } from "../PhysicsManager";

/**
 * Physical collider shape for box.
 */
export class BoxColliderShape extends ColliderShape {
  private _size: Vector3 = new Vector3(1, 1, 1);
  /**
   * Size of box shape.
   */
  get size(): Vector3 {
    return this._size;
  }

  set size(value: Vector3) {
    if (this._size != value) {
      value.cloneTo(this._size);
    }
    (<IBoxColliderShape>this._nativeShape).setSize(value);
  }

  constructor() {
    super();
    this._nativeShape = PhysicsManager._nativePhysics.createBoxColliderShape(
      this._id,
      this._size,
      this._material._nativeMaterial
    );
  }

  /**
   * Set size of box.
   * @param x - Size of x-axis
   * @param y - Size of y-axis
   * @param z - Size of z-axis
   */
  setSize(x: number, y: number, z: number): void {
    this._size.x = x;
    this._size.y = y;
    this._size.z = z;
    (<IBoxColliderShape>this._nativeShape).setSize(this._size);
  }
}

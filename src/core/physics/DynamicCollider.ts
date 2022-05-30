import { IDynamicCollider } from "src/design";
import { Entity } from "../Entity";
import { Collider } from "./Collider";
import { PhysicsManager } from "./PhysicsManager";
import { Vector3 } from "src/math";

/**
 * A dynamic collider can act with self-defined movement or physical force.
 */
export class DynamicCollider extends Collider {
  /** The linear velocity vector of the dynamic collider measured in world unit per second. */
  linearVelocity: Vector3;
  /** The angular velocity vector of the dynamic collider measured in radians per second. */
  angularVelocity: Vector3;
  /** The linear damping of the dynamic collider. */
  linearDamping: number;
  /** The angular damping of the dynamic collider. */
  angularDamping: number;
  /** The mass of the dynamic collider. */
  mass: number;
  /** Controls whether physics affects the dynamic collider. */
  isKinematic: boolean;

  constructor(entity: Entity) {
    super(entity);
    const { transform } = this.entity;
    this._nativeCollider = PhysicsManager._nativePhysics.createDynamicCollider(
      transform.worldPosition,
      transform.worldRotationQuaternion
    );
  }

  /**
   * Apply a force to the DynamicCollider.
   * @param force - The force make the collider move
   */
  applyForce(force: Vector3): void {
    (<IDynamicCollider>this._nativeCollider).addForce(force);
  }

  /**
   * Apply a torque to the DynamicCollider.
   * @param torque - The force make the collider rotate
   */
  applyTorque(torque: Vector3): void {
    (<IDynamicCollider>this._nativeCollider).addTorque(torque);
  }

  /**
   * @override
   * @internal
   */
  _onLateUpdate() {
    const { transform } = this.entity;
    const { worldPosition, worldRotationQuaternion } = transform;
    this._nativeCollider.getWorldTransform(worldPosition, worldRotationQuaternion);
    transform.worldPosition = worldPosition;
    transform.worldRotationQuaternion = worldRotationQuaternion;
    this._updateFlag.flag = false;
  }
}

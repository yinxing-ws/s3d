import { MathUtil, Quaternion, Matrix } from '@/math';
import { Vector3 } from '@/math/Vector3';
import { Component } from './Component';
import { Entity } from './Entity';

export class Transform extends Component {
  private _position: Vector3 = new Vector3();
  private _rotation: Vector3 = new Vector3();
  private _scale: Vector3 = new Vector3(1, 1, 1);

  private _rotationQuaternion: Quaternion = new Quaternion();
  private _localMatrix = new Matrix();
  private _worldMatrix = new Matrix();

  get position(): Vector3 {
    return this._position;
  }

  set position(value: Vector3) {
    if (this._position !== value) {
      value.cloneTo(this._position);
    }
  }

  get rotation(): Vector3 {
    return this._rotation;
  }

  set rotation(value: Vector3) {
    if (this._rotation !== value) {
      value.cloneTo(this._rotation);
    }
  }

  get scale(): Vector3 {
    return this._scale;
  }

  set scale(value: Vector3) {
    if (this._scale !== value) {
      value.cloneTo(this._scale);
    }
  }

  get rotationQuaternion(): Quaternion {
    Quaternion.rotationEuler(
      MathUtil.degreeToRadian(this._rotation.x),
      MathUtil.degreeToRadian(this._rotation.y),
      MathUtil.degreeToRadian(this._rotation.z),
      this._rotationQuaternion
    );

    return this._rotationQuaternion;
  }

  constructor(entity: Entity) {
    super(entity);
  }

  get localMatrix(): Matrix {
    Matrix.affineTransformation(
      this._scale,
      this.rotationQuaternion,
      this._position,
      this._localMatrix
    );

    return this._localMatrix;
  }

  get worldMatrix(): Matrix {
    const parent = this._entity.parent;
    if (parent) {
      Matrix.multiply(
        parent.transform.worldMatrix,
        this.localMatrix,
        this._worldMatrix
      );
    } else {
      this.localMatrix.cloneTo(this._worldMatrix);
    }

    return this._worldMatrix;
  }
}

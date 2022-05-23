import { MathUtil, Matrix } from '@/math';
import { Component } from './Component';
import { Entity } from './Entity';
import { MeshRender } from './MeshRender';
import { Transform } from './Transform';

export class Camera extends Component {
  _transform: Transform;

  private _nearClipPlane: number = 0.1;
  private _farClipPlane: number = 100;
  private _fieldOfView: number = 45;

  private _projectionMatrix: Matrix = new Matrix();
  private _viewMatrix: Matrix = new Matrix();
  private _inverseProjectionMatrix: Matrix = new Matrix();
  private _invViewProjMat: Matrix = new Matrix();

  get nearClipPlane(): number {
    return this._nearClipPlane;
  }

  set nearClipPlane(value: number) {
    this._nearClipPlane = value;
  }

  get farClipPlane(): number {
    return this._farClipPlane;
  }

  set farClipPlane(value: number) {
    this._farClipPlane = value;
  }

  get fieldOfView(): number {
    return this._fieldOfView;
  }

  set fieldOfView(value: number) {
    this._fieldOfView = value;
  }

  get aspectRatio(): number {
    const canvas = this._entity.engine.canvas;
    return canvas.width / canvas.height;
  }

  /**
   * View matrix.
   */
  get viewMatrix(): Readonly<Matrix> {
    // Remove scale
    Matrix.invert(this._transform.worldMatrix, this._viewMatrix);

    return this._viewMatrix;
  }

  /**
   * Projection matrix.
   */
  get projectionMatrix(): Matrix {
    Matrix.perspective(
      MathUtil.degreeToRadian(this._fieldOfView),
      this.aspectRatio,
      this._nearClipPlane,
      this._farClipPlane,
      this._projectionMatrix
    );
    return this._projectionMatrix;
  }

  get inverseProjectionMatrix(): Matrix {
    Matrix.invert(this.projectionMatrix, this._inverseProjectionMatrix);

    return this._inverseProjectionMatrix;
  }

  get invViewProjMat(): Matrix {
    Matrix.multiply(
      this._transform.worldMatrix,
      this.inverseProjectionMatrix,
      this._invViewProjMat
    );

    return this._invViewProjMat;
  }

  constructor(entity: Entity) {
    super(entity);

    this._entity = entity;
    this._transform = entity.transform;
  }

  render(renders: MeshRender[]) {
    renders.forEach((render) => render.render());
  }
}

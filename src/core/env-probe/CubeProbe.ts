import { Matrix, Vector3 } from "@/math";
import { Camera } from "../Camera";
import { TextureCubeFace } from "../texture";
import { Probe } from "./Probe";

const cacheTarget: Vector3 = new Vector3();
const cacheUp: Vector3 = new Vector3();
const cacheDir: Vector3 = new Vector3();

/**
 * Cube probe, generate cubeTexture, used for dynamic environment reflection and other effects.
 */
export class CubeProbe extends Probe {
  /**
   * The position of the probe can be set, the default is the origin [0,0,0].
   */
  position: Vector3 = new Vector3(0, 0, 0);

  /**
   * @override
   */
  protected readonly _isCube: boolean = true;

  private oriViewMatrix = new Matrix();
  private _oriFieldOfView: number;

  /**
   * @override
   */
  onBeginRender(camera: Camera): void {
    if (!this.enabled) return;
    super.onBeginRender(camera);
    this._storeCamera(camera);

    // Render 6 faces
    for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
      // Change camera parameters
      this._setCamera(faceIndex, camera);
      camera.render(TextureCubeFace.PositiveX + faceIndex);
    }

    this._restoreCamera(camera);
    super._reset();
  }

  /**
   * Store original camera parameters.
   */
  private _storeCamera(camera: Camera) {
    camera.viewMatrix.cloneTo(this.oriViewMatrix);
    this._oriFieldOfView = camera.fieldOfView;
  }

  /**
   * Restore camera parameters.
   */
  private _restoreCamera(camera: Camera) {
    this.oriViewMatrix.cloneTo(camera.viewMatrix);
    camera.fieldOfView = this._oriFieldOfView;
  }

  /**
   * Set camera parameters according to the rendering surface.
   */
  private _setCamera(faceIndex: number, camera: Camera) {
    switch (faceIndex) {
      // positive_x
      case 0:
        cacheUp.setValue(0, -1, 0);
        cacheDir.setValue(1, 0, 0);
        break;
      // negative_x
      case 1:
        cacheUp.setValue(0, -1, 0);
        cacheDir.setValue(-1, 0, 0);
        break;
      // positive_y
      case 2:
        cacheUp.setValue(0, 0, 1);
        cacheDir.setValue(0, 1, 0);
        break;
      // negative_y
      case 3:
        cacheUp.setValue(0, 0, -1);
        cacheDir.setValue(0, -1, 0);
        break;
      // positive_z
      case 4:
        cacheUp.setValue(0, -1, 0);
        cacheDir.setValue(0, 0, 1);
        break;
      // negative_z
      case 5:
        cacheUp.setValue(0, -1, 0);
        cacheDir.setValue(0, 0, -1);
        break;
    }

    Vector3.add(this.position, cacheDir, cacheTarget);
    Matrix.lookAt(this.position, cacheTarget, cacheUp, camera.viewMatrix);
    camera.fieldOfView = 90;
  }
}

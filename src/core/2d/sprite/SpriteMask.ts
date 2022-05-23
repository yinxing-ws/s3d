import { Vector3 } from "@/math";
import { Camera } from "../../Camera";
import { assignmentClone, deepClone, ignoreClone } from "../../clone/CloneManager";
import { ICustomClone } from "../../clone/ComponentCloner";
import { Entity } from "../../Entity";
import { Renderer } from "../../Renderer";
import { SpriteMaskElement } from "../../RenderPipeline/SpriteMaskElement";
import { Shader } from "../../shader/Shader";
import { ShaderProperty } from "../../shader/ShaderProperty";
import { UpdateFlag } from "../../UpdateFlag";
import { SpriteMaskLayer } from "../enums/SpriteMaskLayer";
import { Sprite } from "./Sprite";

/**
 * A component for masking Sprites.
 */
export class SpriteMask extends Renderer implements ICustomClone {
  /** @internal */
  static _textureProperty: ShaderProperty = Shader.getPropertyByName("u_maskTexture");
  /** @internal */
  static _alphaCutoffProperty: ShaderProperty = Shader.getPropertyByName("u_maskAlphaCutoff");

  private static _tempVec3: Vector3 = new Vector3();

  /** @internal */
  _maskElement: SpriteMaskElement;

  @deepClone
  private _positions: Vector3[] = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
  @ignoreClone
  private _worldMatrixDirtyFlag: UpdateFlag;
  @ignoreClone
  private _sprite: Sprite = null;
  @assignmentClone
  private _alphaCutoff: number = 0.5;
  @ignoreClone
  private _spriteDirty: UpdateFlag;

  /** The mask layers the sprite mask influence to. */
  @assignmentClone
  influenceLayers: number = SpriteMaskLayer.Everything;

  /**
   * The Sprite used to define the mask.
   */
  get sprite(): Sprite {
    return this._sprite;
  }

  set sprite(value: Sprite) {
    if (this._sprite !== value) {
      this._spriteDirty && this._spriteDirty.destroy();
      this._sprite = value;
      if (value) {
        this._spriteDirty = value._registerUpdateFlag();
      }
    }
  }

  /**
   * The minimum alpha value used by the mask to select the area of influence defined over the mask's sprite. Value between 0 and 1.
   */
  get alphaCutoff(): number {
    return this._alphaCutoff;
  }

  set alphaCutoff(value: number) {
    if (this._alphaCutoff !== value) {
      this._alphaCutoff = value;
      this.shaderData.setFloat(SpriteMask._alphaCutoffProperty, value);
    }
  }

  /**
   * @internal
   */
  constructor(entity: Entity) {
    super(entity);
    this._worldMatrixDirtyFlag = entity.transform.registerWorldChangeFlag();
    this.setMaterial(this._engine._spriteMaskDefaultMaterial);
    this.shaderData.setFloat(SpriteMask._alphaCutoffProperty, this._alphaCutoff);
  }

  /**
   * @override
   * @inheritdoc
   */
  _onDestroy(): void {
    this._worldMatrixDirtyFlag.destroy();
    this._spriteDirty && this._spriteDirty.destroy();
    super._onDestroy();
  }

  /**
   * @override
   * @inheritdoc
   */
  _render(camera: Camera): void {
    const sprite = this.sprite;
    if (!sprite) {
      return null;
    }
    const texture = sprite.texture;
    if (!texture) {
      return null;
    }

    const positions = this._positions;
    const transform = this.entity.transform;

    // Update sprite data.
    sprite._updateMesh();

    if (this._worldMatrixDirtyFlag.flag || this._spriteDirty.flag) {
      const localPositions = sprite._positions;
      const localVertexPos = SpriteMask._tempVec3;
      const worldMatrix = transform.worldMatrix;

      for (let i = 0, n = positions.length; i < n; i++) {
        const curVertexPos = localPositions[i];
        localVertexPos.setValue(curVertexPos.x, curVertexPos.y, 0);
        Vector3.transformToVec3(localVertexPos, worldMatrix, positions[i]);
      }

      this._spriteDirty.flag = false;
      this._worldMatrixDirtyFlag.flag = false;
    }

    this.shaderData.setTexture(SpriteMask._textureProperty, texture);
    const spriteMaskElementPool = this._engine._spriteMaskElementPool;
    const maskElement = spriteMaskElementPool.getFromPool();
    maskElement.setValue(this, positions, sprite._uv, sprite._triangles, this.getMaterial());
    maskElement.camera = camera;

    camera._renderPipeline._allSpriteMasks.add(this);
    this._maskElement = maskElement;
  }

  /**
   * @internal
   */
  _cloneTo(target: SpriteMask): void {
    target.sprite = this._sprite;
  }
}

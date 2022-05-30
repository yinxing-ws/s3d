import { Color, Vector4 } from '../../math';
import { Engine } from '../Engine';
import { Shader } from '../shader/Shader';
import { Texture2D } from '../texture/Texture2D';
import { BaseMaterial } from './BaseMaterial';

/**
 * Unlit Material.
 */
export class UnityStandardMaterial extends BaseMaterial {
  private static _baseColorProp = Shader.getPropertyByName('u_baseColor');
  private static _baseTextureProp = Shader.getPropertyByName('u_baseTexture');
  private static _tilingOffsetProp = Shader.getPropertyByName('u_tilingOffset');

  /**
   * Base color.
   */
  get baseColor(): Color {
    return this.shaderData.getColor(UnityStandardMaterial._baseColorProp);
  }

  set baseColor(value: Color) {
    const baseColor = this.shaderData.getColor(
      UnityStandardMaterial._baseColorProp
    );
    if (value !== baseColor) {
      value.cloneTo(baseColor);
    }
  }

  /**
   * Base texture.
   */
  get baseTexture(): Texture2D {
    return <Texture2D>(
      this.shaderData.getTexture(UnityStandardMaterial._baseTextureProp)
    );
  }

  set baseTexture(value: Texture2D) {
    this.shaderData.setTexture(UnityStandardMaterial._baseTextureProp, value);
    if (value) {
      this.shaderData.enableMacro('O3_BASE_TEXTURE');
    } else {
      this.shaderData.disableMacro('O3_BASE_TEXTURE');
    }
  }

  /**
   * Tiling and offset of main textures.
   */
  get tilingOffset(): Vector4 {
    return this.shaderData.getVector4(UnityStandardMaterial._tilingOffsetProp);
  }

  set tilingOffset(value: Vector4) {
    const tilingOffset = this.shaderData.getVector4(
      UnityStandardMaterial._tilingOffsetProp
    );
    if (value !== tilingOffset) {
      value.cloneTo(tilingOffset);
    }
  }

  /**
   * Create a unlit material instance.
   * @param engine - Engine to which the material belongs
   */
  constructor(engine: Engine) {
    super(engine, Shader.find('unity-standard'));

    const shaderData = this.shaderData;

    shaderData.enableMacro('O3_NEED_TILINGOFFSET');

    shaderData.setColor(
      UnityStandardMaterial._baseColorProp,
      new Color(1, 1, 1, 1)
    );
    shaderData.setVector4(
      UnityStandardMaterial._tilingOffsetProp,
      new Vector4(1, 1, 0, 0)
    );
  }

  /**
   * @override
   */
  clone(): UnityStandardMaterial {
    const dest = new UnityStandardMaterial(this._engine);
    this.cloneTo(dest);
    return dest;
  }
}

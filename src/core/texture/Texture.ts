import { RefObject } from "../asset/RefObject";
import { Logger } from "../base/Logger";
import { IPlatformTexture } from "../renderingHardwareInterface";
import { TextureFilterMode } from "./enums/TextureFilterMode";
import { TextureWrapMode } from "./enums/TextureWrapMode";

/**
 * The base class of texture, contains some common functions of texture-related classes.
 */
export abstract class Texture extends RefObject {
  name: string;

  /** @internal */
  _platformTexture: IPlatformTexture;
  /** @internal */
  _mipmap: boolean;

  protected _width: number;
  protected _height: number;
  protected _mipmapCount: number;

  private _wrapModeU: TextureWrapMode;
  private _wrapModeV: TextureWrapMode;
  private _filterMode: TextureFilterMode;
  private _anisoLevel: number = 1;

  /**
   * The width of the texture.
   */
  get width(): number {
    return this._width;
  }

  /**
   * The height of the texture.
   */
  get height(): number {
    return this._height;
  }

  /**
   * Wrapping mode for texture coordinate S.
   */
  get wrapModeU(): TextureWrapMode {
    return this._wrapModeU;
  }

  set wrapModeU(value: TextureWrapMode) {
    if (value === this._wrapModeU) return;
    this._wrapModeU = value;

    this._platformTexture.wrapModeU = value;
  }

  /**
   * Wrapping mode for texture coordinate T.
   */
  get wrapModeV(): TextureWrapMode {
    return this._wrapModeV;
  }

  set wrapModeV(value: TextureWrapMode) {
    if (value === this._wrapModeV) return;
    this._wrapModeV = value;

    this._platformTexture.wrapModeV = value;
  }

  /**
   * Texture mipmapping count.
   */
  get mipmapCount(): number {
    return this._mipmapCount;
  }

  /**
   * Filter mode for texture.
   */
  get filterMode(): TextureFilterMode {
    return this._filterMode;
  }

  set filterMode(value: TextureFilterMode) {
    if (value === this._filterMode) return;
    this._filterMode = value;

    this._platformTexture.filterMode = value;
  }

  /**
   * Anisotropic level for texture.
   */
  get anisoLevel(): number {
    return this._anisoLevel;
  }

  set anisoLevel(value: number) {
    const max = this._engine._hardwareRenderer.capability.maxAnisoLevel;

    if (value > max) {
      Logger.warn(`anisoLevel:${value}, exceeds the limit and is automatically downgraded to:${max}`);
      value = max;
    }

    if (value < 1) {
      Logger.warn(`anisoLevel:${value}, must be greater than 0, and is automatically downgraded to 1`);
      value = 1;
    }

    if (value === this._anisoLevel) return;

    this._anisoLevel = value;

    this._platformTexture.anisoLevel = value;
  }

  /**
   * Generate multi-level textures based on the 0th level data.
   */
  generateMipmaps(): void {
    if (!this._mipmap) return;

    this._platformTexture.generateMipmaps();
  }

  /**
   * @override
   */
  _onDestroy() {
    this._platformTexture.destroy();
    this._platformTexture = null;
  }

  /**
   * Get the maximum mip level of the corresponding size:rounding down.
   * @remarks http://download.nvidia.com/developer/Papers/2005/NP2_Mipmapping/NP2_Mipmap_Creation.pdf
   */
  protected _getMaxMiplevel(size: number): number {
    return Math.floor(Math.log2(size));
  }

  protected _getMipmapCount(): number {
    return this._mipmap ? Math.floor(Math.log2(Math.max(this._width, this._height))) + 1 : 1;
  }
}

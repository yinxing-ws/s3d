import { Engine } from '../Engine';
import { Shader } from '../shader/Shader';
import { Texture2D } from '../texture/Texture2D';
import { PBRBaseMaterial } from './PBRBaseMaterial';

/**
 * PBR (Metallic-Roughness Workflow) Material.
 */
export class PBRMaterial extends PBRBaseMaterial {
  private static _metallicProp = Shader.getPropertyByName('u_metal');
  private static _roughnessProp = Shader.getPropertyByName('u_roughness');
  private static _metallicRoughnessTextureProp = Shader.getPropertyByName(
    'u_metallicRoughnessSampler'
  );
  private static _brightnessProp = Shader.getPropertyByName('u_brightness');
  private static _contrastProp = Shader.getPropertyByName('u_contrast');

  /**
   * Metallic.
   */
  get metallic(): number {
    return this.shaderData.getFloat(PBRMaterial._metallicProp);
  }

  set metallic(value: number) {
    this.shaderData.setFloat(PBRMaterial._metallicProp, value);
  }

  /**
   * Roughness.
   */
  get roughness(): number {
    return this.shaderData.getFloat(PBRMaterial._roughnessProp);
  }

  set roughness(value: number) {
    this.shaderData.setFloat(PBRMaterial._roughnessProp, value);
  }

  /**
   * Roughness metallic texture.
   * @remarks G channel is roughness, B channel is metallic
   */
  get roughnessMetallicTexture(): Texture2D {
    return <Texture2D>(
      this.shaderData.getTexture(PBRMaterial._metallicRoughnessTextureProp)
    );
  }

  set roughnessMetallicTexture(value: Texture2D) {
    this.shaderData.setTexture(
      PBRMaterial._metallicRoughnessTextureProp,
      value
    );
    if (value) {
      this.shaderData.enableMacro('HAS_METALROUGHNESSMAP');
    } else {
      this.shaderData.disableMacro('HAS_METALROUGHNESSMAP');
    }
  }

  /**
   * brightness.
   */
  get brightness(): number {
    return this.shaderData.getFloat(PBRMaterial._brightnessProp);
  }

  set brightness(value: number) {
    this.shaderData.setFloat(PBRMaterial._brightnessProp, value);
  }

  /**
   * contrast.
   */
   get contrast(): number {
    return this.shaderData.getFloat(PBRMaterial._contrastProp);
  }

  set contrast(value: number) {
    this.shaderData.setFloat(PBRMaterial._contrastProp, value);
  }

  /**
   * Create a pbr metallic-roughness workflow material instance.
   * @param engine - Engine to which the material belongs
   */
  constructor(engine: Engine) {
    super(engine, Shader.find('pbr'));
    this.shaderData.setFloat(PBRMaterial._metallicProp, 1.0);
    this.shaderData.setFloat(PBRMaterial._roughnessProp, 1.0);
    this.shaderData.setFloat(PBRMaterial._contrastProp, 1.0);
    this.shaderData.setFloat(PBRMaterial._brightnessProp, 1.0);
  }

  /**
   * @override
   */
  clone(): PBRMaterial {
    const dest = new PBRMaterial(this._engine);
    this.cloneTo(dest);
    return dest;
  }
}

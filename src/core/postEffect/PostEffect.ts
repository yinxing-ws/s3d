import { Vector2, Vector3 } from '../../math';
import { Engine } from '../Engine';
import { ModelMesh } from '../mesh';
import { ShaderData } from '../shader';
import { ShaderDataGroup } from '../shader/enums/ShaderDataGroup';
import { Shader } from '../shader/Shader';
import { RenderColorTexture } from '../texture';

/**
 * RenderPass for rendering shadow map.
 */
export class PostEffect {
  /** Shader data. */
  readonly shaderData: ShaderData = new ShaderData(ShaderDataGroup.Renderer);

  shader: Shader;

  mesh: ModelMesh;

  // 亮度
  _brightness: number;

  set brightness(brightness: number) {
    if (this._brightness !== brightness) {
      this._brightness = brightness;
      this.shaderData.setFloat('u_brightness', brightness);
    }
  }

  get brightness() {
    return this._brightness;
  }

  // 对比度
  _contrast: number;

  set contrast(contrast: number) {
    if (this._contrast !== contrast) {
      this._contrast = contrast;
      this.shaderData.setFloat('u_contrast', contrast);
    }
  }

  get contrast() {
    return this._contrast;
  }

  // bloom
  _bloomIntensity: number;
  _bloomThreshold: number;

  set bloomIntensity(bloomIntensity: number) {
    if (this._bloomIntensity !== bloomIntensity) {
      this._bloomIntensity = bloomIntensity;
      this.shaderData.setFloat('u_bloomIntensity', bloomIntensity);
    }
  }

  set bloomThreshold(bloomThreshold: number) {
    if (this._bloomThreshold !== bloomThreshold) {
      this._bloomThreshold = bloomThreshold;
      this.shaderData.setFloat('u_bloomThreshold', bloomThreshold);
    }
  }

  constructor(engine: Engine) {
    this.mesh = this._createPlane(engine);
    this.shader = Shader.find('post-effect');

    this.contrast = 1;
    this.brightness = 1;
  }

  updateShaderData(texture: RenderColorTexture) {
    this.shaderData.setTexture('u_baseTexture', texture);
  }

  private _createPlane(engine: Engine): ModelMesh {
    const mesh = new ModelMesh(engine);
    mesh.isGCIgnored = true;
    const indices = new Uint8Array([1, 2, 0, 1, 3, 2]);

    const positions: Vector3[] = new Array(4);
    const uvs: Vector2[] = new Array(4);

    for (let i = 0; i < 4; ++i) {
      positions[i] = new Vector3();
      uvs[i] = new Vector2(i % 2, 1 - ((i * 0.5) | 0));
    }

    positions[0].setValue(-1, -1, 1);
    positions[1].setValue(1, -1, 1);
    positions[2].setValue(-1, 1, 1);
    positions[3].setValue(1, 1, 1);

    mesh.setPositions(positions);
    mesh.setUVs(uvs);
    mesh.setIndices(indices);

    mesh.uploadData(false);
    mesh.addSubMesh(0, indices.length);
    return mesh;
  }
}

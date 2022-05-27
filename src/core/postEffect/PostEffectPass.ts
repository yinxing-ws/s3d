import { Camera } from '../Camera';
import { CameraClearFlags } from '../enums/CameraClearFlags';
import { Layer } from '../Layer';
import { Material } from '../material/Material';
import { RenderPass } from '../RenderPipeline/RenderPass';
import { Shader } from '../shader';
import { RenderTarget } from '../texture/RenderTarget';

/**
 * RenderPass for rendering shadow map.
 */
export class PostEffectPass extends RenderPass {
  constructor(name: string, priority: number, replaceMaterial: Material = null, mask: Layer = null) {
    super(name, priority, replaceMaterial, mask);

    this.clearFlags = CameraClearFlags.DepthColor;
    this.renderOverride = true;
  }

  render(camera: Camera, _, preResult: RenderTarget) {
    const { scene, engine } = camera;
    const { postEffect } = scene;
    const { shader, shaderData, mesh } = postEffect;

    postEffect.updateShaderData(preResult.getColorTexture());

    const rhi = engine._hardwareRenderer;

    const program = shader._getShaderProgram(engine, Shader._compileMacros);
    program.bind();
    program.uploadAll(program.rendererUniformBlock, shaderData);
    program.uploadUnGroupTextures();

    rhi.drawPrimitive(mesh, mesh.subMesh, program);
  }
}

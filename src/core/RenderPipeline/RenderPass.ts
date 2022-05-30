import { Color } from '../../math';
import { Camera } from '../Camera';
import { CameraClearFlags } from '../enums/CameraClearFlags';
import { Layer } from '../Layer';
import { Material } from '../material/Material';
import { RenderTarget } from '../texture/RenderTarget';
import { RenderQueue } from './RenderQueue';

let passNum = 0;

interface RenderQueueData {
  opaqueQueue: RenderQueue;
  alphaTestQueue: RenderQueue;
  transparentQueue: RenderQueue;
}

/**
 * RenderPass.
 */
class RenderPass {
  public name: string;
  public enabled: boolean;
  public priority: number;
  public replaceMaterial: Material;
  public mask: Layer;
  public renderOverride: boolean;
  public clearFlags: CameraClearFlags | undefined;
  public clearColor: Color | undefined;
  public forceRenderCamera: boolean;

  /**
   * Create a RenderPass.
   * @param name - Pass name
   * @param priority - Priority, less than 0 before the default pass, greater than 0 after the default pass
   * @param replaceMaterial -  Replaced material
   * @param mask - Perform bit and operations with Entity.Layer to filter the objects that this Pass needs to render
   */
  constructor(
    name = `RENDER_PASS${passNum++}`,
    priority = 0,
    replaceMaterial = null,
    mask = null,
    forceRenderCamera = false
  ) {
    this.name = name;
    this.enabled = true;
    this.priority = priority;
    this.replaceMaterial = replaceMaterial;
    this.mask = mask || Layer.Everything;
    this.forceRenderCamera = forceRenderCamera;

    this.renderOverride = false; // If renderOverride is set to true, you need to implement the render method
  }

  render(camera: Camera, queueData: RenderQueueData, prePassResult: RenderTarget) {}

  preRender(camera: Camera, queueData: RenderQueueData, prePassResult: RenderTarget) {}

  postRender(camera: Camera, queueData: RenderQueueData, prePassResult: RenderTarget) {}
}

export { RenderPass };

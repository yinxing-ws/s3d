import { Matrix, Vector2 } from '../../math';
import { Background } from '..';
import { SpriteMask } from '../2d/sprite/SpriteMask';
import { Logger } from '../base/Logger';
import { Camera } from '../Camera';
import { DisorderedArray } from '../DisorderedArray';
import { Engine } from '../Engine';
import { BackgroundMode } from '../enums/BackgroundMode';
import { BackgroundTextureFillMode } from '../enums/BackgroundTextureFillMode';
import { CameraClearFlags } from '../enums/CameraClearFlags';
import { Layer } from '../Layer';
import { RenderQueueType } from '../material/enums/RenderQueueType';
import { Material } from '../material/Material';
import { Shader } from '../shader/Shader';
import { ShaderMacroCollection } from '../shader/ShaderMacroCollection';
import { Sky } from '../sky/Sky';
import { RenderColorTexture } from '../texture';
import { TextureCubeFace } from '../texture/enums/TextureCubeFace';
import { RenderTarget } from '../texture/RenderTarget';
import { RenderContext } from './RenderContext';
import { RenderElement } from './RenderElement';
import { RenderPass } from './RenderPass';
import { RenderQueue } from './RenderQueue';
import { SpriteElement } from './SpriteElement';
import { RenderBufferDepthFormat } from '../texture/enums/RenderBufferDepthFormat';
import { PostEffectPass } from '../postEffect/PostEffectPass';

/**
 * Basic render pipeline.
 */
export class SiverRenderPipeline {
  /** @internal */
  _opaqueQueue: RenderQueue;
  /** @internal */
  _transparentQueue: RenderQueue;
  /** @internal */
  _alphaTestQueue: RenderQueue;
  /** @internal */
  _allSpriteMasks: DisorderedArray<SpriteMask> = new DisorderedArray();

  /** @internal */
  _preRenderTarget: RenderTarget;
  /** @internal */
  _preRenderTarget0: RenderTarget;
  /** @internal */
  _preRenderTarget1: RenderTarget;

  private _camera: Camera;
  private _defaultPass: RenderPass;
  private _renderPassArray: Array<RenderPass>;
  private _lastCanvasSize = new Vector2();

  /**
   * Create a basic render pipeline.
   * @param camera - Camera
   */
  constructor(camera: Camera) {
    this._camera = camera;
    const { engine } = camera;
    this._opaqueQueue = new RenderQueue(engine);
    this._alphaTestQueue = new RenderQueue(engine);
    this._transparentQueue = new RenderQueue(engine);

    this._renderPassArray = [];

    const width = 2048;
    const height = 2048;

    this._preRenderTarget0 = new RenderTarget(
      engine,
      width,
      height,
      new RenderColorTexture(engine, width, height, undefined, undefined, false),
      RenderBufferDepthFormat.Depth,
      1
    );

    this._preRenderTarget1 = new RenderTarget(
      engine,
      width,
      height,
      new RenderColorTexture(engine, width, height, undefined, undefined, false),
      RenderBufferDepthFormat.Depth,
      1
    );

    this._preRenderTarget = this._preRenderTarget0;

    this._defaultPass = new RenderPass('default', 0, null, 0);
    this.addRenderPass(this._defaultPass);
  }

  /**
   * Default render pass.
   */
  get defaultRenderPass() {
    return this._defaultPass;
  }

  /**
   * Add render pass.
   * @param nameOrPass - The name of this Pass or RenderPass object. When it is a name, the following parameters need to be provided
   * @param priority - Priority, less than 0 before the default pass, greater than 0 after the default pass
   * @param renderTarget - The specified Render Target
   * @param replaceMaterial -  Replaced material
   * @param mask - Perform bit and operations with Entity.Layer to filter the objects that this Pass needs to render
   */
  addRenderPass(
    nameOrPass: string | RenderPass,
    priority: number = null,
    replaceMaterial: Material = null,
    mask: Layer = null
  ) {
    if (typeof nameOrPass === 'string') {
      const renderPass = new RenderPass(nameOrPass, priority, replaceMaterial, mask);
      this._renderPassArray.push(renderPass);
    } else if (nameOrPass instanceof RenderPass) {
      this._renderPassArray.push(nameOrPass);
    }

    this._renderPassArray.sort(function (p1, p2) {
      return p1.priority - p2.priority;
    });
  }

  /**
   * Remove render pass by name or render pass object.
   * @param nameOrPass - Render pass name or render pass object
   */
  removeRenderPass(nameOrPass: string | RenderPass): void {
    let pass: RenderPass;
    if (typeof nameOrPass === 'string') pass = this.getRenderPass(nameOrPass);
    else if (nameOrPass instanceof RenderPass) pass = nameOrPass;
    if (pass) {
      const idx = this._renderPassArray.indexOf(pass);
      this._renderPassArray.splice(idx, 1);
    }
  }

  /**
   * Get render pass by name.
   * @param  name - Render pass name
   */
  getRenderPass(name: string) {
    for (let i = 0, len = this._renderPassArray.length; i < len; i++) {
      const pass = this._renderPassArray[i];
      if (pass.name === name) return pass;
    }

    return null;
  }

  /**
   * Destroy internal resources.
   */
  destroy(): void {
    this._opaqueQueue.destroy();
    this._alphaTestQueue.destroy();
    this._transparentQueue.destroy();
    this._allSpriteMasks = null;
    this._renderPassArray = null;
    this._defaultPass = null;
    this._camera = null;
  }

  /**
   * Perform scene rendering.
   * @param context - Render context
   * @param cubeFace - Render surface of cube texture
   * @param mipLevel - Set mip level the data want to write
   */
  render(context: RenderContext, cubeFace?: TextureCubeFace, mipLevel?: number) {
    const camera = this._camera;
    const opaqueQueue = this._opaqueQueue;
    const alphaTestQueue = this._alphaTestQueue;
    const transparentQueue = this._transparentQueue;

    camera.engine._spriteMaskManager.clear();

    opaqueQueue.clear();
    alphaTestQueue.clear();
    transparentQueue.clear();
    this._allSpriteMasks.length = 0;

    camera.engine._componentsManager.callRender(context);
    opaqueQueue.sort(RenderQueue._compareFromNearToFar);
    alphaTestQueue.sort(RenderQueue._compareFromNearToFar);
    transparentQueue.sort(RenderQueue._compareFromFarToNear);

    // switch
    this._preRenderTarget = this._preRenderTarget0;
    for (let i = 0, len = this._renderPassArray.length; i < len; i++) {
      this._drawRenderPass(this._renderPassArray[i], camera, i === len - 1, cubeFace, mipLevel);

      // switch
      this._preRenderTarget =
        this._preRenderTarget === this._preRenderTarget0 ? this._preRenderTarget1 : this._preRenderTarget0;
    }
  }

  private _drawRenderPass(
    pass: RenderPass,
    camera: Camera,
    isLastPass: boolean,
    cubeFace?: TextureCubeFace,
    mipLevel?: number
  ) {
    const curRenderTarget =
      this._preRenderTarget === this._preRenderTarget0 ? this._preRenderTarget1 : this._preRenderTarget0;

    const queueData = {
      opaqueQueue: this._opaqueQueue,
      alphaTestQueue: this._alphaTestQueue,
      transparentQueue: this._transparentQueue,
    };

    pass.preRender(camera, queueData, this._preRenderTarget);

    if (pass.enabled) {
      const { engine, scene } = camera;
      const { background } = scene;
      const rhi = engine._hardwareRenderer;

      const renderTarget = isLastPass || pass.forceRenderCamera ? camera.renderTarget : curRenderTarget;
      rhi.activeRenderTarget(renderTarget, camera, mipLevel); // change viewport with mip level
      renderTarget?._setRenderTargetInfo(cubeFace, mipLevel);
      const clearFlags = pass.clearFlags ?? camera.clearFlags;
      const color = pass.clearColor ?? background.solidColor;
      if (clearFlags !== CameraClearFlags.None) {
        rhi.clearRenderTarget(camera.engine, clearFlags, color);
      }

      if (pass.renderOverride) {
        pass.render(camera, queueData, this._preRenderTarget);
      } else {
        this._opaqueQueue.render(camera, pass.replaceMaterial, pass.mask);
        this._alphaTestQueue.render(camera, pass.replaceMaterial, pass.mask);
        if (camera.clearFlags === CameraClearFlags.DepthColor) {
          if (background.mode === BackgroundMode.Sky) {
            this._drawSky(engine, camera, background.sky);
          } else if (background.mode === BackgroundMode.Texture && background.texture) {
            this._drawBackgroundTexture(engine, background);
          }
        }
        this._transparentQueue.render(camera, pass.replaceMaterial, pass.mask);
      }

      renderTarget?._blitRenderTarget();
      renderTarget?.generateMipmaps();
    }

    pass.postRender(camera, queueData, this._preRenderTarget);
  }

  /**
   * Push a render element to the render queue.
   * @param element - Render element
   */
  pushPrimitive(element: RenderElement | SpriteElement) {
    const renderQueueType = element.material.renderQueueType;

    if (renderQueueType > (RenderQueueType.Transparent + RenderQueueType.AlphaTest) >> 1) {
      this._transparentQueue.pushPrimitive(element);
    } else if (renderQueueType > (RenderQueueType.AlphaTest + RenderQueueType.Opaque) >> 1) {
      this._alphaTestQueue.pushPrimitive(element);
    } else {
      this._opaqueQueue.pushPrimitive(element);
    }
  }

  private _drawBackgroundTexture(engine: Engine, background: Background) {
    const rhi = engine._hardwareRenderer;
    const { _backgroundTextureMaterial, canvas } = engine;
    const mesh = background._mesh;

    if (
      (this._lastCanvasSize.x !== canvas.width || this._lastCanvasSize.y !== canvas.height) &&
      background._textureFillMode !== BackgroundTextureFillMode.Fill
    ) {
      this._lastCanvasSize.setValue(canvas.width, canvas.height);
      background._resizeBackgroundTexture();
    }

    const program = _backgroundTextureMaterial.shader._getShaderProgram(engine, Shader._compileMacros);
    program.bind();
    program.uploadAll(program.materialUniformBlock, _backgroundTextureMaterial.shaderData);
    program.uploadUnGroupTextures();

    _backgroundTextureMaterial.renderState._apply(engine, false);
    rhi.drawPrimitive(mesh, mesh.subMesh, program);
  }

  private _drawSky(engine: Engine, camera: Camera, sky: Sky): void {
    const { material, mesh, _matrix } = sky;
    if (!material) {
      Logger.warn('The material of sky is not defined.');
      return;
    }
    if (!mesh) {
      Logger.warn('The mesh of sky is not defined.');
      return;
    }

    const rhi = engine._hardwareRenderer;
    const { shaderData, shader, renderState } = material;

    const compileMacros = Shader._compileMacros;
    ShaderMacroCollection.unionCollection(camera._globalShaderMacro, shaderData._macroCollection, compileMacros);

    const { viewMatrix, projectionMatrix } = camera;
    viewMatrix.cloneTo(_matrix);
    const e = _matrix.elements;
    e[12] = e[13] = e[14] = 0;
    Matrix.multiply(projectionMatrix, _matrix, _matrix);
    shaderData.setMatrix('u_mvpNoscale', _matrix);

    const program = shader._getShaderProgram(engine, compileMacros);
    program.bind();
    program.groupingOtherUniformBlock();
    program.uploadAll(program.materialUniformBlock, shaderData);
    program.uploadUnGroupTextures();

    renderState._apply(engine, false);
    rhi.drawPrimitive(mesh, mesh.subMesh, program);
  }
}

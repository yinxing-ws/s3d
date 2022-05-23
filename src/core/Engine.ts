import { ColorSpace } from '.';
import { ResourceManager } from './asset/ResourceManager';
import { Event, EventDispatcher, Logger, Time } from './base';
import { Canvas } from './Canvas';
import { ComponentsManager } from './ComponentsManager';
import { EngineFeature } from './EngineFeature';
import { EngineSettings } from './EngineSettings';
import { Entity } from './Entity';
import { FeatureManager } from './FeatureManager';
import { RenderQueueType } from './material/enums/RenderQueueType';
import { Material } from './material/Material';
import { IHardwareRenderer } from './renderingHardwareInterface/IHardwareRenderer';
import { ClassPool } from './RenderPipeline/ClassPool';
import { RenderContext } from './RenderPipeline/RenderContext';
import { RenderElement } from './RenderPipeline/RenderElement';
import { SpriteElement } from './RenderPipeline/SpriteElement';
import { SpriteMaskElement } from './RenderPipeline/SpriteMaskElement';
import { SpriteMaskManager } from './RenderPipeline/SpriteMaskManager';
import { Scene } from './Scene';
import { SceneManager } from './SceneManager';
import { CompareFunction } from './shader';
import { BlendFactor } from './shader/enums/BlendFactor';
import { BlendOperation } from './shader/enums/BlendOperation';
import { ColorWriteMask } from './shader/enums/ColorWriteMask';
import { CullMode } from './shader/enums/CullMode';
import { Shader } from './shader/Shader';
import { ShaderMacro } from './shader/ShaderMacro';
import { ShaderMacroCollection } from './shader/ShaderMacroCollection';
import { ShaderPool } from './shader/ShaderPool';
import { ShaderProgramPool } from './shader/ShaderProgramPool';
import { RenderState } from './shader/state/RenderState';
import {
  Texture2D,
  TextureCubeFace,
  TextureCubeMap,
  TextureFormat,
} from './texture';

/** TODO: delete */
const engineFeatureManager = new FeatureManager<EngineFeature>();
ShaderPool.init();

/**
 * Engine.
 */
export class Engine extends EventDispatcher {
  /** @internal */
  static _gammaMacro: ShaderMacro = Shader.getMacroByName(
    'OASIS_COLORSPACE_GAMMA'
  );

  _componentsManager: ComponentsManager = new ComponentsManager();
  _hardwareRenderer: IHardwareRenderer;
  _lastRenderState: RenderState = new RenderState();
  _renderElementPool: ClassPool<RenderElement> = new ClassPool(RenderElement);
  _spriteElementPool: ClassPool<SpriteElement> = new ClassPool(SpriteElement);
  _spriteMaskElementPool: ClassPool<SpriteMaskElement> = new ClassPool(
    SpriteMaskElement
  );
  _spriteDefaultMaterial: Material;
  _spriteMaskDefaultMaterial: Material;
  _renderContext: RenderContext = new RenderContext();

  /* @internal */
  _whiteTexture2D: Texture2D;
  /* @internal */
  _whiteTextureCube: TextureCubeMap;
  /* @internal */
  _backgroundTextureMaterial: Material;
  /* @internal */
  _renderCount: number = 0;
  /* @internal */
  _shaderProgramPools: ShaderProgramPool[] = [];
  /** @internal */
  _spriteMaskManager: SpriteMaskManager;
  /** @internal */
  _macroCollection: ShaderMacroCollection = new ShaderMacroCollection();

  protected _canvas: Canvas;

  private _settings: EngineSettings = {};
  private _resourceManager: ResourceManager = new ResourceManager(this);
  private _sceneManager: SceneManager = new SceneManager(this);
  private _vSyncCount: number = 1;
  private _targetFrameRate: number = 60;
  private _time: Time = new Time();
  private _isPaused: boolean = true;
  private _requestId: number;
  private _timeoutId: number;
  private _vSyncCounter: number = 1;
  private _targetFrameInterval: number = 1000 / 60;

  private _animate = () => {
    if (this._vSyncCount) {
      this._requestId = requestAnimationFrame(this._animate);
      if (this._vSyncCounter++ % this._vSyncCount === 0) {
        this.update();
        this._vSyncCounter = 1;
      }
    } else {
      this._timeoutId = window.setTimeout(
        this._animate,
        this._targetFrameInterval
      );
      this.update();
    }
  };

  /**
   * Settings of Engine.
   */
  get settings(): Readonly<EngineSettings> {
    return this._settings;
  }

  /**
   * The canvas to use for rendering.
   */
  get canvas(): Canvas {
    return this._canvas;
  }

  /**
   * Get the resource manager.
   */
  get resourceManager(): ResourceManager {
    return this._resourceManager;
  }

  /**
   * Get the scene manager.
   */
  get sceneManager(): SceneManager {
    return this._sceneManager;
  }

  /**
   * Get the Time class.
   */
  get time(): Time {
    return this._time;
  }

  /**
   * Whether the engine is paused.
   */
  get isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * The number of vertical synchronization means the number of vertical blanking for one frame.
   * @remarks 0 means that the vertical synchronization is turned off.
   */
  get vSyncCount(): number {
    return this._vSyncCount;
  }

  set vSyncCount(value: number) {
    this._vSyncCount = Math.max(0, Math.floor(value));
  }

  /**
   * Set the target frame rate you want to achieve.
   * @remarks
   * It only takes effect when vSyncCount = 0 (ie, vertical synchronization is turned off).
   * The larger the value, the higher the target frame rate, Number.POSITIVE_INFINITY represents the infinite target frame rate.
   */
  get targetFrameRate(): number {
    return this._targetFrameRate;
  }

  set targetFrameRate(value: number) {
    value = Math.max(0.000001, value);
    this._targetFrameRate = value;
    this._targetFrameInterval = 1000 / value;
  }

  /**
   * Create engine.
   * @param canvas - The canvas to use for rendering
   * @param hardwareRenderer - Graphics API renderer
   */
  constructor(
    canvas: Canvas,
    hardwareRenderer: IHardwareRenderer,
    settings?: EngineSettings
  ) {
    super();
    this._hardwareRenderer = hardwareRenderer;
    this._hardwareRenderer.init(canvas);
    this._canvas = canvas;
    // @todo delete
    engineFeatureManager.addObject(this);
    this._sceneManager.activeScene = new Scene(this, 'DefaultScene');

    this._spriteMaskManager = new SpriteMaskManager(this);
    this._spriteDefaultMaterial = this._createSpriteMaterial();
    this._spriteMaskDefaultMaterial = this._createSpriteMaskMaterial();

    const whitePixel = new Uint8Array([255, 255, 255, 255]);

    const whiteTexture2D = new Texture2D(
      this,
      1,
      1,
      TextureFormat.R8G8B8A8,
      false
    );
    whiteTexture2D.setPixelBuffer(whitePixel);
    whiteTexture2D.isGCIgnored = true;

    const whiteTextureCube = new TextureCubeMap(
      this,
      1,
      TextureFormat.R8G8B8A8,
      false
    );
    whiteTextureCube.setPixelBuffer(TextureCubeFace.PositiveX, whitePixel);
    whiteTextureCube.setPixelBuffer(TextureCubeFace.NegativeX, whitePixel);
    whiteTextureCube.setPixelBuffer(TextureCubeFace.PositiveY, whitePixel);
    whiteTextureCube.setPixelBuffer(TextureCubeFace.NegativeY, whitePixel);
    whiteTextureCube.setPixelBuffer(TextureCubeFace.PositiveZ, whitePixel);
    whiteTextureCube.setPixelBuffer(TextureCubeFace.NegativeZ, whitePixel);
    whiteTextureCube.isGCIgnored = true;

    this._whiteTexture2D = whiteTexture2D;
    this._whiteTextureCube = whiteTextureCube;

    this._backgroundTextureMaterial = new Material(
      this,
      Shader.find('background-texture')
    );
    this._backgroundTextureMaterial.isGCIgnored = true;
    this._backgroundTextureMaterial.renderState.depthState.compareFunction =
      CompareFunction.LessEqual;

    const colorSpace = settings?.colorSpace || ColorSpace.Linear;
    colorSpace === ColorSpace.Gamma &&
      this._macroCollection.enable(Engine._gammaMacro);
    this._settings.colorSpace = colorSpace;
  }

  /**
   * Create an entity.
   * @param name - The name of the entity
   * @returns Entity
   */
  createEntity(name?: string): Entity {
    return new Entity(this, name);
  }

  /**
   * Pause the engine.
   */
  pause(): void {
    this._isPaused = true;
    cancelAnimationFrame(this._requestId);
    clearTimeout(this._timeoutId);
  }

  /**
   * Resume the engine.
   */
  resume(): void {
    if (!this._isPaused) return;
    this._isPaused = false;
    this.time.reset();
    requestAnimationFrame(this._animate);
  }

  /**
   * Update the engine loop manually. If you call engine.run(), you generally don't need to call this function.
   */
  update(): void {
    const time = this._time;
    const deltaTime = time.deltaTime;

    time.tick();
    this._renderElementPool.resetPool();
    this._spriteElementPool.resetPool();
    this._spriteMaskElementPool.resetPool();

    engineFeatureManager.callFeatureMethod(this, 'preTick', [
      this,
      this._sceneManager._activeScene,
    ]);

    const scene = this._sceneManager._activeScene;
    const componentsManager = this._componentsManager;
    if (scene) {
      scene._activeCameras.sort(
        (camera1, camera2) => camera1.priority - camera2.priority
      );

      componentsManager.callScriptOnStart();
      componentsManager.callScriptOnUpdate(deltaTime);
      componentsManager.callAnimationUpdate(deltaTime);
      componentsManager.callScriptOnLateUpdate(deltaTime);

      this._render(scene);
    }

    this._componentsManager.callComponentDestroy();

    engineFeatureManager.callFeatureMethod(this, 'postTick', [
      this,
      this._sceneManager._activeScene,
    ]);
  }

  /**
   * Execution engine loop.
   */
  run(): void {
    // @todo: delete
    engineFeatureManager.callFeatureMethod(this, 'preLoad', [this]);
    this.resume();
    this.trigger(new Event('run', this));
  }

  /**
   * Destroy engine.
   */
  destroy(): void {
    if (this._sceneManager) {
      this._whiteTexture2D.destroy(true);
      this._whiteTextureCube.destroy(true);
      this.trigger(new Event('shutdown', this));
      engineFeatureManager.callFeatureMethod(this, 'shutdown', [this]);

      // -- cancel animation
      this.pause();

      this._animate = null;

      this._sceneManager._activeScene.destroy();
      this._resourceManager._destroy();
      // If engine destroy, callComponentDestroy() maybe will not call anymore.
      this._componentsManager.callComponentDestroy();
      this._sceneManager = null;
      this._resourceManager = null;

      this._canvas = null;

      this.features = [];
      this._time = null;

      // delete mask manager
      this._spriteMaskManager.destroy();

      // todo: delete
      (engineFeatureManager as any)._objects = [];
      this.removeAllEventListeners();
    }
  }

  /**
   * @internal
   */
  _getShaderProgramPool(shader: Shader): ShaderProgramPool {
    const index = shader._shaderId;
    const shaderProgramPools = this._shaderProgramPools;
    let pool = shaderProgramPools[index];
    if (!pool) {
      const length = index + 1;
      if (length < shaderProgramPools.length) {
        shaderProgramPools.length = length;
      }
      shaderProgramPools[index] = pool = new ShaderProgramPool();
    }
    return pool;
  }

  _render(scene: Scene): void {
    const cameras = scene._activeCameras;
    const componentsManager = this._componentsManager;
    const deltaTime = this.time.deltaTime;
    componentsManager.callRendererOnUpdate(deltaTime);

    scene._updateShaderData();

    if (cameras.length > 0) {
      for (let i = 0, l = cameras.length; i < l; i++) {
        const camera = cameras[i];
        const cameraEntity = camera.entity;
        if (camera.enabled && cameraEntity.isActiveInHierarchy) {
          componentsManager.callCameraOnBeginRender(camera);
          Scene.sceneFeatureManager.callFeatureMethod(scene, 'preRender', [
            scene,
            camera,
          ]); //TODO: will be removed
          camera.render();
          Scene.sceneFeatureManager.callFeatureMethod(scene, 'postRender', [
            scene,
            camera,
          ]); //TODO: will be removed
          componentsManager.callCameraOnEndRender(camera);
        }
      }
    } else {
      Logger.debug('NO active camera.');
    }
  }

  private _createSpriteMaterial(): Material {
    const material = new Material(this, Shader.find('Sprite'));
    const renderState = material.renderState;
    const target = renderState.blendState.targetBlendState;
    target.enabled = true;
    target.sourceColorBlendFactor = BlendFactor.SourceAlpha;
    target.destinationColorBlendFactor = BlendFactor.OneMinusSourceAlpha;
    target.sourceAlphaBlendFactor = BlendFactor.One;
    target.destinationAlphaBlendFactor = BlendFactor.OneMinusSourceAlpha;
    target.colorBlendOperation = target.alphaBlendOperation =
      BlendOperation.Add;
    renderState.depthState.writeEnabled = false;
    renderState.rasterState.cullMode = CullMode.Off;
    material.renderQueueType = RenderQueueType.Transparent;
    material.isGCIgnored = true;
    return material;
  }

  private _createSpriteMaskMaterial(): Material {
    const material = new Material(this, Shader.find('SpriteMask'));
    const renderState = material.renderState;
    renderState.blendState.targetBlendState.colorWriteMask =
      ColorWriteMask.None;
    renderState.rasterState.cullMode = CullMode.Off;
    renderState.stencilState.enabled = true;
    renderState.depthState.enabled = false;
    material.isGCIgnored = true;
    return material;
  }

  //-----------------------------------------@deprecated-----------------------------------

  findFeature(Feature) {
    return engineFeatureManager.findFeature(this, Feature);
  }

  static registerFeature(Feature: new () => EngineFeature): void {
    engineFeatureManager.registerFeature(Feature);
  }

  features: EngineFeature[] = [];
}

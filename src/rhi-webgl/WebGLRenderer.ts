import {
  Camera, CameraClearFlags, Canvas,
  ColorWriteMask,
  Engine,
  GLCapabilityType,
  IHardwareRenderer,
  IPlatformRenderColorTexture,
  IPlatformRenderDepthTexture,
  IPlatformRenderTarget,
  IPlatformTexture2D,
  IPlatformTextureCubeMap,
  Logger,
  Mesh,
  RenderColorTexture,
  RenderDepthTexture,
  RenderTarget,
  SubMesh,
  Texture2D,
  TextureCubeMap
} from "src/core";
import { IPlatformPrimitive } from "src/design";
import { Color, Vector4 } from "src/math";
import { GLCapability } from "./GLCapability";
import { GLExtensions } from "./GLExtensions";
import { GLPrimitive } from "./GLPrimitive";
import { GLRenderColorTexture } from "./GLRenderColorTexture";
import { GLRenderDepthTexture } from "./GLRenderDepthTexture";
import { GLRenderStates } from "./GLRenderStates";
import { GLRenderTarget } from "./GLRenderTarget";
import { GLTexture } from "./GLTexture";
import { GLTexture2D } from "./GLTexture2D";
import { GLTextureCubeMap } from "./GLTextureCubeMap";
import { WebGLExtension } from "./type";
import { WebCanvas } from "./WebCanvas";

/**
 * WebGL mode.
 */
export enum WebGLMode {
  /** Auto, use WebGL2.0 if support, or will fallback to WebGL1.0. */
  Auto = 0,
  /** WebGL2.0. */
  WebGL2 = 1,
  /** WebGL1.0, */
  WebGL1 = 2
}

/**
 * WebGL renderer options.
 */
export interface WebGLRendererOptions extends WebGLContextAttributes {
  /** WebGL mode.*/
  webGLMode?: WebGLMode;
}

/**
 * WebGL renderer, including WebGL1.0 and WebGL2.0.
 */
export class WebGLRenderer implements IHardwareRenderer {
  _currentBind: any;

  private _options: WebGLRendererOptions;
  private _gl: (WebGLRenderingContext & WebGLExtension) | WebGL2RenderingContext;
  private _renderStates;
  private _extensions;
  private _capability: GLCapability;
  private _isWebGL2: boolean;

  private _activeTextureID: number;
  private _activeTextures: GLTexture[] = new Array(32);

  // cache value
  private _lastViewport: Vector4 = new Vector4(null, null, null, null);
  private _lastClearColor: Color = new Color(null, null, null, null);

  get isWebGL2() {
    return this._isWebGL2;
  }

  /**
   * GL Context
   * @member {WebGLRenderingContext}
   */
  get gl() {
    return this._gl;
  }

  get renderStates(): GLRenderStates {
    return this._renderStates;
  }

  get capability(): GLCapability {
    return this._capability;
  }

  get canIUseMoreJoints() {
    return this.capability.canIUseMoreJoints;
  }

  constructor(options: WebGLRendererOptions = {}) {
    this._options = options;
  }

  init(canvas: Canvas) {
    const option = this._options;
    option.alpha === undefined && (option.alpha = false);
    option.stencil === undefined && (option.stencil = true);

    const webCanvas = (canvas as WebCanvas)._webCanvas;
    const webGLMode = option.webGLMode || WebGLMode.Auto;
    let gl: (WebGLRenderingContext & WebGLExtension) | WebGL2RenderingContext;

    if (webGLMode == WebGLMode.Auto || webGLMode == WebGLMode.WebGL2) {
      gl = webCanvas.getContext("webgl2", option);
      if (!gl && webCanvas instanceof HTMLCanvasElement) {
        gl = <WebGL2RenderingContext>webCanvas.getContext("experimental-webgl2", option);
      }
      this._isWebGL2 = true;

      // Prevent weird browsers to lie (such as safari!)
      if (gl && !(<WebGL2RenderingContext>gl).deleteQuery) {
        this._isWebGL2 = false;
      }
    }

    if (!gl) {
      if (webGLMode == WebGLMode.Auto || webGLMode == WebGLMode.WebGL1) {
        gl = <WebGLRenderingContext & WebGLExtension>webCanvas.getContext("webgl", option);
        if (!gl && webCanvas instanceof HTMLCanvasElement) {
          gl = <WebGLRenderingContext & WebGLExtension>webCanvas.getContext("experimental-webgl", option);
        }
        this._isWebGL2 = false;
      }
    }

    if (!gl) {
      throw new Error("Get GL Context FAILED.");
    }

    this._gl = gl;
    this._activeTextureID = gl.TEXTURE0;
    this._renderStates = new GLRenderStates(gl);
    this._extensions = new GLExtensions(this);
    this._capability = new GLCapability(this);
    // Make sure the active texture in gl context is on default, because gl context may be used in other webgl renderer.
    gl.activeTexture(gl.TEXTURE0);

    this._options = null;
  }

  createPlatformPrimitive(primitive: Mesh): IPlatformPrimitive {
    return new GLPrimitive(this, primitive);
  }

  createPlatformTexture2D(texture2D: Texture2D): IPlatformTexture2D {
    return new GLTexture2D(this, texture2D);
  }

  createPlatformTextureCubeMap(textureCube: TextureCubeMap): IPlatformTextureCubeMap {
    return new GLTextureCubeMap(this, textureCube);
  }

  createPlatformRenderColorTexture(texture: RenderColorTexture): IPlatformRenderColorTexture {
    return new GLRenderColorTexture(this, texture);
  }

  createPlatformRenderDepthTexture(texture: RenderDepthTexture): IPlatformRenderDepthTexture {
    return new GLRenderDepthTexture(this, texture);
  }

  createPlatformRenderTarget(target: RenderTarget): IPlatformRenderTarget {
    return new GLRenderTarget(this, target);
  }

  requireExtension(ext) {
    return this._extensions.requireExtension(ext);
  }

  canIUse(capabilityType: GLCapabilityType) {
    return this.capability.canIUse(capabilityType);
  }

  canIUseCompressedTextureInternalFormat(type: number) {
    return this.capability.canIUseCompressedTextureInternalFormat(type);
  }

  viewport(x: number, y: number, width: number, height: number): void {
    // gl.enable(gl.SCISSOR_TEST);
    // gl.scissor(x, transformY, width, height);
    const gl = this._gl;
    const lv = this._lastViewport;

    if (x !== lv.x || y !== lv.y || width !== lv.z || height !== lv.w) {
      gl.viewport(x, y, width, height);
      lv.setValue(x, y, width, height);
    }
  }

  colorMask(r, g, b, a) {
    this._gl.colorMask(r, g, b, a);
  }

  clearRenderTarget(
    engine: Engine,
    clearFlags: CameraClearFlags.Depth | CameraClearFlags.DepthColor,
    clearColor: Color
  ) {
    const gl = this._gl;
    const {
      blendState: { targetBlendState },
      depthState,
      stencilState
    } = engine._lastRenderState;

    let clearFlag = gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT;

    if (clearFlags === CameraClearFlags.DepthColor) {
      clearFlag |= gl.COLOR_BUFFER_BIT;

      const lc = this._lastClearColor;
      const { r, g, b, a } = clearColor;

      if (clearColor && (r !== lc.r || g !== lc.g || b !== lc.b || a !== lc.a)) {
        gl.clearColor(r, g, b, a);
        lc.setValue(r, g, b, a);
      }

      if (targetBlendState.colorWriteMask !== ColorWriteMask.All) {
        gl.colorMask(true, true, true, true);
        targetBlendState.colorWriteMask = ColorWriteMask.All;
      }
    }

    if (depthState.writeEnabled !== true) {
      gl.depthMask(true);
      depthState.writeEnabled = true;
    }

    if (stencilState.writeMask !== 0xff) {
      gl.stencilMask(0xff);
      stencilState.writeMask = 0xff;
    }

    gl.clear(clearFlag);
  }

  drawPrimitive(primitive: Mesh, subPrimitive: SubMesh, shaderProgram: any) {
    // todo: VAO not support morph animation
    if (primitive) {
      //@ts-ignore
      primitive._draw(shaderProgram, subPrimitive);
    } else {
      Logger.error("draw primitive failed.");
    }
  }

  activeRenderTarget(renderTarget: RenderTarget, camera: Camera, mipLevel: number) {
    const gl = this._gl;
    if (renderTarget) {
      /** @ts-ignore */
      (renderTarget._platformRenderTarget as GLRenderTarget)?._activeRenderTarget();
      const { width, height } = renderTarget;
      this.viewport(0, 0, width >> mipLevel, height >> mipLevel);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      const viewport = camera.viewport;
      const { drawingBufferWidth, drawingBufferHeight } = gl;
      const width = drawingBufferWidth * viewport.z;
      const height = drawingBufferHeight * viewport.w;
      const x = viewport.x * drawingBufferWidth;
      const y = drawingBufferHeight - viewport.y * drawingBufferHeight - height;

      this.viewport(x, y, width, height);
    }
  }

  destroy() {}

  activeTexture(textureID: number): void {
    if (this._activeTextureID !== textureID) {
      this._gl.activeTexture(textureID);
      this._activeTextureID = textureID;
    }
  }

  bindTexture(texture: GLTexture): void {
    const index = this._activeTextureID - this._gl.TEXTURE0;
    if (this._activeTextures[index] !== texture) {
      this._gl.bindTexture(texture._target, texture._glTexture);
      this._activeTextures[index] = texture;
    }
  }
}

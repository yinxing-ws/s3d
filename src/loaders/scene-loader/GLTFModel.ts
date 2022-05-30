import { Animator, AnimatorController, AnimatorState, Component, Entity, UpdateFlag } from "../core";
import { GLTFResource } from "../gltf/GLTFResource";

/**
 * @deprecated
 * Temporarily only for editor use.
 * Remove when editor finish change from gltf to prefab.
 */
export class GLTFModel extends Component {
  private _animatorController: AnimatorController;
  private _speed: number = 1.0;
  private _animator: Animator;
  private _asset: GLTFResource;
  private _glTFEntity: Entity;
  private _clipPreview: string;
  private _hasBuiltNode: boolean = false;
  private _controllerUpdateFlag: UpdateFlag;

  get asset() {
    return this._asset;
  }

  set asset(value: GLTFResource) {
    const { _animatorController: animatorController, _speed: speed } = this;
    const entity = this._glTFEntity;
    if (value && value.defaultSceneRoot === this._glTFEntity) {
      return;
    }
    if (!this._hasBuiltNode) {
      entity.clearChildren();
      if (value !== null) {
        entity?.destroy();
        const gltfEntity = value.defaultSceneRoot.clone();
        this._animator = gltfEntity.getComponent(Animator);
        this.entity.addChild(gltfEntity);
        gltfEntity.isActive = this.enabled;
        this._glTFEntity = gltfEntity;
      }
    }
    if (animatorController) {
      this._animator.animatorController = animatorController;
      this._animator.speed = speed;
      this._playState();
    }
    this._asset = value;
  }

  get animatorController(): AnimatorController {
    return this._animatorController;
  }

  set animatorController(animatorController: AnimatorController) {
    const { _animator: animator } = this;
    if (animatorController !== this._animatorController) {
      this._controllerUpdateFlag && this._controllerUpdateFlag.destroy();
      // @ts-ignore
      this._controllerUpdateFlag = animatorController && animatorController._registerChangeFlag();
      this._animatorController = animatorController;
      if (animator) {
        animator.animatorController = animatorController;
        this._playState();
      }
    }
  }

  get speed(): number {
    return this._speed;
  }

  set speed(speed: number) {
    const { _animator: animator } = this;
    this._speed = speed;
    if (animator) {
      animator.speed = speed;
      this._playState();
    }
  }

  get animator() {
    return this._animator;
  }

  get clipPreview() {
    return this._clipPreview;
  }

  set clipPreview(value: string) {
    if (this._animator) {
      if (value) {
        if (value === "_default") {
          this._playDefaultState();
        } else {
          this._animator.play(value, 0);
        }
      } else {
        // @ts-ignore
        this._animator._reset();
      }
    }
    this._clipPreview = value;
  }

  constructor(entity) {
    super(entity);
  }

  /**
   * Init.
   * @param props - Init props
   */
  init(props): void {
    const { asset = null, speed, animatorController, clipPreview, isClone } = props;
    if (isClone) {
      const rootName = (props as any).gltfRootName;
      if (rootName) {
        this._glTFEntity = this.entity.findByName(rootName);
      }
    }
    if (!this._glTFEntity) {
      const rootName = `GLTF-${Date.now()}`;
      (props as any).gltfRootName = rootName;
      this._glTFEntity = this.entity.createChild(rootName);
      this._hasBuiltNode = false;
    } else {
      this._hasBuiltNode = true;
    }

    this.asset = asset;
    this.animatorController = animatorController;
    this.speed = speed;
    this.clipPreview = clipPreview;
  }

  update() {
    if (this._animator) {
      if (this._controllerUpdateFlag?.flag) {
        this._playState();
      }
    }
  }

  /**
   * @override
   */
  _onEnable(): void {
    this._glTFEntity && (this._glTFEntity.isActive = true);
    this.engine._componentsManager.addOnUpdateAnimations(this);
  }

  /**
   * @override
   */
  _onDisable(): void {
    this._glTFEntity && (this._glTFEntity.isActive = false);
    this.engine._componentsManager.removeOnUpdateAnimations(this);
  }

  _playState() {
    const playStateName = this._clipPreview;
    if (playStateName) {
      if (playStateName === "_default") {
        this._playDefaultState();
      } else {
        this._animator.play(playStateName, 0);
      }
    } else {
       // @ts-ignore
      this._animator._reset();
    }
    if (this._controllerUpdateFlag?.flag) {
      this._controllerUpdateFlag.flag = false;
    }
  }

  _playDefaultState() {
    const { _animatorController: animatorController, _animator: animator } = this;
    if (!animator) return;
    if (animatorController) {
      const { layers } = animatorController;
      for (let i = 0, length = layers.length; i < length; ++i) {
        //@ts-ignore
        const defaultState = layers[i]?.stateMachine?._defaultState;
        const defaultStateName = defaultState?.name;
        if (defaultStateName) {
          animator.play(defaultStateName, i);
        } else {
           // @ts-ignore
          animator._reset();
        }
        if (this._controllerUpdateFlag?.flag) {
          this._controllerUpdateFlag.flag = false;
        }
      }
    }
  }
}

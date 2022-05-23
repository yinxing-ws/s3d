import { AnimationClip } from "./AnimationClip";
import { AnimatorStateTransition } from "./AnimatorTransition";
import { WrapMode } from "./enums/WrapMode";
import { StateMachineScript } from "./StateMachineScript";

/**
 * States are the basic building blocks of a state machine. Each state contains a AnimationClip which will play while the character is in that state.
 */
export class AnimatorState {
  /** The speed of the clip. 1 is normal speed, default 1. */
  speed: number = 1.0;
  /** The wrap mode used in the state. */
  wrapMode: WrapMode = WrapMode.Loop;

  /** @internal */
  _onStateEnterScripts: StateMachineScript[] = [];
  /** @internal */
  _onStateUpdateScripts: StateMachineScript[] = [];
  /** @internal */
  _onStateExitScripts: StateMachineScript[] = [];

  private _clipStartTime: number = 0;
  private _clipEndTime: number = 1;
  private _clip: AnimationClip;
  private _transitions: AnimatorStateTransition[] = [];

  /**
   * The transitions that are going out of the state.
   */
  get transitions(): Readonly<AnimatorStateTransition[]> {
    return this._transitions;
  }

  /**
   * The clip that is being played by this animator state.
   */
  get clip(): AnimationClip {
    return this._clip;
  }

  set clip(clip: AnimationClip) {
    this._clip = clip;
    this._clipEndTime = Math.min(this._clipEndTime, 1);
  }

  /**
   * The start time of the clip, the range is 0 to 1, default is 0.
   */
  get clipStartTime() {
    return this._clipStartTime;
  }

  set clipStartTime(time: number) {
    this._clipStartTime = Math.max(time, 0);
  }

  /**
   * The end time of the clip, the range is 0 to 1, default is 1.
   */
  get clipEndTime() {
    return this._clipEndTime;
  }

  set clipEndTime(time: number) {
    this._clipEndTime = Math.min(time, 1);
  }

  /**
   * @param name - The state's name
   */
  constructor(public readonly name: string) {}

  /**
   * Add an outgoing transition to the destination state.
   * @param transition - The transition
   */
  addTransition(transition: AnimatorStateTransition): void {
    this._transitions.push(transition);
  }

  /**
   * Remove a transition from the state.
   * @param transition - The transition
   */
  removeTransition(transition: AnimatorStateTransition): void {
    const index = this._transitions.indexOf(transition);
    index !== -1 && this._transitions.splice(index, 1);
  }

  /**
   * Adds a state machine script class of type T to the AnimatorState.
   * @param scriptType - The state machine script class of type T
   */
  addStateMachineScript<T extends StateMachineScript>(scriptType: new () => T): T {
    const script = new scriptType();
    script._state = this;

    const { prototype } = StateMachineScript;
    if (script.onStateEnter !== prototype.onStateEnter) {
      this._onStateEnterScripts.push(script);
    }
    if (script.onStateUpdate !== prototype.onStateUpdate) {
      this._onStateUpdateScripts.push(script);
    }
    if (script.onStateExit !== prototype.onStateExit) {
      this._onStateExitScripts.push(script);
    }

    return script;
  }

  /**
   * Clears all transitions from the state.
   */
  clearTransitions(): void {
    this._transitions.length = 0;
  }

  /**
   * @internal
   */
  _getDuration(): number {
    if (this.clip) {
      return (this._clipEndTime - this._clipStartTime) * this.clip.length;
    }
    return null;
  }

  /**
   * @internal
   */
  _removeStateMachineScript(script: StateMachineScript): void {
    const { prototype } = StateMachineScript;
    if (script.onStateEnter !== prototype.onStateEnter) {
      const index = this._onStateEnterScripts.indexOf(script);
      index !== -1 && this._onStateEnterScripts.splice(index, 1);
    }
    if (script.onStateUpdate !== prototype.onStateUpdate) {
      const index = this._onStateUpdateScripts.indexOf(script);
      index !== -1 && this._onStateUpdateScripts.splice(index, 1);
    }
    if (script.onStateExit !== prototype.onStateExit) {
      const index = this._onStateExitScripts.indexOf(script);
      index !== -1 && this._onStateExitScripts.splice(index, 1);
    }
  }
}

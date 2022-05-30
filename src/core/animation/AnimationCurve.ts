import { Quaternion, Vector2, Vector3, Vector4 } from "../../math";
import { InterpolableValueType } from "./enums/InterpolableValueType";
import { InterpolationType } from "./enums/InterpolationType";
import {
  FloatArrayKeyframe,
  FloatKeyframe,
  InterpolableValue,
  QuaternionKeyframe,
  UnionInterpolableKeyframe,
  Vector2Keyframe,
  Vector3Keyframe
} from "./KeyFrame";

/**
 * Store a collection of Keyframes that can be evaluated over time.
 */
export class AnimationCurve {
  /** All keys defined in the animation curve. */
  keys: UnionInterpolableKeyframe[] = [];
  /** The interpolationType of the animation curve. */
  interpolation: InterpolationType;

  /** @internal */
  _valueSize: number;
  /** @internal */
  _valueType: InterpolableValueType;

  private _currentValue: InterpolableValue;
  private _length: number = 0;
  private _currentIndex: number = 0;

  /**
   * Animation curve length in seconds.
   */
  get length(): number {
    return this._length;
  }

  /**
   * Add a new key to the curve.
   * @param key - The keyframe
   */
  addKey(key: UnionInterpolableKeyframe): void {
    const { time } = key;
    this.keys.push(key);
    if (time > this._length) {
      this._length = time;
    }

    if (!this._valueSize) {
      //CM: It's not reasonable to write here.
      if (typeof key.value == "number") {
        this._valueSize = 1;
        this._valueType = InterpolableValueType.Float;
        this._currentValue = 0;
      }
      if (key.value instanceof Vector2) {
        this._valueSize = 2;
        this._valueType = InterpolableValueType.Vector2;
        this._currentValue = new Vector2();
      }
      if (key.value instanceof Vector3) {
        this._valueSize = 3;
        this._valueType = InterpolableValueType.Vector3;
        this._currentValue = new Vector3();
      }
      if (key.value instanceof Vector4) {
        this._valueSize = 4;
        this._valueType = InterpolableValueType.Vector4;
        this._currentValue = new Vector4();
      }
      if (key.value instanceof Quaternion) {
        this._valueSize = 4;
        this._valueType = InterpolableValueType.Quaternion;
        this._currentValue = new Quaternion();
      }

      if (key.value instanceof Float32Array) {
        const size = key.value.length;
        this._valueSize = size;
        this._valueType = InterpolableValueType.FloatArray;
        this._currentValue = new Float32Array(size);
      }
    }
    this.keys.sort((a, b) => a.time - b.time);
  }

  /**
   * Evaluate the curve at time.
   * @param time - The time within the curve you want to evaluate
   */
  evaluate(time: number): InterpolableValue {
    const { keys, interpolation } = this;
    const { length } = this.keys;

    // Compute curIndex and nextIndex.
    let curIndex = this._currentIndex;

    // Reset loop.
    if (curIndex !== -1 && time < keys[curIndex].time) {
      curIndex = -1;
    }

    let nextIndex = curIndex + 1;
    while (nextIndex < length) {
      if (time < keys[nextIndex].time) {
        break;
      }
      curIndex++;
      nextIndex++;
    }
    this._currentIndex = curIndex;
    // Evaluate value.
    let value: InterpolableValue;
    if (curIndex === -1) {
      value = (<UnionInterpolableKeyframe>keys[0]).value;
    } else if (nextIndex === length) {
      value = (<UnionInterpolableKeyframe>keys[curIndex]).value;
    } else {
      // Time between first frame and end frame.
      const curFrameTime = keys[curIndex].time;
      const duration = keys[nextIndex].time - curFrameTime;
      const t = (time - curFrameTime) / duration;
      const dur = duration;

      switch (interpolation) {
        case InterpolationType.Linear:
          value = this._evaluateLinear(curIndex, nextIndex, t);
          break;
        case InterpolationType.Step:
          value = this._evaluateStep(nextIndex);
          break;
        case InterpolationType.CubicSpine:
        case InterpolationType.Hermite:
          value = this._evaluateHermite(curIndex, nextIndex, t, dur);
      }
    }
    return value;
  }

  /**
   * Removes the keyframe at index and inserts key.
   * @param index - The index of the key to move
   * @param key - The key to insert
   */
  moveKey(index: number, key: UnionInterpolableKeyframe): void {
    this.keys[index] = key;
  }

  /**
   * Removes a key.
   * @param index - The index of the key to remove
   */
  removeKey(index: number): void {
    this.keys.splice(index, 1);
    const { keys } = this;
    const count = this.keys.length;
    let newLength = 0;
    for (let i = count - 1; i >= 0; i--) {
      if (keys[i].time > length) {
        newLength = keys[i].time;
      }
    }
    this._length = newLength;
  }

  private _evaluateLinear(frameIndex: number, nextFrameIndex: number, t: number): InterpolableValue {
    const { _valueType, keys } = this;
    switch (_valueType) {
      case InterpolableValueType.Float:
        return (<FloatKeyframe>keys[frameIndex]).value * (1 - t) + (<FloatKeyframe>keys[nextFrameIndex]).value * t;
      case InterpolableValueType.FloatArray:
        const curValue = this._currentValue;
        const value = (<FloatArrayKeyframe>keys[frameIndex]).value;
        const nextValue = (<FloatArrayKeyframe>keys[nextFrameIndex]).value;
        for (let i = 0, n = value.length; i < n; i++) {
          curValue[i] = value[i] * (1 - t) + nextValue[i] * t;
        }
        return curValue;
      case InterpolableValueType.Vector2:
        Vector2.lerp(
          (<Vector2Keyframe>keys[frameIndex]).value,
          (<Vector2Keyframe>keys[nextFrameIndex]).value,
          t,
          <Vector2>this._currentValue
        );
        return this._currentValue;
      case InterpolableValueType.Vector3:
        Vector3.lerp(
          (<Vector3Keyframe>keys[frameIndex]).value,
          (<Vector3Keyframe>keys[nextFrameIndex]).value,
          t,
          <Vector3>this._currentValue
        );
        return this._currentValue;
      case InterpolableValueType.Quaternion:
        Quaternion.slerp(
          (<QuaternionKeyframe>keys[frameIndex]).value,
          (<QuaternionKeyframe>keys[nextFrameIndex]).value,
          t,
          <Quaternion>this._currentValue
        );
        return this._currentValue;
    }
  }

  private _evaluateStep(nextFrameIndex: number): InterpolableValue {
    const { _valueSize, keys } = this;
    if (_valueSize === 1) {
      return (<UnionInterpolableKeyframe>keys[nextFrameIndex]).value;
    } else {
      return (<UnionInterpolableKeyframe>keys[nextFrameIndex]).value;
    }
  }

  private _evaluateHermite(frameIndex: number, nextFrameIndex: number, t: number, dur: number): InterpolableValue {
    const { _valueSize, keys } = this;
    const curKey = keys[frameIndex];
    const nextKey = keys[nextFrameIndex];
    switch (_valueSize) {
      case 1: {
        const t0 = (<FloatKeyframe>curKey).outTangent,
          t1 = (<FloatKeyframe>nextKey).inTangent,
          p0 = (<FloatKeyframe>curKey).value,
          p1 = (<FloatKeyframe>nextKey).value;
        if (Number.isFinite(t0) && Number.isFinite(t1)) {
          const t2 = t * t;
          const t3 = t2 * t;
          const a = 2.0 * t3 - 3.0 * t2 + 1.0;
          const b = t3 - 2.0 * t2 + t;
          const c = t3 - t2;
          const d = -2.0 * t3 + 3.0 * t2;
          return a * p0 + b * t0 * dur + c * t1 * dur + d * p1;
        } else {
          return (<FloatKeyframe>curKey).value;
        }
      }
      case 2: {
        const p0 = (<Vector2Keyframe>curKey).value;
        const tan0 = (<Vector2Keyframe>curKey).outTangent;
        const p1 = (<Vector2Keyframe>nextKey).value;
        const tan1 = (<Vector2Keyframe>nextKey).inTangent;

        const t2 = t * t;
        const t3 = t2 * t;
        const a = 2.0 * t3 - 3.0 * t2 + 1.0;
        const b = t3 - 2.0 * t2 + t;
        const c = t3 - t2;
        const d = -2.0 * t3 + 3.0 * t2;

        let t0 = tan0.x,
          t1 = tan1.x;
        if (Number.isFinite(t0) && Number.isFinite(t1)) {
          (<Vector2>this._currentValue).x = a * p0.x + b * t0 * dur + c * t1 * dur + d * p1.x;
        } else {
          (<Vector2>this._currentValue).x = p0.x;
        }

        (t0 = tan0.y), (t1 = tan1.y);
        if (Number.isFinite(t0) && Number.isFinite(t1))
          (<Vector2>this._currentValue).y = a * p0.y + b * t0 * dur + c * t1 * dur + d * p1.y;
        else {
          (<Vector2>this._currentValue).y = p0.y;
        }
        return this._currentValue;
      }
      case 3: {
        const p0 = (<Vector3Keyframe>curKey).value;
        const tan0 = (<Vector3Keyframe>curKey).outTangent;
        const p1 = (<Vector3Keyframe>nextKey).value;
        const tan1 = (<Vector3Keyframe>nextKey).inTangent;

        const t2 = t * t;
        const t3 = t2 * t;
        const a = 2.0 * t3 - 3.0 * t2 + 1.0;
        const b = t3 - 2.0 * t2 + t;
        const c = t3 - t2;
        const d = -2.0 * t3 + 3.0 * t2;

        let t0 = tan0.x,
          t1 = tan1.x;
        if (Number.isFinite(t0) && Number.isFinite(t1)) {
          (<Vector3>this._currentValue).x = a * p0.x + b * t0 * dur + c * t1 * dur + d * p1.x;
        } else {
          (<Vector3>this._currentValue).x = p0.x;
        }

        (t0 = tan0.y), (t1 = tan1.y);
        if (Number.isFinite(t0) && Number.isFinite(t1)) {
          (<Vector3>this._currentValue).y = a * p0.y + b * t0 * dur + c * t1 * dur + d * p1.y;
        } else {
          (<Vector3>this._currentValue).y = p0.y;
        }

        (t0 = tan0.z), (t1 = tan1.z);
        if (Number.isFinite(t0) && Number.isFinite(t1)) {
          (<Vector3>this._currentValue).z = a * p0.z + b * t0 * dur + c * t1 * dur + d * p1.z;
        } else {
          (<Vector3>this._currentValue).z = p0.z;
        }
        return <Vector3>this._currentValue;
      }
      case 4: {
        const p0 = (<QuaternionKeyframe>curKey).value;
        const tan0 = (<QuaternionKeyframe>curKey).outTangent;
        const p1 = (<QuaternionKeyframe>nextKey).value;
        const tan1 = (<QuaternionKeyframe>nextKey).inTangent;

        const t2 = t * t;
        const t3 = t2 * t;
        const a = 2.0 * t3 - 3.0 * t2 + 1.0;
        const b = t3 - 2.0 * t2 + t;
        const c = t3 - t2;
        const d = -2.0 * t3 + 3.0 * t2;

        let t0 = tan0.x,
          t1 = tan1.x;
        if (Number.isFinite(t0) && Number.isFinite(t1)) {
          (<Quaternion>this._currentValue).x = a * p0.x + b * t0 * dur + c * t1 * dur + d * p1.x;
        } else {
          (<Quaternion>this._currentValue).x = p0.x;
        }

        (t0 = tan0.y), (t1 = tan1.y);
        if (Number.isFinite(t0) && Number.isFinite(t1)) {
          (<Quaternion>this._currentValue).y = a * p0.y + b * t0 * dur + c * t1 * dur + d * p1.y;
        } else {
          (<Quaternion>this._currentValue).y = p0.y;
        }

        (t0 = tan0.z), (t1 = tan1.z);
        if (Number.isFinite(t0) && Number.isFinite(t1)) {
          (<Quaternion>this._currentValue).z = a * p0.z + b * t0 * dur + c * t1 * dur + d * p1.z;
        } else {
          (<Quaternion>this._currentValue).z = p0.z;
        }

        (t0 = tan0.w), (t1 = tan1.w);
        if (Number.isFinite(t0) && Number.isFinite(t1)) {
          (<Quaternion>this._currentValue).w = a * p0.w + b * t0 * dur + c * t1 * dur + d * p1.w;
        } else {
          (<Quaternion>this._currentValue).w = p0.w;
        }
        return <Quaternion>this._currentValue;
      }
    }
  }
}

/**
 * Common utility methods for math operations.
 */
export class MathUtil {
  static readonly zeroTolerance: number = 1e-6;
  static readonly radToDegreeFactor: number = 180 / Math.PI;
  static readonly degreeToRadFactor: number = Math.PI / 180;

  static clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }

  static equals(a: number, b: number): boolean {
    return Math.abs(a - b) <= MathUtil.zeroTolerance;
  }

  static isPowerOf2(v: number): boolean {
    return (v & (v - 1)) === 0;
  }

  static radianToDegree(r: number): number {
    return r * MathUtil.radToDegreeFactor;
  }

  static degreeToRadian(d: number): number {
    return d * MathUtil.degreeToRadFactor;
  }
}

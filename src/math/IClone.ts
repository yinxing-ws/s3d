/**
 * Clone interface.
 */
export interface IClone {
  clone(): Object;

  cloneTo(target: Object): Object;
}

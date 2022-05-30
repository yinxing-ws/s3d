import { Matrix } from "../../math";
import { Mesh } from "../graphic";
import { Material } from "../material";

/**
 * Sky.
 */
export class Sky {
  /** Material of the sky. */
  material: Material;
  /** Mesh of the sky. */
  mesh: Mesh;
  /** @internal */
  _matrix: Matrix = new Matrix();
}

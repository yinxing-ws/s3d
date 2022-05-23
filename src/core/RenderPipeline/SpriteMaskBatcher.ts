import { SpriteMask } from "../2d/sprite/SpriteMask";
import { Engine } from "../Engine";
import { VertexElementFormat } from "../graphic/enums/VertexElementFormat";
import { VertexElement } from "../graphic/VertexElement";
import { StencilOperation } from "../shader/enums/StencilOperation";
import { Shader } from "../shader/Shader";
import { ShaderMacroCollection } from "../shader/ShaderMacroCollection";
import { Basic2DBatcher } from "./Basic2DBatcher";
import { SpriteMaskElement } from "./SpriteMaskElement";

export class SpriteMaskBatcher extends Basic2DBatcher {
  createVertexElements(vertexElements: VertexElement[]): number {
    vertexElements[0] = new VertexElement("POSITION", 0, VertexElementFormat.Vector3, 0);
    vertexElements[1] = new VertexElement("TEXCOORD_0", 12, VertexElementFormat.Vector2, 0);
    return 20;
  }

  canBatch(preElement: SpriteMaskElement, curElement: SpriteMaskElement): boolean {
    if (preElement.isAdd !== curElement.isAdd) {
      return false;
    }

    // Compare renderer property
    const preShaderData = (<SpriteMask>preElement.component).shaderData;
    const curShaderData = (<SpriteMask>curElement.component).shaderData;
    const textureProperty = SpriteMask._textureProperty;
    const alphaCutoffProperty = SpriteMask._alphaCutoffProperty;

    return (
      preShaderData.getTexture(textureProperty) === curShaderData.getTexture(textureProperty) &&
      preShaderData.getTexture(alphaCutoffProperty) === curShaderData.getTexture(alphaCutoffProperty)
    );
  }

  updateVertices(element: SpriteMaskElement, vertices: Float32Array, vertexIndex: number): number {
    const { positions, uv } = element;
    const verticesNum = positions.length;
    for (let i = 0; i < verticesNum; i++) {
      const curPos = positions[i];
      const curUV = uv[i];

      vertices[vertexIndex++] = curPos.x;
      vertices[vertexIndex++] = curPos.y;
      vertices[vertexIndex++] = curPos.z;
      vertices[vertexIndex++] = curUV.x;
      vertices[vertexIndex++] = curUV.y;
    }

    return vertexIndex;
  }

  drawBatches(engine: Engine): void {
    const mesh = this._meshes[this._flushId];
    const subMeshes = mesh.subMeshes;
    const batchedQueue = this._batchedQueue;

    for (let i = 0, len = subMeshes.length; i < len; i++) {
      const subMesh = subMeshes[i];
      const spriteMaskElement = <SpriteMaskElement>batchedQueue[i];

      if (!subMesh || !spriteMaskElement) {
        return;
      }

      const renderer = <SpriteMask>spriteMaskElement.component;
      const material = spriteMaskElement.material;

      const compileMacros = Shader._compileMacros;
      // union render global macro and material self macro.
      ShaderMacroCollection.unionCollection(
        renderer._globalShaderMacro,
        material.shaderData._macroCollection,
        compileMacros
      );

      // Update stencil state
      const stencilState = material.renderState.stencilState;
      const op = spriteMaskElement.isAdd ? StencilOperation.IncrementSaturate : StencilOperation.DecrementSaturate;
      stencilState.passOperationFront = op;
      stencilState.passOperationBack = op;

      const program = material.shader._getShaderProgram(engine, compileMacros);
      if (!program.isValid) {
        return;
      }

      const camera = spriteMaskElement.camera;

      program.bind();
      program.groupingOtherUniformBlock();
      program.uploadAll(program.sceneUniformBlock, camera.scene.shaderData);
      program.uploadAll(program.cameraUniformBlock, camera.shaderData);
      program.uploadAll(program.rendererUniformBlock, renderer.shaderData);
      program.uploadAll(program.materialUniformBlock, material.shaderData);

      material.renderState._apply(engine, false);

      engine._hardwareRenderer.drawPrimitive(mesh, subMesh, program);
    }
  }
}

import { Engine } from './Engine';
import { EngineObject } from './EngineObject';
import { Shader } from './Shader';

import testVS from '../shaderlib/test.vs.glsl';
import testFS from '../shaderlib/test.fs.glsl';

export class ShaderPool extends EngineObject {
  private _shaderMap: Map<string, Shader> = new Map<string, Shader>();

  constructor(engine: Engine) {
    super(engine);

    this._shaderMap.set('test', new Shader(this.engine.gl, testVS, testFS));
  }

  getShader(name: string): Shader {
    return this._shaderMap.get(name);
  }
}

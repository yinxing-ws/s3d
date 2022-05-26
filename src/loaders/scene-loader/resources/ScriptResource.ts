import { SchemaResource } from "./SchemaResource";
import { AssetConfig } from "../types";
import { Oasis } from "../Oasis";
import { Parser } from "../Parser";

export const scriptAbility = {};
export function script(name: string) {
  return (target: any) => {
    scriptAbility[name] = target;
  };
}
export class ScriptResource extends SchemaResource {
  private isInit = false;

  private initScriptContext() {
    if (this.isInit) {
      return;
    }
    this.isInit = true;
    (window as any).__o3_script_context__ = {
      o3: Parser._components["o3"],
      script: (name: string) => {
        return (target: any) => {
          scriptAbility[name] = target;
        };
      }
    };
  }

  load(resourceLoader, assetConfig: AssetConfig, oasis: Oasis): Promise<ScriptResource> {
    this.initScriptContext();
    return new Promise((resolve) => {
      const config = assetConfig as any;
      const scripts = config.props.scripts;

      if (!this.resourceManager.isLocal) {
        const scriptDom = document.createElement("script");
        scriptDom.crossOrigin = "anonymous";
        this.setMeta(assetConfig);
        scriptDom.onload = () => {
          const o3Scripts = (window as any).o3Scripts;
          for (let i = 0; i < scripts.length; i++) {
            const name = scripts[i].name;
            this._resource = o3Scripts && o3Scripts[name];
            scriptAbility[name] = this._resource;
          }
          resolve(this);
        };
        scriptDom.src = assetConfig.url;
        document.body.appendChild(scriptDom);
      } else {
        for (let i = 0; i < scripts.length; i++) {
          const name = scripts[i].name;
          scriptAbility[name] = oasis.options?.scripts[name];
        }
        resolve(this);
      }
    });
  }

  setMeta(assetConfig?: AssetConfig) {
    if (assetConfig) {
      this._meta.name = assetConfig.name;
      this._meta.url = assetConfig.url;
      this._meta.source = assetConfig.source;
    }
  }
}

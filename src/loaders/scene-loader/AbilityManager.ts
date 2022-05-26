import { Component, Logger } from "@/core";
import { Model } from "./Model";
import { Oasis } from "./Oasis";
import { Parser } from "./Parser";
import { pluginHook } from "./plugins/PluginManager";
import { scriptAbility } from "./resources";
import { ComponentConfig, Props } from "./types";
import { switchElementsIndex } from "./utils";
import { colliderConfigure } from "./ColliderConfigure";

export class AbilityManager {
  private abilityMap: { [id: string]: Component } = {};

  constructor(private oasis: Oasis) {}

  @pluginHook({ after: "abilityAdded", before: "beforeAbilityAdded" })
  public add(abilityConfig: ComponentConfig) {
    const { type, node: nodeId, props, id, index } = abilityConfig;

    const node = this.oasis.nodeManager.get(nodeId);
    const AbilityConstructor = this.getCompConstructor(type);
    if (!AbilityConstructor) {
      Logger.error(`${type} ability is not defined`);
      return;
    }

    const abilityProps = this.mixPropsToExplicitProps(props);
    const ability = node.addComponent(AbilityConstructor);
    const { enabled } = abilityProps;
    if (enabled !== undefined) {
      ability.enabled = enabled;
    }

    if (type === "GLTFModel") {
      // TODO
      (ability as any).init(abilityProps);
    } else if (type === "Model") {
      // TODO
      (ability as any).setProps(abilityProps);
      if (abilityProps.material) {
        (ability as any).material = abilityProps.material;
      }
    } else if (type === "StaticCollider" || type === "DynamicCollider") {
      colliderConfigure(ability as any, abilityProps);
    } else {
      for (let k in abilityProps) {
        if (abilityProps[k] !== null) {
          ability[k] = abilityProps[k];
        }
      }
    }

    //@ts-ignore
    const abilityArray = node._components;
    const currentIndex = abilityArray.length - 1;
    switchElementsIndex(abilityArray, currentIndex, index);
    (ability as any).id = id;
    this.abilityMap[id] = ability;
    return ability;
  }

  @pluginHook({ before: "beforeAbilityUpdated", after: "abilityUpdated" })
  public update(id: string, key: string, value: any) {
    if (value && this.checkIsAsset(value)) {
      this.get(id)[key] = this.oasis.resourceManager.get(value.id).resource;
    } else {
      if (this.get(id).constructor === Model) {
        (this.get(id) as any).updateProp(key, value);
      } else {
        this.get(id)[key] = value;
      }
    }

    return { id, key, value };
  }

  public addRuntimeComponent(componentId: string, component: Component) {
    (component as any).id = componentId;
    this.abilityMap[componentId] = component;
    return component;
  }

  public get(id: string): Component {
    return this.abilityMap[id];
  }

  @pluginHook({ after: "abilityDeleted", before: "beforeAbilityDeleted" })
  public delete(id: string) {
    const ability = this.abilityMap[id];
    ability.destroy();
    delete this.abilityMap[id];
    return id;
  }

  private getCompConstructor(type: string) {
    const splits = type.split(".");
    // script
    if (splits[0] === "script") {
      return scriptAbility[splits[1]];
    }

    const constructor = Parser._components["o3"][type];
    if (!constructor) {
      console.warn(`${type} is not defined`);
    }
    return constructor;
  }

  private mixPropsToExplicitProps(props: Props) {
    const explicitProps = { ...props };
    for (let k in props) {
      const prop = props[k];
      if (prop && this.checkIsAsset(prop)) {
        const res = this.oasis.resourceManager.get(prop.id);
        if (res) {
          explicitProps[k] = res.resource;
        } else {
          explicitProps[k] = null;
          Logger.warn(`AbilityManager: can't get asset "${k}", which id is ${prop.id}`);
        }
      }
    }
    return explicitProps;
  }

  private checkIsAsset(prop: any): boolean {
    return prop.type === "asset";
  }
}

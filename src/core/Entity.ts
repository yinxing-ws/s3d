import { Component } from './Component';
import { Engine } from './Engine';
import { EngineObject } from './EngineObject';
import { Transform } from './Transform';

export class Entity extends EngineObject {
  transform: Transform;

  // 父子关系
  parent: Entity;
  children: Entity[];

  //
  _components: Component[];

  constructor(engine: Engine, parent: Entity = null) {
    super(engine);

    this.parent = parent;

    this.children = [];
    this._components = [];
    this.transform = this.addComponent(Transform);
  }

  createChild() {
    const child = new Entity(this._engine, this);
    this.children.push(child);
    return child;
  }

  addComponent<T extends Component>(type: new (entity: Entity) => T): T {
    const component = new type(this);
    this._components.push(component);

    return component;
  }

  _removeComponent(component: Component): void {
    const components = this._components;
    components.splice(components.indexOf(component), 1);
  }

  getAllChildren = (): Entity[] => {
    if (!this.children?.length) return [];

    let ret: Entity[] = [];
    this.children.forEach((child) => {
      ret = [...ret, ...child.getAllChildren(), child];
    });

    return ret;
  };
}

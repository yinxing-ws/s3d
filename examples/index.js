import { Engine, Entity } from '../dist/bundle.js';

const canvas = document.getElementById('canvas');

const engine = new Engine(canvas);

const entity = new Entity(engine);

engine.entity = entity;

engine.run();

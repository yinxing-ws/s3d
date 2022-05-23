import {
  WebGLEngine,
  BlinnPhongMaterial,
  PrimitiveMesh,
  DirectLight,
  Camera,
  MeshRenderer,
} from '../dist/module.js';

const engine = new WebGLEngine('canvas');
engine.canvas.resizeByClientSize();

// Get scene and create root entity.
const scene = engine.sceneManager.activeScene;
const rootEntity = scene.createRootEntity('Root');

// Create light.
const lightEntity = rootEntity.createChild('Light');
const directLight = lightEntity.addComponent(DirectLight);
lightEntity.transform.setRotation(-45, -45, 0);
directLight.intensity = 0.4;

// Create camera.
const cameraEntity = rootEntity.createChild('Camera');
window.camera = cameraEntity.addComponent(Camera);
cameraEntity.transform.setPosition(0, 0, 12);

// Create sphere.
const meshEntity = rootEntity.createChild('Sphere');
const meshRenderer = meshEntity.addComponent(MeshRenderer);
const material = new BlinnPhongMaterial(engine);
meshRenderer.setMaterial(material);
meshRenderer.mesh = PrimitiveMesh.createSphere(engine, 1);

// Run engine.
engine.run();

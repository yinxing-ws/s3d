import {
  GLTFResource,
  Color,
  Camera,
  Texture2D,
  AssetType,
  DirectLight,
  MeshRenderer,
  PBRMaterial,
  SkyBoxMaterial,
  BackgroundMode,
  PrimitiveMesh,
  AmbientLight,
  OrbitControl,
  WebGLEngine,
  PostEffectPass,
} from '../dist/module.js';

const gltfData = {
  standard: {
    path: 'https://gw.alipayobjects.com/os/OasisHub/440001359/8071/MS_BBY_lola.gltf',
    rotation: [0, 180, 0],
    scale: [2, 2, 2],
  },
};

const textures = {
  m1: {
    color: 'https://gw.alipayobjects.com/zos/OasisHub/440001015/2220/T_BBY_lola_color_01.png',
    normal: 'https://gw.alipayobjects.com/zos/OasisHub/440001015/1641/T_BBY_lola_normal_01.png',
    orm: 'https://gw.alipayobjects.com/zos/OasisHub/440001015/6473/T_BBY_lola_orm_01.png',
  },
  m2: {
    color: 'https://gw.alipayobjects.com/zos/OasisHub/440001015/715/T_BBY_lola_color_02.png',
    normal: 'https://gw.alipayobjects.com/zos/OasisHub/440001015/2651/T_BBY_lola_normal_02.png',
    orm: 'https://gw.alipayobjects.com/zos/OasisHub/440001015/1629/T_BBY_lola_orm_02.png',
  },
};

const engine = new WebGLEngine('canvas');
engine.canvas.resizeByClientSize();

// Get scene and create root entity.
const scene = engine.sceneManager.activeScene;
const rootEntity = scene.createRootEntity('Root');

const { background, postEffect } = scene;

postEffect.brightness = 1.0;
postEffect.contrast = 1.0;
postEffect.bloomIntensity = 1.5;
postEffect.bloomThreshold = 0.8;

window.postEffect = postEffect;

const sky = background.sky;
const skyMaterial = new SkyBoxMaterial(engine);
background.mode = BackgroundMode.Sky;
sky.material = skyMaterial;
sky.mesh = PrimitiveMesh.createCuboid(engine, 1, 1, 1);

// 相机
const cameraNode = rootEntity.createChild('camera_node');
cameraNode.transform.setPosition(0, 0, 5);
const camera = cameraNode.addComponent(Camera);
// camera._renderPipeline.addRenderPass(new PostEffectPass('postEffect', 1));
// camera._renderPipeline.addRenderPass(new PostEffectPass('postEffect', 1));
camera.activePostEffect();
cameraNode.addComponent(OrbitControl);

// 光照
const createDirectLight = (rx, ry, rz, intensity, color) => {
  const node = rootEntity.createChild('DirectLight');
  node.transform.setRotation(rx, ry, rz);
  const light = node.addComponent(DirectLight);
  color && (light.color = color);
  intensity && (light.intensity = intensity);
};

createDirectLight(-30, 20, 0, 0.6);

engine.resourceManager
  .load({
    type: AssetType.Env,
    url: 'https://gw.alipayobjects.com/os/OasisHub/440001352/2393/belfast_open_field_2k.hdr',
  })
  .then((ambientLight) => {
    scene.ambientLight = ambientLight;
  });

// modal
let data = gltfData.standard;

const { path, rotation, scale } = data;
const [rx, ry, rz] = rotation;
const [sx, sy, sz] = scale;

const load = (url) => engine.resourceManager.load({ type: AssetType.Texture2D, url });

engine.resourceManager
  .load({
    type: AssetType.GLTFResource,
    url: 'https://gw.alipayobjects.com/os/bmw-prod/150e44f6-7810-4c45-8029-3575d36aff30.gltf',
  })
  .then((gltf) => {
    // 添加gltf模型
    const root = gltf.defaultSceneRoot;
    // // rotation和scale
    // root.transform.setRotation(rx, ry, rz);
    // root.transform.setScale(sx, sy, sz);

    // const e1 = root.children[0].children[0];
    // const e2 = root.children[0].children[1];

    // let ret1 = [];
    // ret1 = e1.getComponents(MeshRenderer, ret1);
    // let ret2 = e2.getComponent(MeshRenderer);

    // const m1 = ret1[0].getMaterial();
    // const m2 = ret2.getMaterial();
    // const m3 = ret1[1].getMaterial();

    // m1.baseColor = new Color(1, 1, 1, 1);
    // m2.baseColor = new Color(1, 1, 1, 1);
    // m3.baseColor = new Color(1, 1, 1, 1);

    // load(textures.m1.color).then((texture) => {
    //   m1.baseTexture = texture;
    //   m3.baseTexture = texture;
    // });

    // load(textures.m1.normal).then((texture) => {
    //   m1.normalTexture = texture;
    //   m3.normalTexture = texture;
    // });

    // load(textures.m1.orm).then((texture) => {
    //   m1.roughnessMetallicTexture = texture;
    //   m1.occlusionTexture = texture;
    //   m1.metallic = 1;
    //   m1.roughness = 1;

    //   m3.roughnessMetallicTexture = texture;
    //   m3.occlusionTexture = texture;
    //   m3.metallic = 1;
    //   m3.roughness = 1;
    // });

    // load(textures.m2.color).then((texture) => {
    //   m2.baseTexture = texture;
    // });

    // load(textures.m2.normal).then((texture) => {
    //   m2.normalTexture = texture;
    // });

    // load(textures.m2.orm).then((texture) => {
    //   m2.roughnessMetallicTexture = texture;
    //   m2.occlusionTexture = texture;
    //   m2.metallic = 1;
    //   m2.roughness = 1;
    // });

    rootEntity.addChild(root);
  });

// Run engine.
engine.run();

import {
  AssetPromise,
  AssetType,
  Loader,
  LoadItem,
  resourceLoader,
  ResourceManager,
  TextureCubeFace,
  TextureCubeMap
} from "../core";
import { parseCubeKTX } from "./compressed-texture";

@resourceLoader(AssetType.KTXCube, [])
class KTXCubeLoader extends Loader<TextureCubeMap> {
  load(item: LoadItem, resourceManager: ResourceManager): AssetPromise<TextureCubeMap> {
    return new AssetPromise((resolve, reject) => {
      Promise.all(
        item.urls.map((url) =>
          this.request<ArrayBuffer>(url, {
            ...item,
            type: "arraybuffer"
          })
        )
      )
        .then((data) => {
          const parsedData = parseCubeKTX(data);
          const { width, mipmapsFaces, engineFormat } = parsedData;
          const mipmap = mipmapsFaces[0].length > 1;
          const texture = new TextureCubeMap(resourceManager.engine, width, engineFormat, mipmap);

          for (let face = 0; face < 6; face++) {
            const length = mipmapsFaces[face].length;

            for (let miplevel = 0; miplevel < length; miplevel++) {
              const { data, width, height } = mipmapsFaces[face][miplevel];

              texture.setPixelBuffer(TextureCubeFace.PositiveX + face, data, miplevel, 0, 0, width, height);
            }
          }

          resolve(texture);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }
}

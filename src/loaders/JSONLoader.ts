import { resourceLoader, Loader, AssetPromise, AssetType, LoadItem } from "src/core";

@resourceLoader(AssetType.JSON, ["json"], false)
class JSONLoader extends Loader<string> {
  load(item: LoadItem): AssetPromise<string> {
    return this.request(item.url, {
      ...item,
      type: "json"
    });
  }
}

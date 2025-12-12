/**
 * @file Contains classes related to waifu model loading and management.
 * @module model
 */

import { showMessage } from './message';
import { loadExternalResource, randomOtherOption } from '../utils';
import logger from '../utils/logger';
import type { LogLevel, ModelList, ModelListCDN, Config } from '../types/live2d';

// We import Cubism2Model type for type checking, but we load it dynamically or via index
// Since the original code imported it via dynamic import in loadLive2D, we keep that pattern or import it directly if possible.
// However, the original code had:
// // @ts-ignore
// import type Cubism2Model from './cubism2/index';
// And then dynamic import.

// Let's import the type only
// @ts-ignore
import type Cubism2Model from '../live2d-widget/cubism2/index';

export class ModelManager {
  public readonly useCDN: boolean;
  private readonly cdnPath: string;
  private readonly cubism2Path: string;
  private _modelId: number;
  private _modelTexturesId: number;
  private modelList: ModelListCDN | null = null;
  private cubism2model: Cubism2Model | undefined;
  private currentModelVersion: number;
  private loading: boolean;
  private modelJSONCache: Record<string, any>;
  private models: ModelList[];

  constructor(config: Config, models: ModelList[] = []) {
    let { apiPath, cdnPath } = config;
    const { cubism2Path } = config;
    let useCDN = false;
    if (typeof cdnPath === 'string') {
      if (!cdnPath.endsWith('/')) cdnPath += '/';
      useCDN = true;
    } else if (typeof apiPath === 'string') {
      if (!apiPath.endsWith('/')) apiPath += '/';
      cdnPath = apiPath;
      useCDN = true;
      logger.warn('apiPath option is deprecated. Please use cdnPath instead.');
    } else if (!models.length) {
      throw 'Invalid initWidget argument!';
    }
    let modelId: number = parseInt(localStorage.getItem('modelId') as string, 10);
    let modelTexturesId: number = parseInt(localStorage.getItem('modelTexturesId') as string, 10);
    if (isNaN(modelId) || isNaN(modelTexturesId)) {
      modelTexturesId = 0;
    }
    if (isNaN(modelId)) {
      modelId = config.modelId ?? 0;
    }
    this.useCDN = useCDN;
    this.cdnPath = cdnPath || '';
    this.cubism2Path = cubism2Path || '';
    this._modelId = modelId;
    this._modelTexturesId = modelTexturesId;
    this.currentModelVersion = 0;
    this.loading = false;
    this.modelJSONCache = {};
    this.models = models;
  }

  public static async initCheck(config: Config, models: ModelList[] = []) {
    const model = new ModelManager(config, models);
    if (model.useCDN) {
      const response = await fetch(`${model.cdnPath}model_list.json`);
      model.modelList = await response.json();
      if (model.modelList && model.modelId >= model.modelList.models.length) {
        model.modelId = 0;
      }
      const modelName = model.modelList?.models[model.modelId];
      if (Array.isArray(modelName)) {
        if (model.modelTexturesId >= modelName.length) {
          model.modelTexturesId = 0;
        }
      } else {
        const modelSettingPath = `${model.cdnPath}model/${modelName}/model.json`;
        const modelSetting = await model.fetchWithCache(modelSettingPath);
        const version = model.checkModelVersion(modelSetting);
        if (version === 2) {
          const textureCache = await model.loadTextureCache(modelName as string);
          if (model.modelTexturesId >= textureCache.length) {
            model.modelTexturesId = 0;
          }
        }
      }
    } else {
      if (model.modelId >= model.models.length) {
        model.modelId = 0;
      }
      if (model.modelTexturesId >= model.models[model.modelId].paths.length) {
        model.modelTexturesId = 0;
      }
    }
    return model;
  }

  public set modelId(modelId: number) {
    this._modelId = modelId;
    localStorage.setItem('modelId', modelId.toString());
  }

  public get modelId() {
    return this._modelId;
  }

  public set modelTexturesId(modelTexturesId: number) {
    this._modelTexturesId = modelTexturesId;
    localStorage.setItem('modelTexturesId', modelTexturesId.toString());
  }

  public get modelTexturesId() {
    return this._modelTexturesId;
  }

  resetCanvas() {
    const canvas = document.getElementById('waifu-canvas');
    if (canvas) {
      canvas.innerHTML = '<canvas id="live2d" width="800" height="800"></canvas>';
    }
  }

  async fetchWithCache(url: string) {
    let result;
    if (url in this.modelJSONCache) {
      result = this.modelJSONCache[url];
    } else {
      try {
        const response = await fetch(url);
        result = await response.json();
      } catch {
        result = null;
      }
      this.modelJSONCache[url] = result;
    }
    return result;
  }

  checkModelVersion(modelSetting: any) {
    if (modelSetting.Version === 3 || modelSetting.FileReferences) {
      return 3;
    }
    return 2;
  }

  async loadLive2D(modelSettingPath: string, modelSetting: object) {
    if (this.loading) {
      logger.warn('Still loading. Abort.');
      return;
    }
    this.loading = true;
    try {
      const version = this.checkModelVersion(modelSetting);
      if (version === 2) {
        if (!this.cubism2model) {
          // Check if Live2D global is already available
          if (!(window as any).Live2D) {
            if (!this.cubism2Path) {
              logger.error('No cubism2Path set, cannot load Cubism 2 Core.');
              return;
            }
            await loadExternalResource(this.cubism2Path, 'js');
          }

          // @ts-ignore
          const { default: Cubism2Model } = await import('../live2d-widget/cubism2/index');
          this.cubism2model = new Cubism2Model();
        }
        // Always reset canvas for now since we only support v2
        if (this.currentModelVersion !== 2 || !this.cubism2model!.gl) {
          await this.cubism2model!.init('live2d', modelSettingPath, modelSetting);
        } else {
          await this.cubism2model!.changeModelWithJSON(modelSettingPath, modelSetting);
        }
      } else {
        logger.warn('Cubism 3+ models are not currently supported in this lean module.');
        // Fallback or error handling
      }
      logger.info(`Model ${modelSettingPath} (Cubism version ${version}) loaded`);
      this.currentModelVersion = version;
    } catch (err) {
      console.error('loadLive2D failed', err);
    }
    this.loading = false;
  }

  async loadTextureCache(modelName: string): Promise<any[]> {
    const textureCache = await this.fetchWithCache(
      `${this.cdnPath}model/${modelName}/textures.cache`
    );
    return textureCache || [];
  }

  public startMotion(group: string) {
    if (this.cubism2model) {
      this.cubism2model.startMotion(group);
    }
  }

  public setExpression(name: string) {
    if (this.cubism2model) {
      this.cubism2model.setExpression(name);
    }
  }

  async loadModel(message: string | string[]) {
    let modelSettingPath, modelSetting;
    if (this.useCDN && this.modelList) {
      let modelName = this.modelList.models[this.modelId];
      if (Array.isArray(modelName)) {
        modelName = modelName[this.modelTexturesId];
      }
      modelSettingPath = `${this.cdnPath}model/${modelName}/model.json`;
      modelSetting = await this.fetchWithCache(modelSettingPath);
      const version = this.checkModelVersion(modelSetting);
      if (version === 2) {
        const textureCache = await this.loadTextureCache(modelName as string);
        if (textureCache.length > 0) {
          let textures = textureCache[this.modelTexturesId];
          if (typeof textures === 'string') textures = [textures];
          modelSetting.textures = textures;
        }
      }
    } else {
      modelSettingPath = this.models[this.modelId].paths[this.modelTexturesId];
      modelSetting = await this.fetchWithCache(modelSettingPath);
    }
    await this.loadLive2D(modelSettingPath, modelSetting);
    showMessage(message, 4000, 10);
  }

  async loadRandTexture(
    successMessage: string | string[] = '',
    failMessage: string | string[] = ''
  ) {
    const { modelId } = this;
    let noTextureAvailable = false;
    if (this.useCDN && this.modelList) {
      const modelName = this.modelList.models[modelId];
      if (Array.isArray(modelName)) {
        this.modelTexturesId = randomOtherOption(modelName.length, this.modelTexturesId);
      } else {
        const modelSettingPath = `${this.cdnPath}model/${modelName}/model.json`;
        const modelSetting = await this.fetchWithCache(modelSettingPath);
        const version = this.checkModelVersion(modelSetting);
        if (version === 2) {
          const textureCache = await this.loadTextureCache(modelName as string);
          if (textureCache.length <= 1) {
            noTextureAvailable = true;
          } else {
            this.modelTexturesId = randomOtherOption(textureCache.length, this.modelTexturesId);
          }
        } else {
          noTextureAvailable = true;
        }
      }
    } else {
      if (this.models[modelId].paths.length === 1) {
        noTextureAvailable = true;
      } else {
        this.modelTexturesId = randomOtherOption(
          this.models[modelId].paths.length,
          this.modelTexturesId
        );
      }
    }
    if (noTextureAvailable) {
      showMessage(failMessage, 4000, 10);
    } else {
      await this.loadModel(successMessage);
    }
  }

  async loadNextModel() {
    this.modelTexturesId = 0;
    if (this.useCDN && this.modelList) {
      this.modelId = (this.modelId + 1) % this.modelList.models.length;
      await this.loadModel(this.modelList.messages[this.modelId]);
    } else {
      this.modelId = (this.modelId + 1) % this.models.length;
      await this.loadModel(this.models[this.modelId].message);
    }
  }
}

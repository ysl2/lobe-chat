/* eslint-disable sort-keys-fix/sort-keys-fix, typescript-sort-keys/interface */
import FluxSchnellSchema from '@/config/paramsSchemas/fal/flux-schnell.json';
import { ModelProvider } from '@/libs/model-runtime/types/type';

import { StdImageGenParams } from '../../../../libs/standard-parameters/image';
import { parseParamsSchema } from '../../utils/parseParamsSchema';

export const DEFAULT_AI_IMAGE_PROVIDER = ModelProvider.Fal;
export const DEFAULT_AI_IMAGE_MODEL = 'flux/schnell';
export const DEFAULT_IMAGE_NUM = 4;

const STORAGE_KEY = 'lobe-chat-image-generation-config';

export interface GenerationConfigState {
  model: string;
  provider: string;
  imageNum: number;
  /**
   * store the params pass the generation api
   */
  parameters?: Partial<StdImageGenParams>;
  parameterSchema?: Record<string, any>;

  // 新增状态
  isAspectRatioLocked: boolean;
  activeAspectRatio: string | null; // string - 虚拟比例; null - 原生比例
}

export const DEFAULT_IMAGE_GENERATION_PARAMETERS: Partial<StdImageGenParams> =
  parseParamsSchema(FluxSchnellSchema).defaultValues;

// localStorage utility functions
interface StoredConfig {
  model: string;
  provider: string;
}

export const saveImageGenerationConfig = (model: string, provider: string) => {
  if (typeof window !== 'undefined') {
    try {
      const config: StoredConfig = { model, provider };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save image generation config to localStorage:', error);
    }
  }
};

export const loadImageGenerationConfig = (): StoredConfig | null => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as StoredConfig;
      }
    } catch (error) {
      console.warn('Failed to load image generation config from localStorage:', error);
    }
  }
  return null;
};

// Load from localStorage or use defaults
// const getInitialConfig = (): Pick<GenerationConfigState, 'model' | 'provider'> => {
//   const stored = loadImageGenerationConfig();
//   return {
//     model: stored?.model || DEFAULT_AI_IMAGE_MODEL,
//     provider: stored?.provider || DEFAULT_AI_IMAGE_PROVIDER,
//   };
// };

// const initialConfig = getInitialConfig();

export const initialGenerationConfigState: GenerationConfigState = {
  model: DEFAULT_AI_IMAGE_MODEL,
  provider: DEFAULT_AI_IMAGE_PROVIDER,
  imageNum: DEFAULT_IMAGE_NUM,
  parameters: DEFAULT_IMAGE_GENERATION_PARAMETERS,
  parameterSchema: FluxSchnellSchema,

  // 新增状态的初始值
  isAspectRatioLocked: false,
  activeAspectRatio: '1:1', // 默认激活 1:1
};

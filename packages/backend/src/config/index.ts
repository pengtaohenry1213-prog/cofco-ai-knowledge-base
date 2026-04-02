import dotenv from 'dotenv';
import path from 'path';
import type { AppConfig, DoubaoConfig, SiliconFlowConfig } from '../types/config.types';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredConfig: string[] = ['DOUBAO_API_KEY'];
const optionalConfig: string[] = ['PORT', 'DOUBAO_API_BASE_URL', 'DOUBAO_MODEL_NAME', 'NODE_ENV', 'SILICONFLOW_API_KEY', 'SILICONFLOW_EMBEDDING_MODEL'];

function getEnv(key: string, defaultValue?: string): string {
  return process.env[key] ?? defaultValue ?? '';
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`配置项 ${key} 未配置`);
  }
  return value;
}

function getNumberEnv(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (!value) {
    return defaultValue ?? 3000;
  }
  const parsed = Number(value);
  if (isNaN(parsed)) {
    throw new Error(`配置项 ${key} 必须是数字，当前值: ${value}`);
  }
  return parsed;
}

const doubaoDefaults: DoubaoConfig = {
  apiKey: '',
  baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
  model: 'doubao-seed-2-0-code-preview-260215',
};

export function loadDoubaoConfig(): DoubaoConfig {
  return {
    apiKey: getRequiredEnv('DOUBAO_API_KEY'),
    baseUrl: getEnv('DOUBAO_API_BASE_URL', doubaoDefaults.baseUrl),
    model: getEnv('DOUBAO_MODEL_NAME', doubaoDefaults.model),
  };
}

export function loadSiliconFlowConfig(): SiliconFlowConfig | undefined {
  const apiKey = getEnv('SILICONFLOW_API_KEY');
  if (!apiKey) {
    console.log('[Config] SILICONFLOW_API_KEY 未配置，将使用豆包 Embedding');
    return undefined;
  }
  return {
    apiKey,
    baseUrl: 'https://api.siliconflow.cn/v1',
    model: getEnv('SILICONFLOW_EMBEDDING_MODEL', 'BAAI/bge-large-zh-v1.5'),
  };
}

export function loadAppConfig(): AppConfig {
  const doubao = loadDoubaoConfig();
  const siliconFlow = loadSiliconFlowConfig();

  return {
    port: getNumberEnv('PORT', 3000),
    doubao,
    siliconFlow,
    env: getEnv('NODE_ENV', 'development'),
  };
}

export function validateConfig(config: AppConfig): void {
  const errors: string[] = [];

  if (!config.doubao.apiKey) {
    errors.push('API Key 未配置');
  }

  if (!config.doubao.baseUrl) {
    errors.push('API Base URL 未配置');
  }

  if (!config.doubao.model) {
    errors.push('Model name 未配置');
  }

  if (errors.length > 0) {
    throw new Error(`配置校验失败: ${errors.join(', ')}`);
  }
}

export function getConfig(): AppConfig {
  const config = loadAppConfig();
  validateConfig(config);
  return config;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export const config = getConfig();

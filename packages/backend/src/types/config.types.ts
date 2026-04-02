export interface DoubaoConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface SiliconFlowConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface AppConfig {
  port: number;
  doubao: DoubaoConfig;
  siliconFlow?: SiliconFlowConfig;
  env: string;
}

export interface ConfigValidationError {
  field: string;
  message: string;
}

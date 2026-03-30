export interface DoubaoConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface AppConfig {
  port: number;
  doubao: DoubaoConfig;
  env: string;
}

export interface ConfigValidationError {
  field: string;
  message: string;
}

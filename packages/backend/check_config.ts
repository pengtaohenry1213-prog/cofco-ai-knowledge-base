import { config } from './src/config';
console.log('API Key:', config.doubao.apiKey ? '***' + config.doubao.apiKey.slice(-4) : 'NOT SET');
console.log('Base URL:', config.doubao.baseUrl);

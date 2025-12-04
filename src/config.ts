import { config } from 'dotenv';
import { ModelConfig } from './types.js';
import { logger } from './utils/logger.js';

// 加载环境变量
config();

export const CONFIG = {
  // MCP服务配置
  server: {
    name: process.env.MCP_SERVER_NAME || 'homework-grading-mcp',
    version: process.env.MCP_SERVER_VERSION || '1.0.0',
  },

  // 模型配置
  model: {
    apiKey: process.env.MODELSCOPE_API_KEY || '',
    baseURL: 'https://api-inference.modelscope.cn/v1',
    model: 'Qwen/Qwen3-VL-235B-A22B-Instruct',
    maxTokens: 4096,
    temperature: 0.3,
  } as ModelConfig,

  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // 验证配置
  validate(): void {
    if (!this.model.apiKey) {
      logger.warn('MODELSCOPE_API_KEY 环境变量未设置，模型功能将不可用');
      logger.info('请在环境变量中设置 MODELSCOPE_API_KEY 以启用作业批改功能');
    }
  },
};

// 在模块加载时验证配置
CONFIG.validate();
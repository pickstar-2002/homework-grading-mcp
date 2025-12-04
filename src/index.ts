#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { CONFIG } from './config.js';
import { logger } from './utils/logger.js';
import { 
  gradeHomeworkTool, 
  ToolHandler 
} from './tools/gradingTools.js';

/**
 * 作业批改MCP服务器
 */
class HomeworkGradingMCPServer {
  private server: Server;
  private toolHandler: ToolHandler;

  constructor() {
    this.server = new Server(
      {
        name: CONFIG.server.name,
        version: CONFIG.server.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.toolHandler = new ToolHandler();
    this.setupToolHandlers();
  }

  /**
   * 设置工具处理器
   */
  private setupToolHandlers(): void {
    // 处理工具列表请求
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug('收到工具列表请求');
      return {
        tools: [gradeHomeworkTool],
      };
    });

    // 处理工具调用请求
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      logger.info(`收到工具调用请求: ${name}`);
      logger.debug('工具参数:', args);

      try {
        switch (name) {
          case 'grade_homework':
            return await this.toolHandler.handleGradeHomework(args);
          
          default:
            throw new Error(`未知的工具: ${name}`);
        }
      } catch (error) {
        logger.error(`工具调用失败 (${name}):`, error);
        return {
          content: [
            {
              type: 'text',
              text: `❌ 工具调用失败：${error instanceof Error ? error.message : '未知错误'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
 * 启动服务器
 */
  async run(): Promise<void> {
    try {
      // 确保立即输出到stderr
      console.error(`🚀 启动作业批改MCP服务器 v${CONFIG.server.version}`);
      console.error(`📋 服务器名称: ${CONFIG.server.name}`);
      
      // 检查API密钥配置
      if (!CONFIG.model.apiKey || CONFIG.model.apiKey === 'demo-key') {
        console.error('⚠️  MODELSCOPE_API_KEY 未配置，模型功能将不可用');
        console.error('🔑 请在环境变量中设置有效的 MODELSCOPE_API_KEY');
      } else {
        try {
          // 测试模型连接
          const { ModelService } = await import('./services/modelService.js');
          const modelService = new ModelService();
          const isConnected = await modelService.testConnection();
          
          if (isConnected) {
            console.error('✅ 模型连接测试通过');
          } else {
            console.error('⚠️  模型连接测试失败，请检查API配置');
          }
        } catch (error) {
          console.error('⚠️  模型服务初始化失败:', error instanceof Error ? error.message : '未知错误');
          console.error('🔧 服务器将继续运行，但批改功能可能受限');
        }
      }

      // 创建传输层
      const transport = new StdioServerTransport();
      
      // 连接服务器
      await this.server.connect(transport);
      
      console.error('✅ MCP服务器启动成功，等待客户端连接...');
      console.error('🔧 可用工具:');
      console.error('  • grade_homework - 智能批改作业（只需上传图片）');
      
    } catch (error) {
      console.error('❌ 服务器启动失败:', error);
      process.exit(1);
    }
  }

  /**
   * 优雅关闭
   */
  async shutdown(): Promise<void> {
    console.error('🛑 正在关闭服务器...');
    await this.server.close();
    console.error('✅ 服务器已关闭');
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    const server = new HomeworkGradingMCPServer();

    // 处理进程信号
    process.on('SIGINT', async () => {
      console.error('收到中断信号 (SIGINT)');
      await server.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('收到终止信号 (SIGTERM)');
      await server.shutdown();
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      console.error('未捕获的异常:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('未处理的Promise拒绝:', reason, promise);
      process.exit(1);
    });

    // 启动服务器
    await server.run();
  } catch (error) {
    console.error('主函数执行失败:', error);
    process.exit(1);
  }
}

// 运行主函数
main().catch((error) => {
  console.error('主函数执行失败:', error);
  process.exit(1);
});

export { HomeworkGradingMCPServer };
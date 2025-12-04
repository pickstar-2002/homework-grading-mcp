import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { GradeHomeworkParamsSchema } from '../types.js';
import { GradingService } from '../services/gradingService.js';
import { logger } from '../utils/logger.js';
import { downloadImageAsBase64, detectInputType, validateBase64Image } from '../utils/imageDownloader.js';

/**
 * 作业批改工具定义 - 支持Base64和URL
 */
export const gradeHomeworkTool: Tool = {
  name: 'grade_homework',
  description: '📝 智能批改学生作业图片，支持Base64和URL两种方式，自动识别题目并给出评分和解析',
  inputSchema: {
    type: 'object',
    properties: {
      imageData: {
        type: 'string',
        description: 'Base64编码的作业图片数据（支持PNG、JPG、JPEG格式），与imageUrl二选一',
      },
      imageUrl: {
        type: 'string',
        description: '作业图片的URL地址，与imageData二选一',
      },
    },
    oneOf: [
      { required: ['imageData'] },
      { required: ['imageUrl'] }
    ],
  },
};

/**
 * 工具处理器 - 简化版
 */
export class ToolHandler {
  private gradingService: GradingService;

  constructor() {
    this.gradingService = new GradingService();
  }

  /**
   * 处理作业批改工具调用 - 支持Base64和URL
   */
  async handleGradeHomework(args: any): Promise<any> {
    try {
      // 验证输入参数 - 支持Base64和URL
      const schema = z.union([
        z.object({ imageData: z.string().min(1, '图片数据不能为空') }),
        z.object({ imageUrl: z.string().url('请输入有效的图片URL地址') })
      ]);

      const validatedParams = schema.parse(args);

      // 获取图片数据
      let imageData: string;
      
      if ('imageUrl' in validatedParams) {
        imageData = await downloadImageAsBase64(validatedParams.imageUrl);
      } else {
        const validation = validateBase64Image(validatedParams.imageData);
        if (!validation.isValid) {
          throw new Error(validation.error || '图片格式验证失败');
        }
        imageData = validatedParams.imageData;
      }

      // 执行批改
      const result = await this.gradingService.gradeHomework({
        imageData: imageData,
        subject: '自动识别',
        studentName: '学生'
      });
      
      // 构建统一格式的题目输出
      const questionsOutput = result.results.map((r, i) => {
        const status = r.isCorrect ? '正确' : '错误';
        const questionContent = r.questionContent || `第${i + 1}题`;
        return `题号：${i + 1}
题目：${questionContent}
答案：${r.studentAnswer} （${status}）
题目解析：${r.explanation}`;
      }).join('\n\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ 作业批改完成！

📊 批改结果：
• 总分：${result.totalScore}/${result.maxTotalScore}
• 等级：${result.grade}

📝 题目详情：
${questionsOutput}

💭 总体评价：
${result.overallFeedback}`,
          },
        ],
      };

    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ 作业批改失败：${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
        isError: true,
      };
    }
  }
}
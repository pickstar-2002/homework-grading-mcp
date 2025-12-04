import OpenAI from 'openai';
import { CONFIG } from '../config.js';
import { logger } from '../utils/logger.js';
import { convertToOpenAIImageFormat } from '../utils/image.js';
import { Question, GradingResult } from '../types.js';

export class ModelService {
  private client: OpenAI;

  constructor() {
    if (!CONFIG.model.apiKey) {
      logger.warn('模型服务初始化失败：缺少API密钥');
      throw new Error('MODELSCOPE_API_KEY 环境变量未设置，无法初始化模型服务');
    }
    
    this.client = new OpenAI({
      apiKey: CONFIG.model.apiKey,
      baseURL: CONFIG.model.baseURL,
    });
  }

  /**
   * 调用Qwen3-VL模型批改作业
   */
  async gradeHomework(
    imageData: string,
    subject: string,
    studentName: string,
    questions?: Question[]
  ): Promise<GradingResult[]> {
    try {
      logger.info(`开始批改${studentName}的${subject}作业`);

      // 准备图片数据
      const imageBase64 = convertToOpenAIImageFormat(imageData);

      // 构建提示词
      const prompt = this.buildGradingPrompt(subject, studentName, questions);

      // 调用模型
      const response = await this.client.chat.completions.create({
        model: CONFIG.model.model,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的作业批改老师。请仔细查看学生提交的作业图片，逐题批改并给出详细的评分和反馈。

要求：
1. 准确识别图片中的题目和学生答案
2. 逐题判断答案正确与否
3. 为每道题提供简洁明了的解析说明
4. 给出具体的得分和满分
5. 提供建设性的反馈意见
6. 输出格式必须为JSON格式

评分标准：
- 完全正确：满分
- 部分正确：给部分分数
- 完全错误：0分
- 步骤正确但答案错误：给步骤分` 
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: CONFIG.model.maxTokens,
        temperature: CONFIG.model.temperature,
        stream: false,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('模型返回内容为空');
      }

      logger.debug('模型返回内容:', content);

      // 解析模型返回的JSON结果
      const gradingResults = this.parseModelResponse(content);
      
      logger.info(`作业批改完成，共批改 ${gradingResults.length} 道题`);
      return gradingResults;

    } catch (error) {
      logger.error('调用模型批改作业失败:', error);
      throw new Error(`模型调用失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 构建批改提示词 - 优化格式
   */
  private buildGradingPrompt(subject: string, studentName: string, questions?: Question[]): string {
    let prompt = `请批改${studentName}同学的${subject}作业。

请严格按照以下要求输出：
1. 每道题都要包含：题号、题目内容、学生答案、是否正确、详细解析
2. 题目内容必须准确识别图片中的具体题目文本，不能简化为"第1题"等占位符
3. 解析要简洁明了，说明解题思路和关键步骤
4. 按照指定的JSON格式返回结果

`;

    if (questions && questions.length > 0) {
      prompt += `题目信息：\n`;
      questions.forEach((question, index) => {
        prompt += `${index + 1}. ${question.content}\n`;
        if (question.standardAnswer) {
          prompt += `标准答案：${question.standardAnswer}\n`;
        }
        prompt += `分值：${question.points}分\n\n`;
      });
    }

    prompt += `请按照以下JSON格式返回批改结果：
{
  "results": [
    {
      "questionId": "题目编号",
      "questionContent": "题目具体内容（从图片中准确识别，不能简化为\"第1题\"等）",
      "studentAnswer": "学生答案",
      "isCorrect": true/false,
      "correctAnswer": "正确答案",
      "explanation": "详细解析说明",
      "score": 得分,
      "maxScore": 满分,
      "feedback": "具体反馈意见"
    }
  ]
}

重要提醒：questionContent字段必须包含图片中识别的具体题目文本，不能使用"第1题"、"第2题"等占位符。`;

    return prompt;
  }

  /**
   * 解析模型返回的JSON结果
   */
  private parseModelResponse(content: string): GradingResult[] {
    try {
      // 尝试提取JSON内容
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法从模型返回内容中提取JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.results || !Array.isArray(parsed.results)) {
        throw new Error('JSON格式不正确，缺少results字段');
      }

      return parsed.results.map((result: any, index: number) => ({
        questionId: result.questionId || `question_${index + 1}`,
        questionContent: String(result.questionContent || result.question || `第${index + 1}题`), // 优先使用questionContent，回退到question或默认文本
        isCorrect: Boolean(result.isCorrect),
        studentAnswer: String(result.studentAnswer || ''),
        correctAnswer: String(result.correctAnswer || ''),
        explanation: String(result.explanation || ''),
        score: Number(result.score) || 0,
        maxScore: Number(result.maxScore) || 5,
        feedback: String(result.feedback || ''),
      }));

    } catch (error) {
      logger.error('解析模型返回结果失败:', error);
      throw new Error(`解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 测试模型连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: CONFIG.model.model,
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a test message. Please respond with "OK".',
          },
        ],
        max_tokens: 10,
        temperature: 0,
        stream: false,
      });

      return Boolean(response.choices[0]?.message?.content);
    } catch (error) {
      logger.error('模型连接测试失败:', error);
      return false;
    }
  }
}
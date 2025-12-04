import { z } from 'zod';

// 作业题目类型
export const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['choice', 'fill', 'essay', 'calculation']),
  content: z.string(),
  standardAnswer: z.string().optional(),
  points: z.number().default(5),
});

export type Question = z.infer<typeof QuestionSchema>;

// 作业提交类型
export const HomeworkSubmissionSchema = z.object({
  id: z.string(),
  studentName: z.string(),
  subject: z.string(),
  imageData: z.string(), // Base64编码的图片数据
  questions: z.array(QuestionSchema).optional(),
  submittedAt: z.string().datetime(),
});

export type HomeworkSubmission = z.infer<typeof HomeworkSubmissionSchema>;

// 批改结果类型 - 包含题目内容
export const GradingResultSchema = z.object({
  questionId: z.string(),
  questionContent: z.string().optional(), // 题目内容
  isCorrect: z.boolean(),
  studentAnswer: z.string(),
  correctAnswer: z.string(),
  explanation: z.string(),
  score: z.number(),
  maxScore: z.number(),
  feedback: z.string(),
});

export type GradingResult = z.infer<typeof GradingResultSchema>;

// 作业批改响应类型
export const HomeworkGradingResponseSchema = z.object({
  submissionId: z.string(),
  totalScore: z.number(),
  maxTotalScore: z.number(),
  grade: z.enum(['A', 'B', 'C', 'D', 'F']),
  results: z.array(GradingResultSchema),
  overallFeedback: z.string(),
  gradedAt: z.string().datetime(),
});

export type HomeworkGradingResponse = z.infer<typeof HomeworkGradingResponseSchema>;

// 支持Base64和URL的MCP工具参数类型
export const GradeHomeworkParamsSchema = z.union([
  z.object({
    imageData: z.string().describe('Base64编码的作业图片'),
    subject: z.string().optional().default('自动识别').describe('作业科目'),
    studentName: z.string().optional().default('学生').describe('学生姓名'),
    questions: z.array(QuestionSchema).optional().describe('题目信息'),
  }),
  z.object({
    imageUrl: z.string().url('请输入有效的图片URL地址').describe('作业图片的URL地址'),
    subject: z.string().optional().default('自动识别').describe('作业科目'),
    studentName: z.string().optional().default('学生').describe('学生姓名'),
    questions: z.array(QuestionSchema).optional().describe('题目信息'),
  })
]);

export type GradeHomeworkParams = z.infer<typeof GradeHomeworkParamsSchema>;

// 模型配置类型
export interface ModelConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}
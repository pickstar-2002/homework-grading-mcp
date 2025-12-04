import { randomUUID } from 'crypto';
import { ModelService } from './modelService.js';
import { logger } from '../utils/logger.js';
import { compressImageData } from '../utils/image.js';
import { validateBase64Image } from '../utils/imageDownloader.js';
import {
  HomeworkSubmission,
  HomeworkGradingResponse,
  GradeHomeworkParams,
  Question,
  GradingResult,
} from '../types.js';

export class GradingService {
  private modelService: ModelService;

  constructor() {
    this.modelService = new ModelService();
  }

  /**
   * 批改作业主方法 - 支持Base64和URL
   */
  async gradeHomework(params: GradeHomeworkParams): Promise<HomeworkGradingResponse> {
    try {
      // 验证输入参数
      this.validateInput(params);

      // 获取图片数据（支持Base64和URL）
      let imageData: string;
      if ('imageUrl' in params && params.imageUrl) {
        const { downloadImageAsBase64 } = await import('../utils/imageDownloader.js');
        imageData = await downloadImageAsBase64(params.imageUrl);
      } else if ('imageData' in params && params.imageData) {
        imageData = params.imageData;
      } else {
        throw new Error('未提供有效的图片数据');
      }

      // 处理图片数据
      const processedImageData = this.processImageData(imageData);

      // 创建作业提交记录
      const submission: HomeworkSubmission = {
        id: randomUUID(),
        studentName: params.studentName,
        subject: params.subject,
        imageData: processedImageData,
        questions: params.questions,
        submittedAt: new Date().toISOString(),
      };

      // 调用AI模型进行批改
      const gradingResults = await this.modelService.gradeHomework(
        processedImageData,
        params.subject,
        params.studentName,
        params.questions
      );

      // 构建批改响应
      const response = this.buildGradingResponse(submission.id, gradingResults);

      return response;

    } catch (error) {
      throw new Error(`批改失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 验证输入参数
   */
  private validateInput(params: GradeHomeworkParams): void {
    // 检查是否有图片数据（支持Base64和URL）
    const hasImageData = 'imageData' in params && params.imageData && params.imageData.trim() !== '';
    const hasImageUrl = 'imageUrl' in params && params.imageUrl && params.imageUrl.trim() !== '';
    
    if (!hasImageData && !hasImageUrl) {
      throw new Error('必须提供图片数据（imageData或imageUrl）');
    }

    if (!params.studentName || params.studentName.trim() === '') {
      throw new Error('学生姓名不能为空');
    }

    if (!params.subject || params.subject.trim() === '') {
      throw new Error('作业科目不能为空');
    }

    // 验证Base64图片格式（如果是Base64方式）
    if (hasImageData) {
      const validation = validateBase64Image(params.imageData);
      if (!validation.isValid) {
        throw new Error(`图片格式不正确：${validation.error}`);
      }
    }
  }

  /**
   * 处理图片数据
   */
  private processImageData(imageData: string): string {
    try {
      // 压缩图片（限制在1MB以内）
      const compressedImage = compressImageData(imageData, 1024);
      return compressedImage;
    } catch (error) {
      return imageData;
    }
  }

  /**
   * 构建批改响应
   */
  private buildGradingResponse(
    submissionId: string,
    gradingResults: GradingResult[]
  ): HomeworkGradingResponse {
    // 计算总分
    const totalScore = gradingResults.reduce((sum, result) => sum + result.score, 0);
    const maxTotalScore = gradingResults.reduce((sum, result) => sum + result.maxScore, 0);

    // 计算等级
    const grade = this.calculateGrade(totalScore, maxTotalScore);

    // 生成总体反馈
    const overallFeedback = this.generateOverallFeedback(gradingResults, totalScore, maxTotalScore);

    return {
      submissionId,
      totalScore,
      maxTotalScore,
      grade,
      results: gradingResults,
      overallFeedback,
      gradedAt: new Date().toISOString(),
    };
  }

  /**
   * 计算等级
   */
  private calculateGrade(score: number, maxScore: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  /**
   * 生成总体反馈
   */
  private generateOverallFeedback(
    results: GradingResult[],
    totalScore: number,
    maxTotalScore: number
  ): string {
    const correctCount = results.filter(r => r.isCorrect).length;
    const totalCount = results.length;
    const percentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;

    let feedback = '';

    if (percentage >= 90) {
      feedback = '优秀！作业完成得非常出色，继续保持！';
    } else if (percentage >= 80) {
      feedback = '良好！整体表现不错，还有提升空间。';
    } else if (percentage >= 70) {
      feedback = '中等！需要更加努力，注意细节。';
    } else if (percentage >= 60) {
      feedback = '及格！需要加强学习，多做练习。';
    } else {
      feedback = '需要改进！建议重新学习相关知识，寻求帮助。';
    }

    feedback += `\n\n详细情况：\n`;
    feedback += `- 总得分：${totalScore}/${maxTotalScore} (${percentage.toFixed(1)}%)\n`;
    feedback += `- 正确题数：${correctCount}/${totalCount}\n`;
    feedback += `- 错误题数：${totalCount - correctCount}/${totalCount}\n`;

    if (correctCount < totalCount) {
      feedback += `\n建议重点复习以下知识点：\n`;
      results
        .filter(r => !r.isCorrect)
        .slice(0, 3) // 只显示前3个错误
        .forEach((result, index) => {
          feedback += `${index + 1}. ${result.explanation}\n`;
        });
    }

    return feedback;
  }

  /**
   * 批量批改作业
   */
  async batchGradeHomework(submissions: GradeHomeworkParams[]): Promise<HomeworkGradingResponse[]> {
    logger.info(`开始批量批改 ${submissions.length} 份作业`);

    const results: HomeworkGradingResponse[] = [];
    const errors: string[] = [];

    for (let i = 0; i < submissions.length; i++) {
      const submission = submissions[i];
      try {
        const result = await this.gradeHomework(submission);
        results.push(result);
        logger.info(`第 ${i + 1}/${submissions.length} 份作业批改完成`);
      } catch (error) {
        const errorMsg = `第 ${i + 1} 份作业(${submission.studentName})批改失败: ${error instanceof Error ? error.message : '未知错误'}`;
        logger.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    if (errors.length > 0) {
      logger.warn(`批量批改完成，其中 ${errors.length} 份作业批改失败`);
    } else {
      logger.info(`批量批改完成，所有 ${results.length} 份作业都成功批改`);
    }

    return results;
  }
}
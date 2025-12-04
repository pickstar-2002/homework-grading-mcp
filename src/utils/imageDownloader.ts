import { logger } from './logger.js';

/**
 * 下载图片URL并转换为Base64 - 增强版，支持重定向和复杂URL
 */
export async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  try {
    logger.info(`正在下载图片: ${imageUrl}`);
    
    // 验证URL格式
    const url = new URL(imageUrl);
    
    // 检查支持的图片格式（包括URL参数中的格式）
    const supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const fullUrl = imageUrl.toLowerCase();
    const pathname = url.pathname.toLowerCase();
    
    // 检查URL路径或参数中是否包含支持的图片格式
    const hasImageFormat = supportedFormats.some(format => 
      pathname.endsWith(format) || fullUrl.includes(format)
    );
    
    // 对于CDN链接，即使没有明确的后缀也允许下载
    const isCDNLink = url.hostname.includes('cdn') || 
                      url.hostname.includes('sohu') || 
                      url.hostname.includes('aliyun') ||
                      url.hostname.includes('qcloud');

    if (!hasImageFormat && !isCDNLink) {
      logger.warn(`URL格式检查警告: ${imageUrl}，但将继续尝试下载`);
    }

    // 使用fetch下载图片（使用AbortController实现超时）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时，给CDN更多时间
    
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': url.origin, // 设置正确的Referer
        'Cache-Control': 'no-cache'
      },
      redirect: 'follow', // 自动跟随重定向
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`图片下载失败: ${response.status} ${response.statusText}`);
    }

    // 获取Content-Type，支持多种图片格式
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    logger.info(`检测到的Content-Type: ${contentType}`);
    
    // 验证是否为图片（支持更多格式）
    const supportedContentTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
      'image/webp', 'image/bmp', 'image/x-icon', 'image/svg+xml'
    ];
    
    if (!supportedContentTypes.some(type => contentType.includes(type))) {
      // 如果Content-Type不是图片，但URL看起来像是图片，仍然尝试处理
      if (isCDNLink || hasImageFormat) {
        logger.warn(`Content-Type检查警告: ${contentType}，但URL格式像图片，将继续处理`);
      } else {
        throw new Error(`URL返回的内容不是图片格式: ${contentType}`);
      }
    }

    // 将图片转换为ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 转换为Base64
    const base64 = buffer.toString('base64');
    
    // 检查文件大小（最大10MB，给大图更多空间）
    const fileSizeMB = buffer.length / (1024 * 1024);
    if (fileSizeMB > 10) {
      throw new Error(`图片文件过大（${fileSizeMB.toFixed(2)}MB），请使用小于10MB的图片`);
    }
    
    logger.info(`图片下载成功，大小: ${fileSizeMB.toFixed(2)}MB，格式: ${contentType}`);
    
    // 返回data URL格式
    return `data:${contentType};base64,${base64}`;
    
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`图片URL无法访问: ${error.message}，请检查网络连接和URL有效性`);
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('图片下载超时，请检查网络连接或稍后重试');
    }
    throw error;
  }
}

/**
 * 验证Base64图片格式
 */
export function validateBase64Image(imageData: string): { isValid: boolean; format?: string; error?: string } {
  try {
    // 检查data URL格式
    const dataUrlRegex = /^data:image\/(png|jpe?g|gif);base64,[A-Za-z0-9+/]+=*$/;
    
    if (!dataUrlRegex.test(imageData)) {
      // 如果不是data URL格式，检查是否为纯Base64
      const base64Regex = /^[A-Za-z0-9+/]+=*$/;
      if (!base64Regex.test(imageData)) {
        return { isValid: false, error: '无效的Base64图片格式' };
      }
      
      // 纯Base64，默认认为是JPEG格式
      return { isValid: true, format: 'jpeg' };
    }
    
    // 提取图片格式
    const formatMatch = imageData.match(/^data:image\/(png|jpe?g|gif);base64,/);
    const format = formatMatch ? formatMatch[1] : 'unknown';
    
    // 移除data URL前缀，验证Base64内容
    const base64Content = imageData.replace(/^data:image\/\w+;base64,/, '');
    
    // 检查Base64长度（最大5MB）
    const maxLength = 5 * 1024 * 1024 * 4 / 3; // 5MB的Base64最大长度
    if (base64Content.length > maxLength) {
      return { isValid: false, error: '图片文件过大，请使用小于5MB的图片' };
    }
    
    return { isValid: true, format };
    
  } catch (error) {
    return { isValid: false, error: '图片验证失败：' + (error instanceof Error ? error.message : '未知错误') };
  }
}

/**
 * 检测输入类型（URL还是Base64）
 */
export function detectInputType(input: string): 'url' | 'base64' | 'unknown' {
  // 检查是否为URL
  try {
    new URL(input);
    return 'url';
  } catch {
    // 不是URL，检查是否为Base64
    if (input.startsWith('data:image/') || /^[A-Za-z0-9+/]+=*$/.test(input)) {
      return 'base64';
    }
    return 'unknown';
  }
}
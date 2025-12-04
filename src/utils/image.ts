/**
 * 图片处理工具函数
 */

/**
 * 验证Base64图片数据
 */
export function validateBase64Image(imageData: string): boolean {
  const base64Regex = /^data:image\/(png|jpg|jpeg|gif|bmp|webp);base64,[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(imageData);
}

/**
 * 提取图片格式
 */
export function getImageFormat(imageData: string): string {
  const match = imageData.match(/^data:image\/(png|jpg|jpeg|gif|bmp|webp);base64,/);
  return match ? match[1] : 'unknown';
}

/**
 * 将Base64图片转换为OpenAI API格式
 */
export function convertToOpenAIImageFormat(imageData: string): string {
  // 移除data URL前缀，只保留Base64编码部分
  return imageData.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
}

/**
 * 压缩图片（通过降低质量）
 */
export function compressImageData(imageData: string, maxSizeKB: number = 1024): string {
  // 简单的尺寸检查，实际压缩需要更复杂的处理
  const base64Length = imageData.length;
  const sizeInKB = (base64Length * 3) / 4 / 1024;
  
  if (sizeInKB <= maxSizeKB) {
    return imageData;
  }
  
  // 这里可以实现实际的图片压缩逻辑
  // 目前只是返回原图，实际项目中可以使用Sharp等库进行压缩
  console.warn(`图片大小 ${sizeInKB.toFixed(2)}KB 超过限制 ${maxSizeKB}KB，建议压缩`);
  return imageData;
}

/**
 * 生成图片URL（用于调试和测试）
 */
export function createObjectURLFromBase64(imageData: string): string {
  return URL.createObjectURL(dataURLToBlob(imageData));
}

/**
 * 将DataURL转换为Blob对象
 */
function dataURLToBlob(dataURL: string): Blob {
  const parts = dataURL.split(',');
  const header = parts[0];
  const data = parts[1];
  
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  
  return new Blob([array], { type: mime });
}
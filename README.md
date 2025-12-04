# 📝 作业批改 MCP

<div align="center">

[![npm version](https://badge.fury.io/js/@pickstar-2002%2Fhomework-grading-mcp.svg)](https://badge.fury.io/js/@pickstar-2002%omework-grading-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-orange.svg)](https://modelcontextprotocol.io/)
[![Downloads](https://img.shields.io/npm/dm/@pickstar-2002/homework-grading-mcp.svg)](https://www.npmjs.com/package/@pickstar-2002/homework-grading-mcp)
[![Last Commit](https://img.shields.io/github/last-commit/pickstar-2002/homework-grading-mcp.svg)](https://github.com/pickstar-2002/homework-grading-mcp)

</div>

## 🌟 项目简介

**作业批改 MCP** 是一个基于 Model Context Protocol (MCP) 的智能作业批改服务，通过集成魔搭社区的 Qwen3-VL-235B-A22B-Instruct 多模态模型，实现对学生作业图片的智能识别和批改。

### ✨ 核心功能

- 🎯 **智能识别**: 自动识别作业图片中的题目和学生答案
- 🔍 **精准批改**: 逐题判断答案正确性，提供详细评分
- 💡 **智能解析**: 为每道题提供简洁明了的解析说明
- 📊 **结构化输出**: 按照标准格式输出批改结果
- 🚀 **批量处理**: 支持同时批改多份作业
- 🎨 **多科支持**: 支持数学、语文、英语等多个学科
- 🌐 **URL支持**: 支持Base64和URL两种方式上传图片
- ⚡ **CDN兼容**: 支持各种CDN图片链接，自动处理重定向

## 🚀 快速开始

### 📋 环境要求

- Node.js >= 18.0.0
- npm 或 pnpm 包管理器
- 魔搭社区 API 密钥

### 📦 安装

#### 全局安装（推荐）

```bash
npm install -g @pickstar-2002/homework-grading-mcp@latest
```

#### 本地安装

```bash
npm install @pickstar-2002/homework-grading-mcp@latest
```

### ⚙️ 配置

1. **获取魔搭社区 API 密钥**
   - 访问 [魔搭社区](https://www.modelscope.cn/)
   - 注册账号并获取 API 密钥

2. **设置环境变量**
   
   创建 `.env` 文件：
   ```bash
   cp .env.example .env
   ```
   
   编辑 `.env` 文件，填入你的 API 密钥：
   ```env
   MODELSCOPE_API_KEY=your-modelscope-api-key-here
   ```

## 🔧 使用说明

### 🏃‍♂️ 命令行启动

```bash
# 直接运行
homework-grading-mcp

# 或使用 npx（推荐）
npx @pickstar-2002/homework-grading-mcp@latest
```

### 🔌 IDE 集成配置

#### VS Code + Cline 配置

1. **安装 Cline 插件**：在 VS Code 扩展商店搜索并安装 "Cline" 插件

2. **配置 MCP 服务器**：在 VS Code 设置中搜索 "MCP"，找到 Cline 的 MCP 配置

3. **添加服务器配置**：

```json
{
  "mcpServers": {
    "homework-grading": {
      "command": "npx",
      "args": ["@pickstar-2002/homework-grading-mcp@latest"],
      "env": {
        "MODELSCOPE_API_KEY": "your-modelscope-api-key-here"
      }
    }
  }
}
```

4. **重启 VS Code**：配置完成后重启 VS Code 使配置生效

#### Claude Desktop 配置

1. **找到配置文件**：
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. **编辑配置文件**，添加 MCP 服务器配置：

```json
{
  "mcpServers": {
    "homework-grading": {
      "command": "npx",
      "args": ["@pickstar-2002/homework-grading-mcp@latest"],
      "env": {
        "MODELSCOPE_API_KEY": "your-modelscope-api-key-here"
      }
    }
  }
}
```

3. **重启 Claude Desktop**：保存配置后重启应用

#### 其他 MCP 客户端

任何支持 MCP 协议的客户端都可以使用，配置方式类似：

```json
{
  "command": "npx",
  "args": ["@pickstar-2002/homework-grading-mcp@latest"],
  "env": {
    "MODELSCOPE_API_KEY": "your-api-key"
  }
}
```

### 🎯 使用示例

#### 方式1：使用图片URL（推荐）

```json
{
  "tool": "grade_homework",
  "arguments": {
    "imageUrl": "https://example.com/homework.jpg",
    "subject": "数学",
    "studentName": "张三"
  }
}
```

#### 方式2：使用Base64图片数据

```json
{
  "tool": "grade_homework",
  "arguments": {
    "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "subject": "数学",
    "studentName": "张三"
  }
}
```

#### 方式3：批量批改作业

```json
{
  "tool": "batch_grade_homework",
  "arguments": {
    "submissions": [
      {
        "imageUrl": "https://example.com/student1-homework.jpg",
        "subject": "数学",
        "studentName": "张三"
      },
      {
        "imageUrl": "https://example.com/student2-homework.jpg",
        "subject": "数学",
        "studentName": "李四"
      }
    ]
  }
}
```

#### 方式4：指定题目信息（可选）

```json
{
  "tool": "grade_homework",
  "arguments": {
    "imageUrl": "https://example.com/homework.jpg",
    "subject": "数学",
    "studentName": "张三",
    "questions": [
      {
        "id": "q1",
        "type": "calculation",
        "content": "计算 2 + 3 = ?",
        "standardAnswer": "5",
        "points": 5
      },
      {
        "id": "q2", 
        "type": "choice",
        "content": "下列哪个是偶数？A. 3 B. 4 C. 5",
        "standardAnswer": "B",
        "points": 5
      }
    ]
  }
}
```

#### 实际使用场景示例

**场景1：数学老师批改几何作业**
```json
{
  "tool": "grade_homework",
  "arguments": {
    "imageUrl": "https://5b0988e595225.cdn.sohucs.com/images/20180108/86e7ed5ce5154f5e8df5ae422ce61f93.jpeg",
    "subject": "数学",
    "studentName": "王同学"
  }
}
```

**场景2：语文老师批改作文**
```json
{
  "tool": "grade_homework",
  "arguments": {
    "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "subject": "语文",
    "studentName": "李同学"
  }
}
```

## 📊 返回结果格式

### 批改结果结构

```typescript
interface HomeworkGradingResponse {
  submissionId: string;          // 提交ID
  totalScore: number;            // 总得分
  maxTotalScore: number;         // 满分
  grade: 'A' | 'B' | 'C' | 'D' | 'F';  // 等级
  results: GradingResult[];      // 每题详细结果
  overallFeedback: string;       // 总体反馈
  gradedAt: string;              // 批改时间
}

interface GradingResult {
  questionId: string;            // 题目ID
  isCorrect: boolean;            // 是否正确
  studentAnswer: string;         // 学生答案
  correctAnswer: string;         // 正确答案
  explanation: string;           // 解析说明
  score: number;                 // 得分
  maxScore: number;              // 满分
  feedback: string;              // 反馈意见
}
```

## 🛠️ 开发指南

### 📁 项目结构

```
├── src/
│   ├── config.ts              # 配置文件
│   ├── types.ts               # TypeScript 类型定义
│   ├── index.ts               # 主入口文件
│   ├── services/              # 服务层
│   │   ├── modelService.ts    # 模型服务
│   │   └── gradingService.ts  # 批改服务
│   ├── tools/                 # MCP工具
│   │   └── gradingTools.ts    # 批改工具定义
│   └── utils/                 # 工具函数
│       ├── logger.ts          # 日志工具
│       └── image.ts           # 图片处理工具
├── package.json
├── tsconfig.json
└── README.md
```

### 🏗️ 本地开发

1. **克隆项目**
   ```bash
   git clone https://github.com/pickstar-2002/homework-grading-mcp.git
   cd homework-grading-mcp
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填入 API 密钥
   ```

4. **开发运行**
   ```bash
   npm run dev
   ```

5. **构建项目**
   ```bash
   npm run build
   ```

### 🧪 测试

```bash
# 运行测试（如果有）
npm test

# 启动开发服务器进行测试
npm run dev
```

## 🔧 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `MODELSCOPE_API_KEY` | 魔搭社区 API 密钥 | 必填 |
| `MCP_SERVER_NAME` | MCP 服务器名称 | `homework-grading-mcp` |
| `MCP_SERVER_VERSION` | MCP 服务器版本 | `1.0.0` |
| `LOG_LEVEL` | 日志级别 | `info` |

## 🎨 支持的题型

- ✅ **选择题** (choice)
- ✅ **填空题** (fill)
- ✅ **计算题** (calculation)
- ✅ **作文题** (essay)

## 📚 支持的科目

- 📐 **数学** - 计算题、应用题、几何题等
- 📖 **语文** - 阅读理解、作文、古诗词等
- 🌍 **英语** - 语法、翻译、作文等
- 🧪 **物理** - 计算题、实验题等
- ⚗️ **化学** - 方程式、计算题等
- 🌏 **地理** - 地图题、简答题等
- 🏛️ **历史** - 简答题、材料题等
- 🧬 **生物** - 简答题、实验题等

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📝 更新日志

### v1.0.0 (2025-01-01)
- 🎉 初始版本发布
- ✨ 支持单份作业批改
- 📚 支持批量作业批改
- 🎯 支持多种题型
- 📊 提供详细批改结果

## 🐛 常见问题

### Q: 模型连接失败怎么办？
A: 请检查：
1. API 密钥是否正确配置
2. 网络连接是否正常
3. 魔搭社区服务是否可用

### Q: 支持哪些图片格式？
A: 支持 JPEG、PNG、GIF、BMP、WebP 等常见格式

### Q: 批改准确率如何？
A: 基于 Qwen3-VL 多模态模型，准确率较高，但建议人工复核重要作业

### Q: 可以自定义评分标准吗？
A: 目前使用内置评分标准，后续版本将支持自定义评分规则

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

## 👤 作者

**pickstar-2002**

- 📧 邮箱: pickstar-2002@example.com
- 🌐 GitHub: [@pickstar-2002](https://github.com/pickstar-2002)

## 🙏 致谢

- [Model Context Protocol](https://modelcontextprotocol.io/) - 提供 MCP 协议支持
- [魔搭社区](https://www.modelscope.cn/) - 提供 Qwen3-VL 模型服务
- [OpenAI](https://openai.com/) - 提供 OpenAI SDK

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

Made with ❤️ by pickstar-2002

</div>
# 计划引航

> AI 引导式任务录入、目标拆解和自动时间规划工具。

计划引航（Plan Pilot）是一个本地优先的个人规划应用。它会主动询问必要信息，帮助你把长期/月度/本周/今日目标逐层澄清，自动识别会议、监考、通勤等不可用时间，并把任务安排进可执行的日程块。

它不是简单待办清单：普通 Todo 只记录“我要做什么”，计划引航更关注“目标如何拆解、今天先做哪一步、时间够不够、哪些安排不能被打断、计划变化后如何调整”。

作者：Yang Yu（[@YangYu-NUAA](https://github.com/YangYu-NUAA)）

## 项目定位

- 面向需要长期目标推进的人：科研、写作、项目申请、课程建设、个人学习计划等。
- 面向每天任务经常变化的人：会议、出差、协作反馈、临时事项都会影响当天排期。
- 面向希望使用自己大模型 Key 的人：支持多家 OpenAI-compatible 服务和 Claude / Opus。
- 本地优先：没有账号系统，不上传个人规划数据，适合作为个人工具原型继续扩展。

## 适合做什么

- 早上快速收集今天的固定安排、关键任务和风险变化。
- 把长期目标拆成月度目标，再拆成本周目标和今日任务。
- 让 AI 主动追问缺失信息，辅助形成可执行任务。
- 根据工作时间、不可用时间、任务优先级和预计用时自动排期。
- 晚上复盘完成情况、阻碍和明日重点。
- 使用自己的 API Key 接入常见大模型服务商。

## 功能概览

- 今日规划：固定安排、今日重点、变化风险、精力状态、任务收集。
- 目标拆解：长期/月度/本周目标层级管理，一键生成下一层计划建议。
- AI 规划访谈：模型先问关键问题，再生成目标、任务或不可用时间块。
- 自动时间分配：避开会议、监考、通勤等不可用时间；不确定任务会提示你手动决定位置。
- 每日复盘：记录完成事项、阻碍、调整和明日焦点。
- 本地数据：计划数据默认保存在浏览器 `localStorage`。
- 数据导入导出：导出 JSON 不包含 API Key。
- 多模型接入：支持 OpenAI-compatible 和 Anthropic Messages 两类协议。

## 快速开始

需要安装 Node.js 18 或更高版本。

```bash
npm install
npm run dev
```

打开：

```text
http://127.0.0.1:5173/
```

生产构建：

```bash
npm run build
npm run preview
```

## 使用方法

1. 在左侧设置工作开始、工作结束和任务间隔时间。
2. 如果需要 AI 辅助，勾选“启用 AI 辅助”，选择服务商，填写自己的 API Key、模型名和 API 地址。
3. 在“今日”页填写固定安排，例如会议、监考、通勤、已约定事项。
4. 填写“今日最重要”和“变化与风险”，保存晨间规划。
5. 在任务收集中录入今天要做的任务，也可以点击“AI 今日建议”让模型主动追问或生成建议任务。
6. 点击“自动安排”，系统会按优先级、预计用时、固定时间块和会前/会后顺序排期。
7. 如果有任务无法可靠自动安排，页面会显示“需要你判断放在哪里”，你可以手动指定时间块。
8. 在“目标”页新增长期、月度或本周目标，再使用“生成拆解”得到下一层计划。
9. 在“复盘”页记录完成情况、阻碍、调整和明日重点。
10. 定期导出 JSON 备份；导出的文件不会包含 API Key。

## AI 服务商

侧边栏可以选择常见服务商，也可以手动改模型名和 API 地址。默认预设包括：

- OpenAI：`https://api.openai.com/v1`
- DeepSeek：`https://api.deepseek.com`
- Kimi / Moonshot：`https://api.moonshot.ai/v1`
- 通义千问 / DashScope：`https://dashscope.aliyuncs.com/compatible-mode/v1`
- 智谱 GLM：`https://open.bigmodel.cn/api/paas/v4`
- 豆包 / 火山方舟：`https://ark.cn-beijing.volces.com/api/v3`
- 百度千帆 / 文心：`https://qianfan.baidubce.com/v2`
- Google Gemini：`https://generativelanguage.googleapis.com/v1beta/openai`
- OpenRouter：`https://openrouter.ai/api/v1`
- SiliconFlow：`https://api.siliconflow.cn/v1`
- 腾讯混元：`https://api.hunyuan.cloud.tencent.com/v1`
- Mistral：`https://api.mistral.ai/v1`
- xAI / Grok：`https://api.x.ai/v1`
- Groq：`https://api.groq.com/openai/v1`
- Perplexity：`https://api.perplexity.ai`
- MiniMax：`https://api.minimax.io/v1`
- MiMo：`https://api.xiaomimimo.com/v1`
- StepFun：`https://api.stepfun.ai/v1`
- Claude / Opus：`https://api.anthropic.com`
- 自定义 OpenAI 兼容接口

说明：

- OpenAI-compatible 服务通常会请求 `/chat/completions`。
- Claude / Opus 使用 Anthropic Messages API。
- 不同账号和地区可用模型名可能不同，请以供应商控制台为准。
- API Key 只保存在当前浏览器本地，不会写入仓库，也不会出现在导出 JSON 里。

## 环境变量

通常直接在页面里填写 API Key 即可。如果想通过本地环境变量提供默认 Key，可以参考 `.env.example`：

```bash
AI_API_KEY=
DEEPSEEK_API_KEY=
ANTHROPIC_API_KEY=
```

`.env` 和 `.env.*` 已在 `.gitignore` 中忽略，请不要提交真实 Key。

## 数据与隐私

- 默认没有账号系统，没有云端数据库。
- 计划数据保存在本机浏览器。
- API 请求通过当前 Vite dev server 的 `/api/ai/chat` 代理转发。
- 开源仓库不会包含任何个人 API Key。
- 分享给别人使用时，请让对方填写自己的 API Key。

## 给别人体验

完整 AI 功能需要本地代理，因此推荐把仓库地址发给体验者，让对方运行：

```bash
git clone https://github.com/YangYu-NUAA/plan-pilot.git
cd plan-pilot
npm install
npm run dev
```

如果只想体验非 AI 功能，也可以运行：

```bash
npm run build
npm run preview
```

## 目录结构

```text
.
├── public/                 # PWA manifest、图标、service worker
├── src/
│   ├── App.jsx             # 主应用逻辑
│   ├── main.jsx            # React 入口
│   └── styles.css          # 样式
├── vite.config.js          # Vite 配置和本地 AI 代理
├── package.json
├── .env.example
├── LICENSE
└── README.md
```

## 开机自启动

### Windows

1. 创建 `startup.bat`：
   ```bat
   @echo off
   cd /d <项目路径>
   start "" http://127.0.0.1:5174
   npx vite --host 127.0.0.1 --port 5174
   ```
   将 `<项目路径>` 替换为本项目实际路径。

2. 按 `Win + R`，输入 `shell:startup`，回车打开启动文件夹。

3. 右键 → 新建快捷方式 → 选择 `startup.bat` → 下一步 → 完成。

下次开机即自动在 `http://127.0.0.1:5174` 启动计划引航。

> 可将 `startup.bat` 加入 `.gitignore`，避免将本地路径提交到仓库。

## 许可证

MIT License

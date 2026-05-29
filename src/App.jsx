import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlarmClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  ListChecks,
  Moon,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";

const APP_NAME = "计划引航";
const APP_SHORT_NAME = "引航";
const STORAGE_KEY = "personal-planning-coach-v1";

const priorityOrder = { high: 3, medium: 2, low: 1 };
const priorityLabel = { high: "高", medium: "中", low: "低" };
const goalTypeLabel = { long: "长期", month: "月度", week: "本周" };
const energyOptions = ["偏低", "正常", "充沛"];
const AI_PROVIDER_PRESETS = {
  openai: {
    label: "OpenAI",
    protocol: "openai-compatible",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-5.2",
    note: "适合复杂规划与推理；也可改成 gpt-5-mini 等更轻模型。",
  },
  deepseek: {
    label: "DeepSeek",
    protocol: "openai-compatible",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-v4-pro",
    note: "DeepSeek 官方 OpenAI-compatible 接口。",
  },
  kimi: {
    label: "Kimi / Moonshot",
    protocol: "openai-compatible",
    baseUrl: "https://api.moonshot.ai/v1",
    model: "kimi-k2.5",
    note: "月之暗面 Kimi Open Platform，OpenAI-compatible。",
  },
  qwen: {
    label: "通义千问 / DashScope",
    protocol: "openai-compatible",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    note: "阿里云百炼/DashScope 兼容模式；国际站可改为 dashscope-intl 地址。",
  },
  glm: {
    label: "智谱 GLM",
    protocol: "openai-compatible",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4.5",
    note: "智谱 BigModel OpenAI-compatible 接口。",
  },
  doubao: {
    label: "豆包 / 火山方舟",
    protocol: "openai-compatible",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    model: "",
    note: "火山方舟兼容 OpenAI 调用，模型名通常填控制台里的 endpoint/model id。",
  },
  qianfan: {
    label: "百度千帆 / 文心",
    protocol: "openai-compatible",
    baseUrl: "https://qianfan.baidubce.com/v2",
    model: "ernie-4.5-turbo-128k",
    note: "百度千帆兼容接口，模型名按控制台可用列表调整。",
  },
  gemini: {
    label: "Google Gemini",
    protocol: "openai-compatible",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-2.5-flash",
    note: "使用 Gemini 的 OpenAI-compatible endpoint。",
  },
  openrouter: {
    label: "OpenRouter",
    protocol: "openai-compatible",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-5.2",
    note: "聚合路由，可把模型名改成 OpenRouter 控制台里的任意模型。",
  },
  siliconflow: {
    label: "SiliconFlow",
    protocol: "openai-compatible",
    baseUrl: "https://api.siliconflow.cn/v1",
    model: "Qwen/Qwen3-235B-A22B-Instruct-2507",
    note: "硅基流动 OpenAI-compatible 接口，模型名按控制台可用列表调整。",
  },
  hunyuan: {
    label: "腾讯混元",
    protocol: "openai-compatible",
    baseUrl: "https://api.hunyuan.cloud.tencent.com/v1",
    model: "hunyuan-turbos-latest",
    note: "腾讯混元 OpenAI-compatible 接口，模型名按腾讯云控制台调整。",
  },
  mistral: {
    label: "Mistral",
    protocol: "openai-compatible",
    baseUrl: "https://api.mistral.ai/v1",
    model: "mistral-large-latest",
    note: "Mistral Chat Completions 接口。",
  },
  xai: {
    label: "xAI / Grok",
    protocol: "openai-compatible",
    baseUrl: "https://api.x.ai/v1",
    model: "grok-4-latest",
    note: "xAI OpenAI-compatible 接口。",
  },
  groq: {
    label: "Groq",
    protocol: "openai-compatible",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    note: "Groq OpenAI-compatible 接口，适合试用高速开源模型。",
  },
  perplexity: {
    label: "Perplexity",
    protocol: "openai-compatible",
    baseUrl: "https://api.perplexity.ai",
    model: "sonar-pro",
    note: "Perplexity Sonar 接口，适合带联网检索能力的模型。",
  },
  minimax: {
    label: "MiniMax",
    protocol: "openai-compatible",
    baseUrl: "https://api.minimax.io/v1",
    model: "MiniMax-M2.7",
    note: "MiniMax OpenAI-compatible 接口。",
  },
  mimo: {
    label: "MiMo",
    protocol: "openai-compatible",
    baseUrl: "https://api.xiaomimimo.com/v1",
    model: "mimo-v2-pro",
    note: "MiMo OpenAI-compatible 接口；如账号侧模型名不同，可直接改。",
  },
  stepfun: {
    label: "阶跃星辰 StepFun",
    protocol: "openai-compatible",
    baseUrl: "https://api.stepfun.ai/v1",
    model: "step-3.5-flash",
    note: "StepFun Chat Completions API。",
  },
  anthropic: {
    label: "Claude / Opus",
    protocol: "anthropic",
    baseUrl: "https://api.anthropic.com",
    model: "claude-opus-4-8",
    note: "使用 Anthropic Messages API。",
  },
  custom: {
    label: "自定义 OpenAI 兼容",
    protocol: "openai-compatible",
    baseUrl: "",
    model: "",
    note: "填写任何兼容 /chat/completions 的服务地址和模型名。",
  },
};

const defaultState = {
  settings: {
    workStart: "09:00",
    workEnd: "18:00",
    breakMinutes: 10,
  },
  ai: {
    enabled: false,
    provider: "deepseek",
    protocol: "openai-compatible",
    apiKey: "",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-v4-pro",
  },
  goals: [],
  tasks: [],
  blocks: [],
  dayPlans: {},
  reviews: [],
};

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateString, amount) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return getLocalDate(date);
}

function formatHumanDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(year, month - 1, day));
}

function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTime(minutes) {
  const hours = `${Math.floor(minutes / 60)}`.padStart(2, "0");
  const mins = `${minutes % 60}`.padStart(2, "0");
  return `${hours}:${mins}`;
}

function duration(start, end) {
  return Math.max(0, toMinutes(end) - toMinutes(start));
}

function sum(values) {
  return values.reduce((total, item) => total + item, 0);
}

function fieldValue(form, name, fallback = "") {
  return form?.elements?.[name]?.value ?? fallback;
}

function hydrateState(input) {
  return {
    ...defaultState,
    ...input,
    settings: { ...defaultState.settings, ...(input?.settings || {}) },
    ai: { ...defaultState.ai, ...(input?.ai || {}) },
    goals: Array.isArray(input?.goals)
      ? input.goals.map((g) => ({ progress: 0, ...g }))
      : [],
    tasks: mergeDuplicateTasks(Array.isArray(input?.tasks) ? input.tasks : []),
    blocks: Array.isArray(input?.blocks) ? input.blocks : [],
    dayPlans: input?.dayPlans && typeof input.dayPlans === "object" ? input.dayPlans : {},
    reviews: Array.isArray(input?.reviews) ? input.reviews : [],
  };
}

function makeBreakdown(goal, draft, selectedDate) {
  if (!goal) return [];
  const outcome = draft.outcome.trim() || goal.title;
  const blocker = draft.constraints.trim();
  const suffix = blocker ? `：${blocker}` : "";

  if (goal.type === "long") {
    return [
      { kind: "goal", type: "month", title: `明确「${goal.title}」的阶段成果`, priority: "high" },
      { kind: "goal", type: "month", title: `完成一个可检查版本：${outcome}`, priority: "high" },
      { kind: "goal", type: "month", title: `处理关键依赖${suffix || "并建立推进节奏"}`, priority: "medium" },
      { kind: "goal", type: "month", title: "安排一次阶段复盘与取舍", priority: "medium" },
    ];
  }

  if (goal.type === "month") {
    return [
      { kind: "goal", type: "week", title: `本周定义完成标准：${outcome}`, priority: "high" },
      { kind: "goal", type: "week", title: "本周完成第一版可交付物", priority: "high" },
      { kind: "goal", type: "week", title: `本周解决阻碍${suffix || "或确认资源"}`, priority: "medium" },
      { kind: "goal", type: "week", title: "本周留出反馈和修订窗口", priority: "medium" },
    ];
  }

  return [
    { kind: "task", date: selectedDate, title: `写清楚完成标准：${outcome}`, estimateMinutes: 30, priority: "high" },
    { kind: "task", date: selectedDate, title: `列出依赖、风险和下一步${suffix}`, estimateMinutes: 45, priority: "medium" },
    { kind: "task", date: selectedDate, title: `完成第一段可见推进：${goal.title}`, estimateMinutes: 90, priority: "high" },
    { kind: "task", date: addDays(selectedDate, 1), title: `检查结果并调整「${goal.title}」`, estimateMinutes: 45, priority: "medium" },
  ];
}

function extractJson(content) {
  const text = String(content || "").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] || text;

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error("AI 返回内容不是有效 JSON。");
  }
}

function tryExtractJson(content) {
  try {
    return extractJson(content);
  } catch {
    return null;
  }
}

function normalizePriority(priority) {
  return ["high", "medium", "low"].includes(priority) ? priority : "medium";
}

function estimateMinutesForTitle(title, fallback = 45) {
  const text = String(title || "");
  let estimate = Number(fallback) || 45;

  if (/初步设计|框架设计|方案设计|课题设计|研究设计|系统设计|方法设计|技术路线|整体方案|架构设计/.test(text)) {
    estimate = Math.max(estimate, 180);
  }
  if (/多智能体|水文|时序预测|金融|真实.*工程|CCF|论文|省青基|基金|课题/.test(text) && /设计|方案|框架|定义|目标/.test(text)) {
    estimate = Math.max(estimate, 180);
  }
  if (/撰写|写作|修改|整合|相关工作|文献|调研/.test(text)) {
    estimate = Math.max(estimate, 120);
  }
  if (/会议|开会|课题会|组会|研讨会|汇报|会谈/.test(text)) {
    estimate = Math.max(estimate, 60);
  }
  if (/购买|买票|订票|查票|回复|发送/.test(text)) {
    estimate = Math.min(Math.max(estimate, 10), 30);
  }

  return estimate;
}

function normalizeBreakdownItems(items, goal, selectedDate) {
  const expectedGoalType = goal?.type === "long" ? "month" : "week";
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      if (item.kind === "task") {
        return {
          kind: "task",
          title: String(item.title || "").trim(),
          date: /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : selectedDate,
          estimateMinutes: estimateMinutesForTitle(item.title, Math.max(10, Number(item.estimateMinutes) || 45)),
          priority: normalizePriority(item.priority),
        };
      }

      return {
        kind: "goal",
        type: ["month", "week"].includes(item.type) ? item.type : expectedGoalType,
        title: String(item.title || "").trim(),
        priority: normalizePriority(item.priority),
      };
    })
    .filter((item) => item.title);
}

function normalizeTaskSuggestions(items, selectedDate) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      id: uid("suggestion"),
      title: String(item.title || "").trim(),
      estimateMinutes: estimateMinutesForTitle(item.title, Math.max(10, Number(item.estimateMinutes) || 45)),
      priority: normalizePriority(item.priority),
      date: /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : selectedDate,
      goalId: String(item.goalId || ""),
      reason: String(item.reason || "").trim(),
    }))
    .filter((item) => item.title);
}

function normalizeCoachItems(items, selectedDate) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      if (item.kind === "goal") {
        return {
          id: uid("coach"),
          kind: "goal",
          type: ["long", "month", "week"].includes(item.type) ? item.type : "week",
          title: String(item.title || "").trim(),
          priority: normalizePriority(item.priority),
          parentId: String(item.parentId || ""),
        };
      }

      if (item.kind === "busy") {
        const start = /^\d{2}:\d{2}$/.test(item.start) ? item.start : parseTimeInSentence(item.title || "");
        if (!start) return null;
        const end = /^\d{2}:\d{2}$/.test(item.end)
          ? item.end
          : toTime(toMinutes(start) + defaultBusyDuration(item.title || ""));
        return {
          id: uid("coach"),
          kind: "busy",
          title: String(item.title || "固定安排").trim(),
          date: /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : selectedDate,
          start,
          end,
        };
      }

      return {
        id: uid("coach"),
        kind: "task",
        title: String(item.title || "").trim(),
        estimateMinutes: estimateMinutesForTitle(item.title, Math.max(10, Number(item.estimateMinutes) || 45)),
        priority: normalizePriority(item.priority),
        date: /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : selectedDate,
        goalId: String(item.goalId || ""),
      };
    })
    .filter((item) => item?.title);
}

function normalizeTitle(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[\s，。！？、,.!?;；:："'“”‘’（）()[\]【】《》<>-]/g, "")
    .trim();
}

function taskIdentity(task) {
  return `${task.date || ""}|${normalizeTitle(task.title)}`;
}

function goalIdentity(goal) {
  return `${goal.parentId || ""}|${goal.type || ""}|${normalizeTitle(goal.title)}`;
}

function mergeDuplicateTasks(tasks) {
  const byKey = new Map();

  tasks.forEach((task) => {
    const key = taskIdentity(task);
    if (!normalizeTitle(task.title)) return;

    const previous = byKey.get(key);
    if (!previous) {
      byKey.set(key, task);
      return;
    }

    const previousIsManual = !previous.goalId;
    const currentIsManual = !task.goalId;
    const shouldPreferCurrent =
      (!previousIsManual && currentIsManual) ||
      (previous.status !== "done" && task.status === "done") ||
      (previous.createdAt && task.createdAt && task.createdAt < previous.createdAt && previousIsManual === currentIsManual);

    if (shouldPreferCurrent) {
      byKey.set(key, { ...task, status: previous.status === "done" ? "done" : task.status });
    }
  });

  return [...byKey.values()];
}

function filterBreakdownItems(items, planner, goal) {
  const taskKeys = new Set(planner.tasks.map(taskIdentity));
  const goalKeys = new Set(planner.goals.map(goalIdentity));
  const nextTaskKeys = new Set();
  const nextGoalKeys = new Set();

  return items.filter((item) => {
    if (item.kind === "task") {
      const key = taskIdentity(item);
      if (!normalizeTitle(item.title) || taskKeys.has(key) || nextTaskKeys.has(key)) return false;
      nextTaskKeys.add(key);
      return true;
    }

    const key = goalIdentity({ ...item, parentId: goal.id });
    if (!normalizeTitle(item.title) || goalKeys.has(key) || nextGoalKeys.has(key)) return false;
    nextGoalKeys.add(key);
    return true;
  });
}

function filterTaskSuggestions(suggestions, existingTasks) {
  const taskKeys = new Set(existingTasks.map(taskIdentity));
  const nextTaskKeys = new Set();

  return suggestions.filter((task) => {
    const key = taskIdentity(task);
    if (!normalizeTitle(task.title) || taskKeys.has(key) || nextTaskKeys.has(key)) return false;
    nextTaskKeys.add(key);
    return true;
  });
}

function defaultBusyDuration(sentence) {
  if (/监考|考试/.test(sentence)) return 120;
  if (/火车|高铁|航班|出发|前往|返回|通勤/.test(sentence)) return 120;
  return 60;
}

function isBusySentence(sentence) {
  if (/购买|买票|订票|预订|查票|抢票/.test(sentence)) return false;
  return /会议|开会|课题会|组会|例会|研讨会|讨论|探讨|汇报|会谈|监考|考试|上课|答辩|面试|出发|前往|返回|通勤|火车|高铁|航班/.test(sentence);
}

function isMeetingSentence(sentence) {
  if (/购买|买票|订票|预订|查票|抢票/.test(sentence)) return false;
  return /会议|开会|课题会|组会|例会|研讨会|讨论|探讨|汇报|会谈/.test(sentence);
}

function isPostMeetingTask(title) {
  return /整理|总结|纪要|复盘|行动项|后续|待办|要点/.test(title) && /会|会议|课题|讨论|探讨|汇报|组会|研讨/.test(title);
}

function latestMeetingEnd(blocks) {
  const meetingBlocks = blocks.filter((block) => block.type === "busy" && isMeetingSentence(block.title || ""));
  if (!meetingBlocks.length) return null;
  return Math.max(...meetingBlocks.map((block) => toMinutes(block.end)));
}

function meetingEndForTask(taskTitle, blocks) {
  const meetingBlocks = blocks.filter((block) => block.type === "busy" && isMeetingSentence(block.title || ""));
  if (!meetingBlocks.length) return null;

  const title = String(taskTitle || "");
  const related = meetingBlocks.filter((block) => {
    const blockTitle = String(block.title || "");
    return (
      (/课题/.test(title) && /课题/.test(blockTitle)) ||
      (/组会/.test(title) && /组会/.test(blockTitle)) ||
      (/管桐/.test(title) && /管桐/.test(blockTitle)) ||
      (/教改/.test(title) && /教改/.test(blockTitle))
    );
  });

  return Math.max(...(related.length ? related : meetingBlocks).map((block) => toMinutes(block.end)));
}

function normalizeSentence(sentence) {
  return String(sentence || "")
    .replace(/\s+/g, " ")
    .replace(/^[，。；;、\s]+|[，。；;、\s]+$/g, "")
    .trim();
}

function parseTimeInSentence(sentence) {
  const match = sentence.match(/(凌晨|早上|上午|中午|下午|傍晚|晚上)?\s*(\d{1,2})\s*(?:[:：.点时]\s*(\d{1,2})?)?/);
  if (!match) return null;

  const marker = match[1] || "";
  let hour = Number(match[2]);
  const minute = Number(match[3] || 0);

  if (!marker && !/[:：.点时]/.test(match[0])) return null;
  if (hour > 23 || minute > 59) return null;
  if (/下午|傍晚|晚上/.test(marker) && hour < 12) hour += 12;
  if (marker === "中午" && hour < 11) hour += 12;

  return toTime(hour * 60 + minute);
}

function extractBusyBlocksFromText(text, date, existingBlocks = []) {
  const existingKeys = new Set(
    existingBlocks
      .filter((block) => block.date === date && block.type === "busy")
      .map((block) => `${block.start}|${normalizeTitle(block.title)}`),
  );

  return String(text || "")
    .split(/[\n。；;]/)
    .map(normalizeSentence)
    .filter((sentence) => sentence && isBusySentence(sentence))
    .map((sentence) => {
      const start = parseTimeInSentence(sentence);
      if (!start) return null;
      const end = toTime(toMinutes(start) + defaultBusyDuration(sentence));
      return {
        id: uid("block"),
        date,
        type: "busy",
        taskId: "",
        title: sentence,
        start,
        end,
        auto: false,
      };
    })
    .filter(Boolean)
    .filter((block) => {
      const key = `${block.start}|${normalizeTitle(block.title)}`;
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    });
}

function extractTimedTasksFromText(text, date, existingTasks = []) {
  const existingKeys = new Set(existingTasks.map(taskIdentity));

  return String(text || "")
    .split(/[\n。；;]/)
    .map(normalizeSentence)
    .filter((sentence) => sentence && isMeetingSentence(sentence) && parseTimeInSentence(sentence))
    .map((sentence) => ({
      id: uid("task"),
      title: sentence,
      estimateMinutes: defaultBusyDuration(sentence),
      priority: "high",
      goalId: "",
      date,
      status: "open",
      fixedTime: true,
      createdAt: new Date().toISOString(),
    }))
    .filter((task) => {
      const key = taskIdentity(task);
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    });
}

async function callPlanningAi({ ai, messages, maxTokens = 1800, json = true }) {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: ai.provider,
      protocol: ai.protocol || "openai-compatible",
      apiKey: ai.apiKey,
      baseUrl: ai.baseUrl,
      model: ai.model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.2,
      response_format: json ? { type: "json_object" } : undefined,
      thinking: { type: "disabled" },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || data.error || "AI 调用失败。");
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI 没有返回可用内容。");
  if (json) return extractJson(content);
  return tryExtractJson(content) || { message: content, items: [] };
}

function usePlannerStore() {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? hydrateState(JSON.parse(raw)) : defaultState;
    } catch {
      return defaultState;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return [state, setState];
}

function sortBlocks(blocks) {
  return [...blocks].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

function getFreeIntervals(settings, fixedBlocks) {
  const start = toMinutes(settings.workStart);
  const end = toMinutes(settings.workEnd);
  const fixed = sortBlocks(fixedBlocks).map((block) => ({
    start: toMinutes(block.start),
    end: toMinutes(block.end),
  }));
  const intervals = [];
  let cursor = start;

  fixed.forEach((block) => {
    if (block.start > cursor) {
      intervals.push({ start: cursor, end: Math.min(block.start, end) });
    }
    cursor = Math.max(cursor, block.end);
  });

  if (cursor < end) {
    intervals.push({ start: cursor, end });
  }

  return intervals.filter((interval) => interval.end > interval.start);
}

function buildAutoBlocks({ tasks, existingBlocks, settings, selectedDate }) {
  const todayBlocks = existingBlocks.filter((block) => block.date === selectedDate);
  const manualBlocks = todayBlocks.filter((block) => !block.auto);
  const scheduledTaskIds = new Set(manualBlocks.map((block) => block.taskId).filter(Boolean));
  const busyTaskTitles = new Set(
    manualBlocks
      .filter((block) => block.type === "busy")
      .map((block) => normalizeTitle(block.title)),
  );
  const candidates = tasks
    .filter((task) =>
      task.date === selectedDate &&
      task.status !== "done" &&
      !task.fixedTime &&
      !scheduledTaskIds.has(task.id) &&
      !busyTaskTitles.has(normalizeTitle(task.title))
    )
    .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
    .map((task) => {
      const postMeeting = isPostMeetingTask(task.title);
      const meetingEnd = postMeeting ? meetingEndForTask(task.title, manualBlocks) : null;

      return {
        ...task,
        needsPlacement: postMeeting && !meetingEnd,
        earliestStart: postMeeting && meetingEnd ? meetingEnd : toMinutes(settings.workStart),
      };
    });

  const intervals = getFreeIntervals(settings, manualBlocks);
  const autoBlocks = [];
  const questions = candidates
    .filter((task) => task.needsPlacement)
    .map((task) => ({
      id: uid("schedule-question"),
      taskId: task.id,
      title: task.title,
      estimateMinutes: Number(task.estimateMinutes) || 30,
      reason: "看起来是会后整理或后续行动，但我没找到对应会议时间。",
      hint: "请先添加会议的不可用时间块，或手动指定这个任务的开始时间。",
    }));
  const unscheduled = candidates.filter((task) => !task.needsPlacement);

  intervals.forEach((interval) => {
    let cursor = interval.start;

    while (unscheduled.length > 0 && cursor < interval.end) {
      const taskIndex = unscheduled.findIndex((task) => {
        const estimate = Number(task.estimateMinutes) || 30;
        const start = Math.max(cursor, task.earliestStart || interval.start);
        return start + estimate <= interval.end;
      });

      if (taskIndex < 0) break;

      const task = unscheduled.splice(taskIndex, 1)[0];
      const estimate = Number(task.estimateMinutes) || 30;
      const start = Math.max(cursor, task.earliestStart || interval.start);
      const end = start + estimate;

      autoBlocks.push({
        id: uid("block"),
        taskId: task.id,
        type: "task",
        date: selectedDate,
        start: toTime(start),
        end: toTime(end),
        auto: true,
      });
      cursor = end + Number(settings.breakMinutes || 0);
    }
  });

  unscheduled.forEach((task) => {
    questions.push({
      id: uid("schedule-question"),
      taskId: task.id,
      title: task.title,
      estimateMinutes: Number(task.estimateMinutes) || 30,
      reason: "当前固定安排和工作时间里没有足够连续空档。",
      hint: "可以拆小、延期，或在下方手动安排到你觉得合适的位置。",
    });
  });

  return {
    blocks: existingBlocks
      .filter((block) => !(block.date === selectedDate && block.auto))
      .concat(autoBlocks),
    questions,
  };
}

function App() {
  const [planner, setPlanner] = usePlannerStore();
  const [activeView, setActiveView] = useState("today");
  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [taskDraft, setTaskDraft] = useState({
    title: "",
    estimateMinutes: 60,
    priority: "medium",
    goalId: "",
  });
  const [goalDraft, setGoalDraft] = useState({
    title: "",
    type: "long",
    parentId: "",
    priority: "medium",
  });
  const [blockDraft, setBlockDraft] = useState({
    type: "task",
    taskId: "",
    title: "",
    start: "09:00",
    end: "10:00",
  });
  const [breakdownDraft, setBreakdownDraft] = useState({
    goalId: "",
    outcome: "",
    deadline: "",
    constraints: "",
  });
  const [breakdownSuggestions, setBreakdownSuggestions] = useState([]);
  const [aiStatus, setAiStatus] = useState({ loading: false, error: "", message: "" });
  const [aiTaskSuggestions, setAiTaskSuggestions] = useState([]);
  const [scheduleQuestions, setScheduleQuestions] = useState([]);
  const [planningCoach, setPlanningCoach] = useState({
    scope: "today",
    messages: [],
    input: "",
    suggestions: [],
    loading: false,
    error: "",
  });
  const [reviewDraft, setReviewDraft] = useState({
    completed: "",
    blockers: "",
    adjustments: "",
    tomorrowFocus: "",
  });

  useEffect(() => {
    setPlanner((current) => {
      const tasks = mergeDuplicateTasks(current.tasks);
      return tasks.length === current.tasks.length ? current : { ...current, tasks };
    });
  }, [setPlanner]);

  useEffect(() => {
    setScheduleQuestions([]);
  }, [selectedDate]);

  const dayPlan = planner.dayPlans[selectedDate] || {
    fixed: "",
    energy: "正常",
    topThree: "",
    changes: "",
    morningDone: false,
  };

  const todayTasks = useMemo(
    () => planner.tasks.filter((task) => task.date === selectedDate),
    [planner.tasks, selectedDate],
  );

  const todayBlocks = useMemo(
    () => sortBlocks(planner.blocks.filter((block) => block.date === selectedDate)),
    [planner.blocks, selectedDate],
  );

  const taskById = useMemo(
    () => Object.fromEntries(planner.tasks.map((task) => [task.id, task])),
    [planner.tasks],
  );
  const goalById = useMemo(
    () => Object.fromEntries(planner.goals.map((goal) => [goal.id, goal])),
    [planner.goals],
  );

  const activeGoals = planner.goals.filter((goal) => goal.status !== "done");
  const plannedMinutes = sum(todayTasks.filter((task) => task.status !== "done").map((task) => Number(task.estimateMinutes) || 0));
  const scheduledMinutes = sum(todayBlocks.map((block) => duration(block.start, block.end)));
  const workMinutes = duration(planner.settings.workStart, planner.settings.workEnd);
  const busyMinutes = sum(
    todayBlocks
      .filter((block) => block.type === "busy" || (!block.taskId && !block.auto))
      .map((block) => duration(block.start, block.end)),
  );
  const availableMinutes = Math.max(0, workMinutes - busyMinutes);
  const completedCount = todayTasks.filter((task) => task.status === "done").length;
  const guideQuestion = getGuideQuestion({ dayPlan, todayTasks, todayBlocks, plannedMinutes, workMinutes: availableMinutes });
  const viewHeadline =
    activeView === "today"
      ? formatHumanDate(selectedDate)
      : activeView === "goals"
        ? "先选一个目标，把它拆成更小的下一步。"
        : "收束今天的结果，并决定明天先做什么。";
  const currentAiPreset = AI_PROVIDER_PRESETS[planner.ai.provider] || AI_PROVIDER_PRESETS.custom;

  function patchPlanner(updater) {
    setPlanner((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...current, ...next };
    });
  }

  function updateAiSettings(patch) {
    patchPlanner((current) => ({
      ai: { ...current.ai, ...patch },
    }));
  }

  function applyAiProviderPreset(provider) {
    const preset = AI_PROVIDER_PRESETS[provider] || AI_PROVIDER_PRESETS.custom;
    updateAiSettings({
      provider,
      protocol: preset.protocol,
      baseUrl: preset.baseUrl,
      model: preset.model,
    });
  }

  function updateDayPlan(patch) {
    patchPlanner((current) => ({
      dayPlans: {
        ...current.dayPlans,
        [selectedDate]: {
          ...(current.dayPlans[selectedDate] || dayPlan),
          ...patch,
        },
      },
    }));
  }

  function saveMorningPlan() {
    const fixedText = [dayPlan.fixed, dayPlan.topThree, dayPlan.changes].join("\n");

    patchPlanner((current) => {
      const busyBlocks = extractBusyBlocksFromText(fixedText, selectedDate, current.blocks);
      const timedTasks = extractTimedTasksFromText(fixedText, selectedDate, current.tasks);
      return {
        dayPlans: {
          ...current.dayPlans,
          [selectedDate]: {
            ...(current.dayPlans[selectedDate] || dayPlan),
            morningDone: true,
          },
        },
        blocks: current.blocks.concat(busyBlocks),
        tasks: mergeDuplicateTasks(current.tasks.concat(timedTasks)),
      };
    });
  }

  function addTask(event) {
    event.preventDefault();
    submitTaskForm(event.currentTarget);
  }

  function submitTaskForm(form) {
    const title = String(fieldValue(form, "title", taskDraft.title)).trim();
    if (!title) return;
    const nextTask = {
      id: uid("task"),
      title,
      estimateMinutes: estimateMinutesForTitle(title, Number(fieldValue(form, "estimateMinutes", taskDraft.estimateMinutes)) || 30),
      priority: String(fieldValue(form, "priority", taskDraft.priority)),
      goalId: String(fieldValue(form, "goalId", taskDraft.goalId || "")),
      date: selectedDate,
      status: "open",
      createdAt: new Date().toISOString(),
    };

    patchPlanner((current) => ({
      tasks: mergeDuplicateTasks(current.tasks.concat(nextTask)),
      blocks: current.blocks.concat(extractBusyBlocksFromText(title, selectedDate, current.blocks)),
    }));
    setTaskDraft((draft) => ({ ...draft, title: "" }));
  }

  function addGoal(event) {
    event.preventDefault();
    submitGoalForm(event.currentTarget);
  }

  function submitGoalForm(form) {
    const title = String(fieldValue(form, "title", goalDraft.title)).trim();
    if (!title) return;

    patchPlanner((current) => ({
      goals: current.goals.concat({
        id: uid("goal"),
        title,
        type: String(fieldValue(form, "type", goalDraft.type)),
        parentId: String(fieldValue(form, "parentId", goalDraft.parentId || "")),
        priority: String(fieldValue(form, "priority", goalDraft.priority)),
        status: "active",
        progress: 0,
        createdAt: new Date().toISOString(),
      }),
    }));
    setGoalDraft((draft) => ({ ...draft, title: "", parentId: "" }));
  }

  function updateTask(taskId, patch) {
    patchPlanner((current) => ({
      tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
    }));
  }

  function deferTask(taskId) {
    const tomorrow = addDays(selectedDate, 1);
    patchPlanner((current) => ({
      tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, date: tomorrow, status: "open" } : task)),
      blocks: current.blocks.filter((block) => !(block.taskId === taskId && block.date === selectedDate)),
    }));
  }

  function deleteTask(taskId) {
    patchPlanner((current) => ({
      tasks: current.tasks.filter((task) => task.id !== taskId),
      blocks: current.blocks.filter((block) => block.taskId !== taskId),
    }));
  }

  function autoSchedule() {
    const result = buildAutoBlocks({
      tasks: planner.tasks,
      existingBlocks: planner.blocks,
      settings: planner.settings,
      selectedDate,
    });
    patchPlanner({ blocks: result.blocks });
    setScheduleQuestions(result.questions);
  }

  function addManualBlock(event) {
    event.preventDefault();
    submitBlockForm(event.currentTarget);
  }

  function submitBlockForm(form) {
    const start = String(fieldValue(form, "start", blockDraft.start));
    const end = String(fieldValue(form, "end", blockDraft.end));
    const type = String(fieldValue(form, "type", blockDraft.type));
    const taskId = String(fieldValue(form, "taskId", blockDraft.taskId || ""));
    const title = String(fieldValue(form, "title", blockDraft.title || "")).trim();
    if (toMinutes(end) <= toMinutes(start)) return;
    patchPlanner((current) => ({
      blocks: current.blocks.concat({
        id: uid("block"),
        taskId: type === "busy" ? "" : taskId,
        title: title || (type === "busy" ? "固定占用" : ""),
        type,
        date: selectedDate,
        start,
        end,
        auto: false,
      }),
    }));
    if (taskId) {
      setScheduleQuestions((questions) => questions.filter((question) => question.taskId !== taskId));
    }
  }

  function deleteBlock(blockId) {
    patchPlanner((current) => ({
      blocks: current.blocks.filter((block) => block.id !== blockId),
    }));
  }

  function updateGoal(goalId, patch) {
    patchPlanner((current) => ({
      goals: current.goals.map((goal) => (goal.id === goalId ? { ...goal, ...patch } : goal)),
    }));
  }

  function deleteGoal(goalId) {
    patchPlanner((current) => ({
      goals: current.goals
        .filter((goal) => goal.id !== goalId)
        .map((goal) => (goal.parentId === goalId ? { ...goal, parentId: "" } : goal)),
    }));
  }

  async function generateBreakdown(event) {
    event.preventDefault();
    const goal = planner.goals.find((item) => item.id === breakdownDraft.goalId) || planner.goals[0];
    if (!goal) return;
    setBreakdownDraft((draft) => ({ ...draft, goalId: goal.id }));

    if (!planner.ai.enabled) {
      setBreakdownSuggestions(filterBreakdownItems(makeBreakdown(goal, breakdownDraft, selectedDate), planner, goal));
      setAiStatus({ loading: false, error: "", message: "已使用规则拆解。启用 AI 后可改用大模型拆解。" });
      return;
    }

    setAiStatus({ loading: true, error: "", message: "AI 正在拆解目标..." });
    try {
      const result = await callPlanningAi({
        ai: planner.ai,
        maxTokens: 1800,
        messages: [
          {
            role: "system",
            content:
              "你是一个主动规划助手。请把用户的目标拆成可执行的下一层计划，只返回 JSON。JSON 格式：{\"summary\":\"一句话说明\",\"items\":[{\"kind\":\"goal\",\"type\":\"month|week\",\"title\":\"...\",\"priority\":\"high|medium|low\"},{\"kind\":\"task\",\"date\":\"YYYY-MM-DD\",\"title\":\"...\",\"estimateMinutes\":60,\"priority\":\"high|medium|low\"}]}。长期目标拆成月度目标，月度目标拆成本周目标，本周目标拆成具体任务。不要返回 markdown。",
          },
          {
            role: "system",
            content:
              "Important constraints: existingTasks are context only. Do not copy, relabel, or attach any existing task to the selected goal. Only output new items that directly serve the selected goal. If a task title already exists for the same date, omit it. Fixed-time commitments should constrain scheduling; do not convert them into unrelated goal tasks.",
          },
          {
            role: "system",
            content:
              "Be proactive and coach-like. If the goal, deliverable, deadline, dependencies, or definition of done is unclear, do not fabricate a breakdown. Return JSON with items: [] and a concise summary that asks 1-3 targeted follow-up questions in Chinese. If enough information is available, output the smallest useful next layer of work and include one short coaching summary.",
          },
          {
            role: "system",
            content:
              "Use realistic duration estimates. Complex research design tasks such as 初步设计, 框架设计, 方案设计, 技术路线, 多智能体方法设计, paper/proposal planning, or system architecture should be at least 180 minutes unless the user says it is only a short note.",
          },
          {
            role: "user",
            content: JSON.stringify({
              today: selectedDate,
              goal,
              desiredOutcome: breakdownDraft.outcome,
              deadline: breakdownDraft.deadline,
              constraints: breakdownDraft.constraints,
              existingGoals: planner.goals.map(({ id, title, type, parentId, status }) => ({ id, title, type, parentId, status })),
              existingTasks: planner.tasks.slice(-20).map(({ title, date, priority, status, estimateMinutes }) => ({
                title,
                date,
                priority,
                status,
                estimateMinutes,
              })),
              doNotRepeatTaskTitles: planner.tasks.map((task) => task.title),
            }),
          },
        ],
      });
      const items = filterBreakdownItems(normalizeBreakdownItems(result.items, goal, selectedDate), planner, goal);
      if (!items.length) {
        setBreakdownSuggestions([]);
        setAiStatus({
          loading: false,
          error: "",
          message: result.summary || result.message || "AI 需要你先补充目标、交付物、截止时间或限制条件。",
        });
        return;
      }
      setBreakdownSuggestions(items);
      setAiStatus({ loading: false, error: "", message: result.summary || "AI 已生成拆解建议。" });
    } catch (error) {
      setBreakdownSuggestions(filterBreakdownItems(makeBreakdown(goal, breakdownDraft, selectedDate), planner, goal));
      setAiStatus({
        loading: false,
        error: `${error.message || "AI 调用失败"} 已切换为规则拆解。`,
        message: "",
      });
    }
  }

  function acceptBreakdown() {
    const goal = planner.goals.find((item) => item.id === breakdownDraft.goalId) || planner.goals[0];
    if (!goal || breakdownSuggestions.length === 0) return;

    patchPlanner((current) => ({
      goals: current.goals.concat(
        filterBreakdownItems(breakdownSuggestions, current, goal)
          .filter((item) => item.kind === "goal")
          .map((item) => ({
            id: uid("goal"),
            title: item.title,
            type: item.type,
            parentId: goal.id,
            priority: item.priority,
            status: "active",
            progress: 0,
            deadline: breakdownDraft.deadline,
            createdAt: new Date().toISOString(),
          })),
      ),
      tasks: mergeDuplicateTasks(
        current.tasks.concat(
          filterBreakdownItems(breakdownSuggestions, current, goal)
          .filter((item) => item.kind === "task")
          .map((item) => ({
            id: uid("task"),
            title: item.title,
            estimateMinutes: item.estimateMinutes,
            priority: item.priority,
            goalId: goal.id,
            date: item.date,
            status: "open",
            createdAt: new Date().toISOString(),
          })),
        ),
      ),
    }));
    setBreakdownSuggestions([]);
  }

  async function generateTodayAiGuide() {
    if (!planner.ai.enabled) {
      setAiStatus({ loading: false, error: "请先在左侧启用 AI。", message: "" });
      return;
    }

    setAiTaskSuggestions([]);
    setAiStatus({ loading: true, error: "", message: "AI 正在根据目标、任务和不可用时间生成建议..." });
    try {
      const result = await callPlanningAi({
        ai: planner.ai,
        maxTokens: 1600,
        messages: [
          {
            role: "system",
            content:
              "你是一个主动规划助手。请基于今天的精力、固定安排、目标、已有任务和不可用时间，给出今日建议任务。只返回 JSON：{\"message\":\"一句提醒\",\"tasks\":[{\"title\":\"...\",\"estimateMinutes\":45,\"priority\":\"high|medium|low\",\"goalId\":\"可选目标id\",\"reason\":\"为什么建议\"}]}。任务要具体、可执行、不要过量。",
          },
          {
            role: "system",
            content:
              "Important constraints: todayTasks already exist. Do not suggest duplicate task titles. If a fixed-time commitment appears in dayPlan or timeBlocks, protect that time and do not turn it into a normal goal task. Suggested tasks must be new, specific, and realistic for the remaining available time.",
          },
          {
            role: "system",
            content:
              "Be more proactive than a passive checklist. First identify missing constraints, risky sequencing, unclear deliverables, and time conflicts. If the plan is under-specified, return JSON with tasks: [] and a message that asks 1-3 concrete questions in Chinese. If the plan is clear, suggest only the few tasks that materially improve today's execution, with reasons and realistic durations.",
          },
          {
            role: "system",
            content:
              "Estimate time conservatively. For tasks involving 初步设计, 框架设计, 方案设计, 技术路线, 多智能体方法设计, 论文/项目方案, or research proposal writing, use at least 180 minutes unless the user explicitly says it is a quick note. Do not compress complex design work into 60 or 90 minutes.",
          },
          {
            role: "user",
            content: JSON.stringify({
              date: selectedDate,
              dayPlan,
              settings: planner.settings,
              activeGoals: activeGoals.map(({ id, title, type, priority, status }) => ({ id, title, type, priority, status })),
              todayTasks: todayTasks.map(({ title, estimateMinutes, priority, status, goalId }) => ({
                title,
                estimateMinutes,
                priority,
                status,
                goalId,
              })),
              timeBlocks: todayBlocks.map(({ title, taskId, type, start, end, auto }) => ({ title, taskId, type, start, end, auto })),
              doNotRepeatTaskTitles: todayTasks.map((task) => task.title),
            }),
          },
        ],
      });
      const validGoalIds = new Set(activeGoals.map((goal) => goal.id));
      const suggestions = filterTaskSuggestions(
        normalizeTaskSuggestions(result.tasks, selectedDate).map((task) => ({
          ...task,
          goalId: validGoalIds.has(task.goalId) ? task.goalId : "",
        })),
        planner.tasks,
      );
      if (!suggestions.length) {
        setAiTaskSuggestions([]);
        setAiStatus({
          loading: false,
          error: "",
          message: result.message || "AI 需要你先补充固定安排、最重要交付物或任务完成标准。",
        });
        return;
      }
      setAiTaskSuggestions(suggestions);
      setAiStatus({ loading: false, error: "", message: result.message || "AI 已生成今日建议。" });
    } catch (error) {
      setAiStatus({ loading: false, error: error.message || "AI 调用失败。", message: "" });
    }
  }

  function acceptAiTaskSuggestions() {
    if (!aiTaskSuggestions.length) return;
    patchPlanner((current) => ({
      tasks: mergeDuplicateTasks(
        current.tasks.concat(
          filterTaskSuggestions(aiTaskSuggestions, current.tasks).map((task) => ({
            id: uid("task"),
            title: task.title,
            estimateMinutes: task.estimateMinutes,
            priority: task.priority,
            goalId: task.goalId,
            date: task.date,
            status: "open",
            createdAt: new Date().toISOString(),
          })),
        ),
      ),
    }));
    setAiTaskSuggestions([]);
  }

  async function runPlanningCoach(nextMessages) {
    if (!planner.ai.enabled) {
      setPlanningCoach((coach) => ({
        ...coach,
        loading: false,
        error: "请先在左侧启用 AI。",
      }));
      return;
    }

    setPlanningCoach((coach) => ({ ...coach, loading: true, error: "", messages: nextMessages }));

    try {
      const result = await callPlanningAi({
        ai: planner.ai,
        maxTokens: 1800,
        json: false,
        messages: [
          {
            role: "system",
            content:
              "You are an active planning coach. Interview the user to add and break down today, this week, monthly, or long-term work. If you need more information, ask one concise question in natural Chinese. When you have enough information to add plan items, prefer JSON: {\"message\":\"question or summary\",\"done\":false,\"items\":[{\"kind\":\"goal\",\"type\":\"long|month|week\",\"title\":\"...\",\"priority\":\"high|medium|low\",\"parentId\":\"optional\"},{\"kind\":\"task\",\"date\":\"YYYY-MM-DD\",\"title\":\"...\",\"estimateMinutes\":60,\"priority\":\"high|medium|low\",\"goalId\":\"optional\"},{\"kind\":\"busy\",\"date\":\"YYYY-MM-DD\",\"title\":\"...\",\"start\":\"HH:MM\",\"end\":\"HH:MM\"}]}. Do not duplicate existing tasks or goals. Estimate durations realistically: research framework design, project design, technical route, multi-agent method design, or thesis/proposal writing usually needs at least 180 minutes unless the user says it is tiny.",
          },
          {
            role: "system",
            content:
              "Conversation policy: after each user answer, decide whether one more key question is needed or whether actionable items can be proposed. Do not repeat the user's own text as a new task unless it is truly new. When proposing items, include dependencies and fixed-time commitments as busy blocks, and make meeting preparation happen before the meeting and meeting summary/follow-up after the meeting.",
          },
          {
            role: "user",
            content: JSON.stringify({
              today: selectedDate,
              interviewScope: planningCoach.scope,
              dayPlan,
              existingGoals: planner.goals.map(({ id, title, type, parentId, status }) => ({ id, title, type, parentId, status })),
              todayTasks: todayTasks.map(({ title, date, estimateMinutes, priority, status, goalId }) => ({
                title,
                date,
                estimateMinutes,
                priority,
                status,
                goalId,
              })),
              timeBlocks: todayBlocks.map(({ title, type, start, end, taskId }) => ({ title, type, start, end, taskId })),
            }),
          },
          ...nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        ],
      });

      const items = normalizeCoachItems(result.items, selectedDate);
      setPlanningCoach((coach) => ({
        ...coach,
        loading: false,
        error: "",
        messages: nextMessages.concat({ role: "assistant", content: result.message || "我已经整理出一组建议。" }),
        suggestions: items,
      }));
    } catch (error) {
      setPlanningCoach((coach) => ({
        ...coach,
        loading: false,
        error: error.message || "AI 规划访谈失败。",
      }));
    }
  }

  function startPlanningCoach() {
    const message = {
      role: "user",
      content: `请开始一个${planningCoach.scope}规划访谈。先问我一个最关键的问题，然后根据我的回答帮助我新增和拆解任务。`,
    };
    runPlanningCoach([message]);
  }

  function sendPlanningCoachMessage(event) {
    event.preventDefault();
    const content = planningCoach.input.trim();
    if (!content || planningCoach.loading) return;
    const nextMessages = planningCoach.messages.concat({ role: "user", content });
    setPlanningCoach((coach) => ({ ...coach, input: "" }));
    runPlanningCoach(nextMessages);
  }

  function acceptPlanningCoachSuggestions() {
    if (!planningCoach.suggestions.length) return;

    patchPlanner((current) => {
      const validGoalIds = new Set(current.goals.map((goal) => goal.id));
      const goalItems = planningCoach.suggestions.filter((item) => item.kind === "goal");
      const taskItems = planningCoach.suggestions.filter((item) => item.kind === "task");
      const busyItems = planningCoach.suggestions.filter((item) => item.kind === "busy");
      const existingGoalKeys = new Set(current.goals.map(goalIdentity));

      const goals = goalItems
        .map((item) => ({
          id: uid("goal"),
          title: item.title,
          type: item.type,
          parentId: validGoalIds.has(item.parentId) ? item.parentId : "",
          priority: item.priority,
          status: "active",
          progress: 0,
          createdAt: new Date().toISOString(),
        }))
        .filter((goal) => {
          const key = goalIdentity(goal);
          if (existingGoalKeys.has(key)) return false;
          existingGoalKeys.add(key);
          return true;
        });

      const tasks = filterTaskSuggestions(
        taskItems.map((item) => ({
          title: item.title,
          estimateMinutes: item.estimateMinutes,
          priority: item.priority,
          date: item.date,
          goalId: validGoalIds.has(item.goalId) ? item.goalId : "",
        })),
        current.tasks,
      ).map((item) => ({
        id: uid("task"),
        title: item.title,
        estimateMinutes: item.estimateMinutes,
        priority: item.priority,
        goalId: item.goalId,
        date: item.date,
        status: "open",
        createdAt: new Date().toISOString(),
      }));

      const blocks = busyItems.map((item) => ({
        id: uid("block"),
        date: item.date,
        type: "busy",
        taskId: "",
        title: item.title,
        start: item.start,
        end: item.end,
        auto: false,
      }));

      return {
        goals: current.goals.concat(goals),
        tasks: mergeDuplicateTasks(current.tasks.concat(tasks)),
        blocks: current.blocks.concat(blocks),
      };
    });

    setPlanningCoach((coach) => ({ ...coach, suggestions: [] }));
  }

  function exportData() {
    const exportPlanner = { ...planner, ai: { ...planner.ai, apiKey: "" } };
    const blob = new Blob([JSON.stringify(exportPlanner, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `plan-pilot-${getLocalDate()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setPlanner(hydrateState(JSON.parse(String(reader.result || "{}"))));
      } catch {
        window.alert("导入失败：JSON 格式不正确。");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function saveReview(event) {
    event.preventDefault();
    submitReviewForm(event.currentTarget);
  }

  function submitReviewForm(form) {
    const review = {
      completed: String(fieldValue(form, "completed", reviewDraft.completed || "")),
      blockers: String(fieldValue(form, "blockers", reviewDraft.blockers || "")),
      adjustments: String(fieldValue(form, "adjustments", reviewDraft.adjustments || "")),
      tomorrowFocus: String(fieldValue(form, "tomorrowFocus", reviewDraft.tomorrowFocus || "")),
    };
    patchPlanner((current) => {
      const reviews = current.reviews.filter((review) => !(review.date === selectedDate && review.type === "daily"));
      return {
        reviews: reviews.concat({
          id: uid("review"),
          type: "daily",
          date: selectedDate,
          ...review,
          createdAt: new Date().toISOString(),
        }),
        dayPlans: {
          ...current.dayPlans,
          [selectedDate]: {
            ...(current.dayPlans[selectedDate] || dayPlan),
            eveningDone: true,
          },
        },
      };
    });
  }

  function carryUnfinished() {
    const tomorrow = addDays(selectedDate, 1);
    patchPlanner((current) => ({
      tasks: current.tasks.map((task) =>
        task.date === selectedDate && task.status !== "done"
          ? { ...task, date: tomorrow, status: "open" }
          : task,
      ),
      blocks: current.blocks.filter((block) => block.date !== selectedDate || taskById[block.taskId]?.status === "done"),
    }));
    setSelectedDate(tomorrow);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Sparkles size={20} />
          </span>
          <div>
            <strong>{APP_NAME}</strong>
            <span>{formatHumanDate(getLocalDate())}</span>
          </div>
        </div>

        <nav className="nav">
          <button className={activeView === "today" ? "active" : ""} onClick={() => setActiveView("today")}>
            <CalendarDays size={18} />
            今日
          </button>
          <button className={activeView === "goals" ? "active" : ""} onClick={() => setActiveView("goals")}>
            <Target size={18} />
            目标
          </button>
          <button className={activeView === "review" ? "active" : ""} onClick={() => setActiveView("review")}>
            <ListChecks size={18} />
            复盘
          </button>
        </nav>

        <section className="settings-panel">
          <label>
            工作开始
            <input
              type="time"
              value={planner.settings.workStart}
              onChange={(event) =>
                patchPlanner((current) => ({
                  settings: { ...current.settings, workStart: event.target.value },
                }))
              }
            />
          </label>
          <label>
            工作结束
            <input
              type="time"
              value={planner.settings.workEnd}
              onChange={(event) =>
                patchPlanner((current) => ({
                  settings: { ...current.settings, workEnd: event.target.value },
                }))
              }
            />
          </label>
          <label>
            间隔分钟
            <input
              type="number"
              min="0"
              max="60"
              value={planner.settings.breakMinutes}
              onChange={(event) =>
                patchPlanner((current) => ({
                  settings: { ...current.settings, breakMinutes: Number(event.target.value) },
                }))
              }
            />
          </label>
        </section>

        <section className="ai-panel">
          <label className="ai-toggle">
            <input
              type="checkbox"
              checked={planner.ai.enabled}
              onChange={(event) => updateAiSettings({ enabled: event.target.checked })}
            />
            启用 AI 辅助
          </label>
          <label>
            服务商
            <select value={planner.ai.provider} onChange={(event) => applyAiProviderPreset(event.target.value)}>
              {Object.entries(AI_PROVIDER_PRESETS).map(([value, preset]) => (
                <option key={value} value={value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            API Key
            <input
              type="password"
              value={planner.ai.apiKey}
              onChange={(event) => updateAiSettings({ apiKey: event.target.value })}
              placeholder="sk-..."
            />
          </label>
          <label>
            模型
            <input
              value={planner.ai.model}
              onChange={(event) => updateAiSettings({ model: event.target.value })}
              placeholder={currentAiPreset.model || "model-id"}
            />
          </label>
          <label>
            API 地址
            <input
              value={planner.ai.baseUrl}
              onChange={(event) => updateAiSettings({ baseUrl: event.target.value })}
              placeholder={currentAiPreset.baseUrl || "https://api.example.com/v1"}
            />
          </label>
          <p>
            当前协议：{planner.ai.protocol === "anthropic" ? "Anthropic Messages" : "OpenAI 兼容"}。Key
            只保存在本机浏览器，本地原型会通过当前 dev server 代理请求。
          </p>
          {currentAiPreset.note && <p className="ai-provider-note">{currentAiPreset.note}</p>}
        </section>

        <section className="data-panel">
          <button onClick={exportData}>
            <Download size={16} />
            导出 JSON
          </button>
          <label>
            <Upload size={16} />
            导入 JSON
            <input type="file" accept="application/json" onChange={importData} />
          </label>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{activeView === "today" ? "今日引导" : activeView === "goals" ? "目标层级" : "收束调整"}</p>
            <h1>{viewHeadline}</h1>
          </div>
          <div className="date-switcher">
            <button title="前一天" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
              <ChevronRight className="flip" size={18} />
            </button>
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            <button title="后一天" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
              <ChevronRight size={18} />
            </button>
          </div>
        </header>

        {activeView === "today" && (
          <TodayView
            planner={planner}
            dayPlan={dayPlan}
            selectedDate={selectedDate}
            todayTasks={todayTasks}
            todayBlocks={todayBlocks}
            activeGoals={activeGoals}
            taskById={taskById}
            goalById={goalById}
            taskDraft={taskDraft}
            blockDraft={blockDraft}
            plannedMinutes={plannedMinutes}
            scheduledMinutes={scheduledMinutes}
            workMinutes={availableMinutes}
            completedCount={completedCount}
            setTaskDraft={setTaskDraft}
            setBlockDraft={setBlockDraft}
            updateDayPlan={updateDayPlan}
            saveMorningPlan={saveMorningPlan}
            addTask={addTask}
            submitTaskForm={submitTaskForm}
            updateTask={updateTask}
            deferTask={deferTask}
            deleteTask={deleteTask}
            autoSchedule={autoSchedule}
            scheduleQuestions={scheduleQuestions}
            addManualBlock={addManualBlock}
            submitBlockForm={submitBlockForm}
            deleteBlock={deleteBlock}
            aiStatus={aiStatus}
            aiTaskSuggestions={aiTaskSuggestions}
            generateTodayAiGuide={generateTodayAiGuide}
            acceptAiTaskSuggestions={acceptAiTaskSuggestions}
            planningCoach={planningCoach}
            setPlanningCoach={setPlanningCoach}
            startPlanningCoach={startPlanningCoach}
            sendPlanningCoachMessage={sendPlanningCoachMessage}
            acceptPlanningCoachSuggestions={acceptPlanningCoachSuggestions}
          />
        )}

        {activeView === "goals" && (
          <GoalsView
            goals={planner.goals}
            goalDraft={goalDraft}
            setGoalDraft={setGoalDraft}
            addGoal={addGoal}
            submitGoalForm={submitGoalForm}
            updateGoal={updateGoal}
            deleteGoal={deleteGoal}
            breakdownDraft={breakdownDraft}
            setBreakdownDraft={setBreakdownDraft}
            breakdownSuggestions={breakdownSuggestions}
            generateBreakdown={generateBreakdown}
            acceptBreakdown={acceptBreakdown}
            aiStatus={aiStatus}
            goalById={goalById}
          />
        )}

        {activeView === "review" && (
          <ReviewView
            selectedDate={selectedDate}
            todayTasks={todayTasks}
            dayPlan={dayPlan}
            reviewDraft={reviewDraft}
            setReviewDraft={setReviewDraft}
            saveReview={saveReview}
            submitReviewForm={submitReviewForm}
            carryUnfinished={carryUnfinished}
            reviews={planner.reviews}
          />
        )}
      </section>
    </main>
  );
}

function getGuideQuestion({ dayPlan, todayTasks, todayBlocks, plannedMinutes, workMinutes }) {
  if (!dayPlan.morningDone) return "今天最值得推进的 1-3 件事是什么？";
  if (todayTasks.length === 0) return "先把今天的新任务收进来。";
  if (plannedMinutes > workMinutes) return "今天任务超载了，要删减、顺延还是降低标准？";
  if (todayBlocks.length === 0) return "把任务放进时间块，今天会更稳。";
  if (dayPlan.changes?.trim()) return "这些变化会影响本周或本月计划吗？";
  return "按当前节奏推进，晚上做一次轻复盘。";
}

function TodayView({
  planner,
  dayPlan,
  selectedDate,
  todayTasks,
  todayBlocks,
  activeGoals,
  taskById,
  goalById,
  taskDraft,
  blockDraft,
  plannedMinutes,
  scheduledMinutes,
  workMinutes,
  completedCount,
  setTaskDraft,
  setBlockDraft,
  updateDayPlan,
  saveMorningPlan,
  addTask,
  submitTaskForm,
  updateTask,
  deferTask,
  deleteTask,
  autoSchedule,
  scheduleQuestions,
  addManualBlock,
  submitBlockForm,
  deleteBlock,
  aiStatus,
  aiTaskSuggestions,
  generateTodayAiGuide,
  acceptAiTaskSuggestions,
  planningCoach,
  setPlanningCoach,
  startPlanningCoach,
  sendPlanningCoachMessage,
  acceptPlanningCoachSuggestions,
}) {
  const overload = plannedMinutes > workMinutes;
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editDraft, setEditDraft] = useState({ title: "", estimateMinutes: 60, priority: "medium", goalId: "" });

  function startEditingTask(task) {
    setEditingTaskId(task.id);
    setEditDraft({
      title: task.title,
      estimateMinutes: Number(task.estimateMinutes) || 60,
      priority: task.priority,
      goalId: task.goalId || "",
    });
  }

  function cancelEditingTask() {
    setEditingTaskId(null);
  }

  function saveEditingTask(taskId) {
    if (!editDraft.title.trim()) return;
    updateTask(taskId, {
      title: editDraft.title.trim(),
      estimateMinutes: Number(editDraft.estimateMinutes) || 30,
      priority: editDraft.priority,
      goalId: editDraft.goalId || "",
    });
    setEditingTaskId(null);
  }

  const layoutClass = dayPlan.morningDone ? "today-grid layout-done" : "today-grid";

  return (
    <div className={layoutClass}>
      <section className="coach-band">
        <div className="coach-copy">
          <p className="eyebrow">晨间问题</p>
          <h2>{formatHumanDate(selectedDate)}</h2>
        </div>
        <div className="question-grid">
          <label>
            固定安排
            <textarea
              value={dayPlan.fixed}
              onChange={(event) => updateDayPlan({ fixed: event.target.value })}
              placeholder="会议、通勤、已经约定的事"
            />
          </label>
          <label>
            今日最重要
            <textarea
              value={dayPlan.topThree}
              onChange={(event) => updateDayPlan({ topThree: event.target.value })}
              placeholder="最多写 1-3 件"
            />
          </label>
          <label>
            变化与风险
            <textarea
              value={dayPlan.changes}
              onChange={(event) => updateDayPlan({ changes: event.target.value })}
              placeholder="会影响本周、本月或长期目标的情况"
            />
          </label>
          <div className="energy-picker" role="group" aria-label="今日精力">
            <span>精力</span>
            {energyOptions.map((option) => (
              <button
                key={option}
                className={dayPlan.energy === option ? "active" : ""}
                onClick={() => updateDayPlan({ energy: option })}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <button className="primary-action" onClick={saveMorningPlan}>
          <CheckCircle2 size={18} />
          保存晨间规划
        </button>
        <div className="ai-guide-actions">
          <button className="secondary-action" onClick={generateTodayAiGuide} disabled={aiStatus.loading}>
            <Sparkles size={18} />
            {aiStatus.loading ? "AI 思考中" : "AI 今日建议"}
          </button>
          {aiStatus.message && <span className="ai-message">{aiStatus.message}</span>}
          {aiStatus.error && <span className="ai-error">{aiStatus.error}</span>}
        </div>
        {aiTaskSuggestions.length > 0 && (
          <div className="ai-suggestion-list">
            {aiTaskSuggestions.map((task) => (
              <article className="ai-suggestion" key={task.id}>
                <strong>{task.title}</strong>
                <span>
                  {priorityLabel[task.priority]}优先级 · {task.estimateMinutes} 分钟
                  {task.reason ? ` · ${task.reason}` : ""}
                </span>
              </article>
            ))}
            <button className="primary-action" onClick={acceptAiTaskSuggestions}>
              <Plus size={18} />
              加入今日任务
            </button>
          </div>
        )}
      </section>

      <section className="panel interview-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">AI 规划访谈</p>
            <h2>让模型主动问，再帮你拆</h2>
          </div>
          <select
            value={planningCoach.scope}
            onChange={(event) =>
              setPlanningCoach((coach) => ({
                ...coach,
                scope: event.target.value,
                messages: [],
                suggestions: [],
                error: "",
              }))
            }
          >
            <option value="today">今天</option>
            <option value="week">本周</option>
            <option value="month">月度</option>
            <option value="long">长期</option>
          </select>
        </div>

        <div className="interview-body">
          {planningCoach.messages.length === 0 ? (
            <EmptyState icon={<Sparkles size={22} />} text="点击开始，AI 会先问你一个问题。" />
          ) : (
            <div className="interview-messages">
              {planningCoach.messages.map((message, index) => (
                <article className={`interview-message ${message.role}`} key={`${message.role}-${index}`}>
                  {message.content}
                </article>
              ))}
            </div>
          )}

          {planningCoach.error && <div className="ai-error block">{planningCoach.error}</div>}

          {planningCoach.suggestions.length > 0 && (
            <div className="coach-suggestions">
              {planningCoach.suggestions.map((item) => (
                <article className="coach-suggestion" key={item.id}>
                  <strong>{item.title}</strong>
                  <span>
                    {item.kind === "goal"
                      ? `${goalTypeLabel[item.type]}目标 · ${priorityLabel[item.priority]}优先级`
                      : item.kind === "busy"
                        ? `${item.start}-${item.end} · 固定安排`
                        : `${item.date} · ${item.estimateMinutes} 分钟 · ${priorityLabel[item.priority]}优先级`}
                  </span>
                </article>
              ))}
              <button className="primary-action" onClick={acceptPlanningCoachSuggestions}>
                <Plus size={18} />
                加入计划
              </button>
            </div>
          )}
        </div>

        <form className="interview-form" onSubmit={sendPlanningCoachMessage}>
          <textarea
            value={planningCoach.input}
            onChange={(event) => setPlanningCoach((coach) => ({ ...coach, input: event.target.value }))}
            placeholder="回答 AI 的问题，或直接描述：今天/本周/月度/长期想推进什么"
          />
          <div className="interview-actions">
            <button type="button" className="secondary-action" onClick={startPlanningCoach} disabled={planningCoach.loading}>
              <Sparkles size={18} />
              {planningCoach.loading ? "AI 思考中" : "开始访谈"}
            </button>
            <button className="primary-action" disabled={planningCoach.loading || !planningCoach.input.trim()}>
              <Send size={18} />
              发送
            </button>
          </div>
        </form>
      </section>

      <section className="stats-row">
        <Metric label="完成/总数" value={`${completedCount}/${todayTasks.length}`} />
        <Metric label="预计" value={`${plannedMinutes} 分钟`} tone={overload ? "danger" : ""} />
        <Metric label="已排" value={`${scheduledMinutes} 分钟`} />
        <Metric label="可用" value={`${workMinutes} 分钟`} />
      </section>

      <section className="panel task-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">任务收集</p>
            <h2>今天要做什么</h2>
          </div>
        </div>
        <form className="task-form" onSubmit={addTask}>
          <input
            name="title"
            value={taskDraft.title}
            onChange={(event) => setTaskDraft((draft) => ({ ...draft, title: event.target.value }))}
            placeholder="输入一个新任务"
          />
          <input
            name="estimateMinutes"
            type="number"
            min="10"
            step="10"
            value={taskDraft.estimateMinutes}
            onChange={(event) => setTaskDraft((draft) => ({ ...draft, estimateMinutes: event.target.value }))}
            aria-label="预计分钟"
          />
          <select
            name="priority"
            value={taskDraft.priority}
            onChange={(event) => setTaskDraft((draft) => ({ ...draft, priority: event.target.value }))}
            aria-label="优先级"
          >
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>
          <select
            name="goalId"
            value={taskDraft.goalId}
            onChange={(event) => setTaskDraft((draft) => ({ ...draft, goalId: event.target.value }))}
            aria-label="关联目标"
          >
            <option value="">不关联目标</option>
            {activeGoals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goalTypeLabel[goal.type]} · {goal.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            title="添加任务"
            className="compact-action solid"
            onClick={(event) => {
              event.preventDefault();
              submitTaskForm(event.currentTarget.form);
            }}
          >
            <Plus size={18} />
            添加
          </button>
        </form>

        <div className="task-list">
          {todayTasks.length === 0 && <EmptyState icon={<Target size={22} />} text="先写下今天的一件具体工作。" />}
          {todayTasks
            .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
            .map((task) => {
              const isEditing = editingTaskId === task.id;
              const parentGoal = task.goalId && goalById[task.goalId];

              if (isEditing) {
                return (
                  <article className="task-item editing" key={task.id}>
                    <div className="edit-task-form">
                      <input
                        value={editDraft.title}
                        onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                        placeholder="任务标题"
                      />
                      <div className="edit-task-row">
                        <input
                          type="number"
                          min="10"
                          step="10"
                          value={editDraft.estimateMinutes}
                          onChange={(e) => setEditDraft((d) => ({ ...d, estimateMinutes: Number(e.target.value) }))}
                          aria-label="预计分钟"
                        />
                        <select
                          value={editDraft.priority}
                          onChange={(e) => setEditDraft((d) => ({ ...d, priority: e.target.value }))}
                          aria-label="优先级"
                        >
                          <option value="high">高</option>
                          <option value="medium">中</option>
                          <option value="low">低</option>
                        </select>
                        <select
                          value={editDraft.goalId}
                          onChange={(e) => setEditDraft((d) => ({ ...d, goalId: e.target.value }))}
                          aria-label="关联目标"
                        >
                          <option value="">无关联</option>
                          {activeGoals.map((g) => (
                            <option key={g.id} value={g.id}>
                              {goalTypeLabel[g.type]} · {g.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="edit-task-actions">
                        <button className="secondary-action" onClick={() => saveEditingTask(task.id)}>
                          <CheckCircle2 size={16} />
                          保存
                        </button>
                        <button className="icon-button" onClick={cancelEditingTask}>
                          <X size={17} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }

              return (
              <article className={`task-item ${task.status === "done" ? "done" : ""}`} key={task.id}>
                <button
                  className="check-button"
                  title={task.status === "done" ? "标记未完成" : "标记完成"}
                  onClick={() => updateTask(task.id, { status: task.status === "done" ? "open" : "done" })}
                >
                  <CheckCircle2 size={20} />
                </button>
                <div className="task-main">
                  <strong>{task.title}</strong>
                  <span className="task-meta">
                    <span className={`priority-badge ${task.priority}`}>{priorityLabel[task.priority]}</span>
                    <span>{task.estimateMinutes} 分钟</span>
                    {parentGoal && (
                      <span className="task-goal-link">
                        <Target size={12} />
                        {parentGoal.title}
                      </span>
                    )}
                  </span>
                </div>
                <button title="编辑任务" className="icon-button" onClick={() => startEditingTask(task)}>
                  <Pencil size={17} />
                </button>
                <button title="顺延到明天" className="icon-button" onClick={() => deferTask(task.id)}>
                  <RefreshCw size={17} />
                </button>
                <button title="删除任务" className="icon-button danger" onClick={() => deleteTask(task.id)}>
                  <Trash2 size={17} />
                </button>
              </article>
            );
            })}
        </div>
      </section>

      <section className="panel schedule-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">时间分配</p>
            <h2>{planner.settings.workStart} - {planner.settings.workEnd}</h2>
          </div>
          <button className="secondary-action" onClick={autoSchedule}>
            <AlarmClock size={18} />
            自动安排
          </button>
        </div>

        <form className="block-form" onSubmit={addManualBlock}>
          <select
            name="type"
            value={blockDraft.type}
            onChange={(event) => setBlockDraft((draft) => ({ ...draft, type: event.target.value }))}
            aria-label="时间块类型"
          >
            <option value="task">任务时间块</option>
            <option value="busy">不可用时间</option>
          </select>
          <select
            name="taskId"
            value={blockDraft.taskId}
            onChange={(event) => setBlockDraft((draft) => ({ ...draft, taskId: event.target.value }))}
            aria-label="选择任务"
            disabled={blockDraft.type === "busy"}
          >
            <option value="">自定义时间块</option>
            {todayTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
          <input
            name="title"
            value={blockDraft.title}
            onChange={(event) => setBlockDraft((draft) => ({ ...draft, title: event.target.value }))}
            placeholder={blockDraft.type === "busy" ? "监考、会议、通勤" : "可选标题"}
          />
          <input
            name="start"
            type="time"
            value={blockDraft.start}
            onChange={(event) => setBlockDraft((draft) => ({ ...draft, start: event.target.value }))}
          />
          <input
            name="end"
            type="time"
            value={blockDraft.end}
            onChange={(event) => setBlockDraft((draft) => ({ ...draft, end: event.target.value }))}
          />
          <button
            type="submit"
            title="加入时间块"
            className="compact-action solid"
            onClick={(event) => {
              event.preventDefault();
              submitBlockForm(event.currentTarget.form);
            }}
          >
            <Plus size={18} />
            添加
          </button>
        </form>

        {scheduleQuestions.length > 0 && (
          <div className="schedule-questions">
            <div>
              <strong>需要你判断放在哪里</strong>
              <span>这些任务暂时不适合硬排，先让你定位置或补充约束。</span>
            </div>
            {scheduleQuestions.map((question) => (
              <article className="schedule-question" key={question.id}>
                <div>
                  <strong>{question.title}</strong>
                  <span>
                    {question.estimateMinutes} 分钟 · {question.reason} {question.hint}
                  </span>
                </div>
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() =>
                    setBlockDraft((draft) => ({
                      ...draft,
                      type: "task",
                      taskId: question.taskId,
                      title: "",
                      end: toTime(toMinutes(draft.start) + question.estimateMinutes),
                    }))
                  }
                >
                  放入手动表单
                </button>
              </article>
            ))}
          </div>
        )}

        <div className="timeline">
          {todayBlocks.length === 0 && <EmptyState icon={<Clock3 size={22} />} text="还没有时间块。" />}
          {todayBlocks.map((block) => {
            const task = taskById[block.taskId];
            const busy = block.type === "busy" || (!block.taskId && !block.auto);
            const title = task?.title || block.title || (busy ? "固定占用" : "自定义安排");
            return (
              <article className={`time-block ${block.auto ? "auto" : ""} ${busy ? "busy" : ""}`} key={block.id}>
                <div className="time-range">
                  <strong>{block.start}</strong>
                  <span>{block.end}</span>
                </div>
                <div className="time-body">
                  <strong>{title}</strong>
                  <span>
                    {duration(block.start, block.end)} 分钟
                    {busy ? " · 不可安排" : block.auto ? " · 自动" : ""}
                  </span>
                </div>
                <button title="删除时间块" className="icon-button danger" onClick={() => deleteBlock(block.id)}>
                  <Trash2 size={17} />
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function GoalsView({
  goals,
  goalDraft,
  setGoalDraft,
  addGoal,
  submitGoalForm,
  updateGoal,
  breakdownDraft,
  setBreakdownDraft,
  breakdownSuggestions,
  generateBreakdown,
  acceptBreakdown,
  aiStatus,
  goalById,
  deleteGoal,
}) {
  const parentOptions = goals.filter((goal) => {
    if (goalDraft.type === "long") return false;
    if (goalDraft.type === "month") return goal.type === "long";
    return goal.type === "month";
  });

  return (
    <div className="goals-layout">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">新增目标</p>
            <h2>把大方向拆到本周</h2>
          </div>
        </div>
        <form className="goal-form" onSubmit={addGoal}>
          <input
            name="title"
            value={goalDraft.title}
            onChange={(event) => setGoalDraft((draft) => ({ ...draft, title: event.target.value }))}
            placeholder="写一个目标或结果"
          />
          <select
            name="type"
            value={goalDraft.type}
            onChange={(event) => setGoalDraft((draft) => ({ ...draft, type: event.target.value, parentId: "" }))}
          >
            <option value="long">长期</option>
            <option value="month">月度</option>
            <option value="week">本周</option>
          </select>
          <select
            name="parentId"
            value={goalDraft.parentId}
            onChange={(event) => setGoalDraft((draft) => ({ ...draft, parentId: event.target.value }))}
            disabled={goalDraft.type === "long"}
          >
            <option value="">无上级目标</option>
            {parentOptions.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
          <select
            name="priority"
            value={goalDraft.priority}
            onChange={(event) => setGoalDraft((draft) => ({ ...draft, priority: event.target.value }))}
          >
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>
          <button
            type="submit"
            title="添加目标"
            className="compact-action solid"
            onClick={(event) => {
              event.preventDefault();
              submitGoalForm(event.currentTarget.form);
            }}
          >
            <Plus size={18} />
            添加
          </button>
        </form>
      </section>

      <section className="panel breakdown-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">拆解向导</p>
            <h2>把目标变成下一步</h2>
          </div>
        </div>
        <form className="breakdown-form" onSubmit={generateBreakdown}>
          <select
            value={breakdownDraft.goalId}
            onChange={(event) => setBreakdownDraft((draft) => ({ ...draft, goalId: event.target.value }))}
            disabled={goals.length === 0}
          >
            <option value="">{goals.length ? "选择一个目标" : "先新增一个目标"}</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goalTypeLabel[goal.type]} · {goal.title}
              </option>
            ))}
          </select>
          <input
            value={breakdownDraft.outcome}
            onChange={(event) => setBreakdownDraft((draft) => ({ ...draft, outcome: event.target.value }))}
            placeholder="期望交付结果"
          />
          <input
            type="date"
            value={breakdownDraft.deadline}
            onChange={(event) => setBreakdownDraft((draft) => ({ ...draft, deadline: event.target.value }))}
          />
          <textarea
            value={breakdownDraft.constraints}
            onChange={(event) => setBreakdownDraft((draft) => ({ ...draft, constraints: event.target.value }))}
            placeholder="依赖、限制或风险"
          />
          <button className="primary-action" disabled={goals.length === 0}>
            <Wand2 size={18} />
            生成拆解
          </button>
        </form>

        {aiStatus.message && <div className="ai-message block">{aiStatus.message}</div>}
        {aiStatus.error && <div className="ai-error block">{aiStatus.error}</div>}

        {breakdownSuggestions.length > 0 && (
          <div className="breakdown-results">
            {breakdownSuggestions.map((item, index) => (
              <article className="breakdown-item" key={`${item.title}-${index}`}>
                <span>{item.kind === "goal" ? goalTypeLabel[item.type] : item.date}</span>
                <strong>{item.title}</strong>
                <em>{item.kind === "task" ? `${item.estimateMinutes} 分钟` : `${priorityLabel[item.priority]}优先级`}</em>
              </article>
            ))}
            <button className="secondary-action" onClick={acceptBreakdown}>
              <CheckCircle2 size={18} />
              加入计划
            </button>
          </div>
        )}
      </section>

      <GoalGraph
        goals={goals}
        goalById={goalById}
        updateGoal={updateGoal}
        deleteGoal={deleteGoal}
        goalTypeLabel={goalTypeLabel}
        TargetIcon={Target}
        EmptyState={EmptyState}
      />
    </div>
  );
}

function buildGoalRows(goals) {
  const childrenMap = {};
  goals.forEach((g) => {
    if (g.parentId) {
      if (!childrenMap[g.parentId]) childrenMap[g.parentId] = [];
      childrenMap[g.parentId].push(g);
    }
  });

  const rows = [];
  const placed = new Set();

  function placeInRow(goal, rowIndex) {
    if (placed.has(goal.id)) return;
    while (rows.length <= rowIndex) rows.push({ long: [], month: [], week: [] });
    rows[rowIndex][goal.type].push(goal);
    placed.add(goal.id);
    (childrenMap[goal.id] || []).forEach((child) => placeInRow(child, rowIndex));
  }

  // place long roots first — each root starts a new row group
  const longRoots = goals.filter((g) => g.type === "long" && !g.parentId);
  longRoots.forEach((root, i) => placeInRow(root, i));

  // place remaining unplaced goals in new rows
  goals.forEach((g) => {
    if (!placed.has(g.id)) {
      placeInRow(g, rows.length);
    }
  });

  return rows;
}

function getConnectedIds(goalId, goals) {
  const parentMap = {};
  const childrenMap = {};
  goals.forEach((g) => {
    parentMap[g.id] = g.parentId;
    if (g.parentId) {
      if (!childrenMap[g.parentId]) childrenMap[g.parentId] = [];
      childrenMap[g.parentId].push(g.id);
    }
  });

  const connected = new Set([goalId]);

  // walk up
  let cursor = goalId;
  while (parentMap[cursor]) {
    connected.add(parentMap[cursor]);
    cursor = parentMap[cursor];
  }

  // walk down
  const stack = childrenMap[goalId] ? [...childrenMap[goalId]] : [];
  while (stack.length) {
    const id = stack.pop();
    connected.add(id);
    if (childrenMap[id]) stack.push(...childrenMap[id]);
  }

  return connected;
}

function GoalGraph({ goals, goalById, updateGoal, deleteGoal, goalTypeLabel, TargetIcon, EmptyState }) {
  const graphRef = useRef(null);
  const goalRefs = useRef(new Map());
  const [hoveredGoalId, setHoveredGoalId] = useState(null);
  const [lines, setLines] = useState([]);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editDraft, setEditDraft] = useState({ title: "", priority: "medium", parentId: "" });

  function startEditingGoal(goal) {
    setEditingGoalId(goal.id);
    setEditDraft({
      title: goal.title,
      priority: goal.priority,
      parentId: goal.parentId || "",
    });
  }

  function cancelEditingGoal() {
    setEditingGoalId(null);
  }

  function saveEditingGoal(goalId) {
    if (!editDraft.title.trim()) return;
    updateGoal(goalId, {
      title: editDraft.title.trim(),
      priority: editDraft.priority,
      parentId: editDraft.parentId || "",
    });
    setEditingGoalId(null);
  }

  function handleStatusChange(goal, newStatus) {
    if (newStatus === "done") {
      updateGoal(goal.id, { status: "done", progress: 100 });
    } else {
      updateGoal(goal.id, { status: newStatus });
    }
  }

  function handleProgressChange(goal, value) {
    const progress = Number(value);
    if (progress >= 100) {
      updateGoal(goal.id, { progress: 100, status: "done" });
    } else {
      updateGoal(goal.id, { progress });
    }
  }

  const rows = useMemo(() => buildGoalRows(goals), [goals]);

  const connectedIds = useMemo(
    () => (hoveredGoalId ? getConnectedIds(hoveredGoalId, goals) : new Set()),
    [hoveredGoalId, goals],
  );

  const computeLines = useCallback(() => {
    if (!graphRef.current) return;
    const containerRect = graphRef.current.getBoundingClientRect();
    const newLines = [];

    goals.forEach((goal) => {
      if (!goal.parentId) return;
      const parentEl = goalRefs.current.get(goal.parentId);
      const childEl = goalRefs.current.get(goal.id);
      if (!parentEl || !childEl) return;

      const pr = parentEl.getBoundingClientRect();
      const cr = childEl.getBoundingClientRect();

      const x1 = pr.right - containerRect.left;
      const y1 = pr.top + pr.height / 2 - containerRect.top;
      const x2 = cr.left - containerRect.left;
      const y2 = cr.top + cr.height / 2 - containerRect.top;

      const cx = (x1 + x2) / 2;
      newLines.push({
        key: `${goal.parentId}-${goal.id}`,
        parentId: goal.parentId,
        childId: goal.id,
        d: `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`,
      });
    });

    setLines(newLines);
  }, [goals]);

  useEffect(() => {
    computeLines();
    const onResize = () => computeLines();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [computeLines]);

  const setGoalRef = useCallback((goalId, el) => {
    if (el) {
      goalRefs.current.set(goalId, el);
    } else {
      goalRefs.current.delete(goalId);
    }
  }, []);

  // re-run line computation after refs are attached
  useEffect(() => {
    computeLines();
  }, [goals, computeLines]);

  const allPlaced = goals.length > 0 && rows.some((row) => row.long.length + row.month.length + row.week.length > 0);

  return (
    <div className="goal-graph" ref={graphRef}>
      <svg className="goal-lines">
        {lines.map((line) => {
          const isHovered =
            hoveredGoalId && (connectedIds.has(line.parentId) || connectedIds.has(line.childId));
          return (
            <path
              key={line.key}
              d={line.d}
              className={`goal-line${isHovered ? " highlighted" : ""}`}
            />
          );
        })}
      </svg>

      <div className="goal-graph-columns">
        {["long", "month", "week"].map((type) => (
          <div className="goal-graph-col" key={type}>
            <div className="goal-graph-col-header">
              <span>{goalTypeLabel[type]}</span>
              <strong>{goals.filter((g) => g.type === type).length}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="goal-graph-rows">
        {allPlaced ? (
          rows.map((row, ri) => (
            <div className="goal-graph-row" key={ri}>
              {["long", "month", "week"].map((type) => (
                <div className="goal-graph-cell" key={type}>
                  {row[type].map((goal) => {
                    const isConnected = hoveredGoalId && connectedIds.has(goal.id);
                    const isDimmed = hoveredGoalId && !isConnected;
                    const isEditing = editingGoalId === goal.id;
                    const progress = Number(goal.progress) || 0;

                    if (isEditing) {
                      return (
                        <article className="goal-card editing" key={goal.id}>
                          <div className="goal-edit-form">
                            <input
                              value={editDraft.title}
                              onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                              placeholder="目标标题"
                            />
                            <div className="goal-edit-row">
                              <select
                                value={editDraft.priority}
                                onChange={(e) => setEditDraft((d) => ({ ...d, priority: e.target.value }))}
                              >
                                <option value="high">高优先级</option>
                                <option value="medium">中优先级</option>
                                <option value="low">低优先级</option>
                              </select>
                              <select
                                value={editDraft.parentId}
                                onChange={(e) => setEditDraft((d) => ({ ...d, parentId: e.target.value }))}
                              >
                                <option value="">无上级目标</option>
                                {goals
                                  .filter((g) => {
                                    if (goal.type === "month") return g.type === "long";
                                    if (goal.type === "week") return g.type === "month";
                                    return false;
                                  })
                                  .map((g) => (
                                    <option key={g.id} value={g.id}>
                                      {g.title}
                                    </option>
                                  ))}
                              </select>
                            </div>
                            <div className="goal-edit-actions">
                              <button className="secondary-action" onClick={() => saveEditingGoal(goal.id)}>
                                保存
                              </button>
                              <button className="secondary-action" onClick={cancelEditingGoal}>取消</button>
                            </div>
                          </div>
                        </article>
                      );
                    }

                    const parentGoal = goal.parentId && goalById[goal.parentId];
                    return (
                      <article
                        className={`goal-card ${goal.status} priority-${goal.priority}${
                          isConnected ? " goal-highlighted" : ""
                        }${isDimmed ? " goal-dimmed" : ""}`}
                        key={goal.id}
                        ref={(el) => setGoalRef(goal.id, el)}
                        onMouseEnter={() => setHoveredGoalId(goal.id)}
                        onMouseLeave={() => setHoveredGoalId(null)}
                      >
                        <div className="goal-card-header">
                          <strong className="goal-card-title">{goal.title}</strong>
                          <select
                            className="goal-status-select"
                            value={goal.status}
                            onChange={(e) => handleStatusChange(goal, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="active">进行</option>
                            <option value="paused">暂停</option>
                            <option value="done">完成</option>
                          </select>
                          <button
                            className="goal-card-delete"
                            title="删除目标"
                            onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="goal-card-progress-row">
                          <div className={`goal-progress ${goal.status}`}>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={progress}
                              disabled={goal.status === "done"}
                              style={{
                                background:
                                  goal.status === "done"
                                    ? "#2f7d55"
                                    : goal.status === "paused"
                                      ? `linear-gradient(to right, #d99f1a 0%, #d99f1a ${progress}%, #e9eceb ${progress}%)`
                                      : `linear-gradient(to right, #2f7d55 0%, #2f7d55 ${progress}%, #e9eceb ${progress}%)`,
                              }}
                              onChange={(e) => handleProgressChange(goal, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <button
                            className="goal-card-edit"
                            title="编辑目标"
                            onClick={(e) => { e.stopPropagation(); startEditingGoal(goal); }}
                          >
                            <Pencil size={15} />
                          </button>
                        </div>
                        {parentGoal && (
                          <span className="parent-goal">
                            <TargetIcon size={12} />
                            {parentGoal.title}
                          </span>
                        )}
                      </article>
                    );
                  })}
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="goal-graph-row">
            {["long", "month", "week"].map((type) => (
              <div className="goal-graph-cell" key={type}>
                <EmptyState icon={<TargetIcon size={22} />} text={`还没有${goalTypeLabel[type]}目标。`} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewView({
  selectedDate,
  todayTasks,
  dayPlan,
  reviewDraft,
  setReviewDraft,
  saveReview,
  submitReviewForm,
  carryUnfinished,
  reviews,
}) {
  const unfinished = todayTasks.filter((task) => task.status !== "done");
  const dailyReview = reviews.find((review) => review.date === selectedDate && review.type === "daily");

  return (
    <div className="review-layout">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">晚间复盘</p>
            <h2>{formatHumanDate(selectedDate)}</h2>
          </div>
          {unfinished.length > 0 && (
            <button className="secondary-action" onClick={carryUnfinished}>
              <RefreshCw size={18} />
              未完成顺延
            </button>
          )}
        </div>
        <form className="review-form" onSubmit={saveReview}>
          <label>
            今天完成了什么
            <textarea
              name="completed"
              value={reviewDraft.completed}
              onChange={(event) => setReviewDraft((draft) => ({ ...draft, completed: event.target.value }))}
              placeholder="结果、产出、推进"
            />
          </label>
          <label>
            卡点
            <textarea
              name="blockers"
              value={reviewDraft.blockers}
              onChange={(event) => setReviewDraft((draft) => ({ ...draft, blockers: event.target.value }))}
              placeholder="时间、资源、状态、外部变化"
            />
          </label>
          <label>
            需要调整什么
            <textarea
              name="adjustments"
              value={reviewDraft.adjustments}
              onChange={(event) => setReviewDraft((draft) => ({ ...draft, adjustments: event.target.value }))}
              placeholder="影响本周、本月或长期计划的变化"
            />
          </label>
          <label>
            明天优先处理
            <textarea
              name="tomorrowFocus"
              value={reviewDraft.tomorrowFocus}
              onChange={(event) => setReviewDraft((draft) => ({ ...draft, tomorrowFocus: event.target.value }))}
              placeholder="留给明天的第一件事"
            />
          </label>
          <button
            type="submit"
            className="primary-action"
            onClick={(event) => {
              event.preventDefault();
              submitReviewForm(event.currentTarget.form);
            }}
          >
            <Send size={18} />
            保存复盘
          </button>
        </form>
      </section>

      <section className="panel review-summary">
        <p className="eyebrow">今日状态</p>
        <h2>{dayPlan.eveningDone || dailyReview ? "已复盘" : "等待收束"}</h2>
        <div className="summary-list">
          <span>完成任务：{todayTasks.filter((task) => task.status === "done").length}</span>
          <span>未完成：{unfinished.length}</span>
          <span>精力：{dayPlan.energy}</span>
        </div>
        {dailyReview?.adjustments && (
          <div className="adjustment-callout">
            <Moon size={18} />
            <span>{dailyReview.adjustments}</span>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, tone = "" }) {
  return (
    <article className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="empty-state">
      {icon}
      <span>{text}</span>
    </div>
  );
}

export default App;

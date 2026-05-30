import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve("data");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");
const INDEX_FILE = path.join(DATA_DIR, ".index.json");
const DAILY_DIR = path.join(DATA_DIR, "daily");
const GOALS_MONTHLY_DIR = path.join(DATA_DIR, "goals", "monthly");
const GOALS_LONGTERM_DIR = path.join(DATA_DIR, "goals", "longterm");
const PROFILE_FILE = path.resolve("user-profile.json");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch {}
  return null;
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function mondayOf(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const day = dt.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  return formatDate(dt);
}

function sundayOf(dateStr) {
  const mon = mondayOf(dateStr);
  const [y, m, d] = mon.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + 6);
  return formatDate(dt);
}

function formatDate(dt) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function weekFileName(dateStr) {
  return `${mondayOf(dateStr)}-${sundayOf(dateStr)}.json`;
}

function monthKey(dateStr) {
  return dateStr.slice(0, 7);
}

function yearKey(dateStr) {
  return dateStr.slice(0, 4);
}

function loadAllData() {
  const result = {};

  // config
  const config = readJson(CONFIG_FILE) || {};
  result.settings = config.settings || {};
  result.ai = config.ai || {};

  // daily files
  const tasks = [];
  const blocks = [];
  const dayPlans = {};
  const reviews = [];
  if (fs.existsSync(DAILY_DIR)) {
    for (const name of fs.readdirSync(DAILY_DIR)) {
      if (!name.endsWith(".json")) continue;
      const file = readJson(path.join(DAILY_DIR, name));
      if (!file) continue;
      if (Array.isArray(file.tasks)) tasks.push(...file.tasks);
      if (Array.isArray(file.blocks)) blocks.push(...file.blocks);
      if (file.dayPlans) Object.assign(dayPlans, file.dayPlans);
      if (Array.isArray(file.reviews)) reviews.push(...file.reviews);
    }
  }
  result.tasks = tasks;
  result.blocks = blocks;
  result.dayPlans = dayPlans;
  result.reviews = reviews;

  // goals
  const goals = [];
  const index = readJson(INDEX_FILE) || { goals: {} };
  for (const dir of [GOALS_MONTHLY_DIR, GOALS_LONGTERM_DIR]) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".json")) continue;
      const file = readJson(path.join(dir, name));
      if (file && Array.isArray(file.goals)) goals.push(...file.goals);
    }
  }
  result.goals = goals;

  return result;
}

function saveAllData(data) {
  // config
  writeJson(CONFIG_FILE, { settings: data.settings || {}, ai: data.ai || {} });

  // group daily items by week
  const weeks = {};
  function weekFile(dateStr) {
    const key = weekFileName(dateStr);
    if (!weeks[key]) {
      const existing = readJson(path.join(DAILY_DIR, key)) || {};
      weeks[key] = {
        tasks: existing.tasks || [],
        blocks: existing.blocks || [],
        dayPlans: existing.dayPlans || {},
        reviews: existing.reviews || [],
      };
    }
    return weeks[key];
  }

  // tasks by week
  const taskById = {};
  (data.tasks || []).forEach((t) => {
    if (t.date) {
      const wf = weekFile(t.date);
      taskById[t.id] = t;
    }
  });
  // blocks by week
  (data.blocks || []).forEach((b) => {
    if (b.date) {
      weekFile(b.date);
    }
  });
  // dayPlans by week
  if (data.dayPlans) {
    Object.entries(data.dayPlans).forEach(([date, plan]) => {
      weekFile(date);
    });
  }
  // reviews by week
  (data.reviews || []).forEach((r) => {
    if (r.date) {
      weekFile(r.date);
    }
  });

  // Now rebuild each week file with the new data that belongs to it
  const weekDates = {};
  // Collect all dates that have tasks, blocks, dayPlans, or reviews
  (data.tasks || []).forEach((t) => { if (t.date) weekDates[t.date] = true; });
  (data.blocks || []).forEach((b) => { if (b.date) weekDates[b.date] = true; });
  if (data.dayPlans) Object.keys(data.dayPlans).forEach((d) => weekDates[d] = true);
  (data.reviews || []).forEach((r) => { if (r.date) weekDates[r.date] = true; });

  const weekFiles = new Set();
  Object.keys(weekDates).forEach((d) => weekFiles.add(weekFileName(d)));

  weekFiles.forEach((fileName) => {
    const stem = fileName.replace(".json", "");
    const ws = stem.slice(0, 10);
    const we = stem.slice(11, 21);
    writeJson(path.join(DAILY_DIR, fileName), {
      weekStart: ws,
      weekEnd: we,
      tasks: (data.tasks || []).filter((t) => t.date >= ws && t.date <= we),
      blocks: (data.blocks || []).filter((b) => b.date >= ws && b.date <= we),
      dayPlans: filterDayPlans(data.dayPlans || {}, ws, we),
      reviews: (data.reviews || []).filter((r) => r.date >= ws && r.date <= we),
    });
  });

  // goals
  const monthGoals = {};
  const yearGoals = {};
  const index = { goals: {} };

  (data.goals || []).forEach((g) => {
    if (g.type === "long") {
      const yk = yearKey(g.createdAt || new Date().toISOString());
      if (!yearGoals[yk]) yearGoals[yk] = [];
      yearGoals[yk].push(g);
      index.goals[g.id] = `longterm/${yk}.json`;
    } else {
      const mk = monthKey(g.createdAt || new Date().toISOString());
      if (!monthGoals[mk]) monthGoals[mk] = [];
      monthGoals[mk].push(g);
      index.goals[g.id] = `monthly/${mk}.json`;
    }
  });

  // Write month goal files
  const allMonthKeys = new Set(Object.keys(monthGoals));
  // Also read existing month files to get their keys (so we don't lose goals in inactive months)
  if (fs.existsSync(GOALS_MONTHLY_DIR)) {
    for (const name of fs.readdirSync(GOALS_MONTHLY_DIR)) {
      if (name.endsWith(".json")) allMonthKeys.add(name.replace(".json", ""));
    }
  }
  allMonthKeys.forEach((mk) => {
    const existing = readJson(path.join(GOALS_MONTHLY_DIR, `${mk}.json`)) || { goals: [] };
    const existingIds = new Set(existing.goals.map((g) => g.id));
    const updated = existing.goals.filter((g) => {
      // keep if still in data
      return (data.goals || []).some((ng) => ng.id === g.id);
    });
    // add/update from new data
    (monthGoals[mk] || []).forEach((g) => {
      const idx = updated.findIndex((eg) => eg.id === g.id);
      if (idx >= 0) updated[idx] = g;
      else updated.push(g);
    });
    writeJson(path.join(GOALS_MONTHLY_DIR, `${mk}.json`), { month: mk, goals: updated });
  });

  // Write year goal files
  const allYearKeys = new Set(Object.keys(yearGoals));
  if (fs.existsSync(GOALS_LONGTERM_DIR)) {
    for (const name of fs.readdirSync(GOALS_LONGTERM_DIR)) {
      if (name.endsWith(".json")) allYearKeys.add(name.replace(".json", ""));
    }
  }
  allYearKeys.forEach((yk) => {
    const existing = readJson(path.join(GOALS_LONGTERM_DIR, `${yk}.json`)) || { goals: [] };
    const updated = existing.goals.filter((g) => {
      return (data.goals || []).some((ng) => ng.id === g.id);
    });
    (yearGoals[yk] || []).forEach((g) => {
      const idx = updated.findIndex((eg) => eg.id === g.id);
      if (idx >= 0) updated[idx] = g;
      else updated.push(g);
    });
    writeJson(path.join(GOALS_LONGTERM_DIR, `${yk}.json`), { year: yk, goals: updated });
  });

  // index
  writeJson(INDEX_FILE, index);
}

function filterDayPlans(dayPlans, weekStart, weekEnd) {
  const result = {};
  Object.entries(dayPlans).forEach(([date, plan]) => {
    if (date >= weekStart && date <= weekEnd) result[date] = plan;
  });
  return result;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

function chatCompletionUrl(baseUrl) {
  const cleanBase = (baseUrl || "https://api.deepseek.com").replace(/\/+$/, "");
  return cleanBase.endsWith("/chat/completions")
    ? cleanBase
    : `${cleanBase}/chat/completions`;
}

function anthropicMessagesUrl(baseUrl) {
  const cleanBase = (baseUrl || "https://api.anthropic.com").replace(/\/+$/, "");
  return cleanBase.endsWith("/v1/messages") ? cleanBase : `${cleanBase}/v1/messages`;
}

function shouldForwardThinking(payload) {
  const provider = String(payload.provider || "").toLowerCase();
  const baseUrl = String(payload.baseUrl || "").toLowerCase();
  return provider === "deepseek" || baseUrl.includes("deepseek");
}

function toAnthropicMessages(messages = []) {
  const system = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .filter(Boolean)
    .join("\n\n");

  const turns = [];
  messages
    .filter((message) => message.role !== "system")
    .forEach((message) => {
      const role = message.role === "assistant" ? "assistant" : "user";
      const content = String(message.content || "");
      const previous = turns[turns.length - 1];

      if (previous?.role === role) {
        previous.content = `${previous.content}\n\n${content}`;
      } else {
        turns.push({ role, content });
      }
    });

  return { system, messages: turns };
}

function openAiBody(payload) {
  const provider = String(payload.provider || "").toLowerCase();
  const body = {
    model: payload.model || "deepseek-v4-pro",
    messages: payload.messages || [],
    temperature: payload.temperature ?? 0.3,
    stream: false,
  };

  if (provider === "openai" || provider === "minimax") {
    body.max_completion_tokens = payload.max_tokens ?? 1800;
  } else {
    body.max_tokens = payload.max_tokens ?? 1800;
  }

  if (payload.response_format) body.response_format = payload.response_format;
  if (payload.thinking && shouldForwardThinking(payload)) body.thinking = payload.thinking;

  return body;
}

async function callOpenAiCompatible(payload, apiKey) {
  return fetch(chatCompletionUrl(payload.baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(openAiBody(payload)),
  });
}

async function callAnthropic(payload, apiKey) {
  const converted = toAnthropicMessages(payload.messages || []);
  const body = {
    model: payload.model || "claude-opus-4-8",
    max_tokens: payload.max_tokens ?? 1800,
    messages: converted.messages,
  };

  if (converted.system) body.system = converted.system;

  const upstream = await fetch(anthropicMessagesUrl(payload.baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": payload.anthropicVersion || "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  const text = await upstream.text();
  let output = text;
  try {
    const data = JSON.parse(text);
    if (upstream.ok) {
      output = JSON.stringify({
        choices: [
          {
            message: {
              role: "assistant",
              content: (data.content || [])
                .filter((part) => part.type === "text")
                .map((part) => part.text)
                .join("\n"),
            },
          },
        ],
        raw: data,
      });
    } else if (data.error) {
      output = JSON.stringify({ error: data.error.message || data.error });
    }
  } catch {
    output = text;
  }

  return {
    status: upstream.status,
    headers: upstream.headers,
    text: async () => output,
  };
}

function dataProxy() {
  const handler = async (req, res, next) => {
    // data API routes
    if (req.url === "/api/data") {
      if (req.method === "GET") {
        try {
          const data = loadAllData();
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error.message || "Failed to load data." }));
        }
        return;
      }

      if (req.method === "POST") {
        try {
          const body = JSON.parse(await readBody(req));
          saveAllData(body);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true }));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error.message || "Failed to save data." }));
        }
        return;
      }
    }

    // user profile
    if (req.url === "/api/profile") {
      if (req.method === "GET") {
        try {
          const profile = readJson(PROFILE_FILE) || {};
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(profile));
        } catch (e) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: e.message }));
        }
        return;
      }
      if (req.method === "POST") {
        try {
          const body = JSON.parse(await readBody(req));
          writeJson(PROFILE_FILE, { ...body, updatedAt: new Date().toISOString() });
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: e.message }));
        }
        return;
      }
    }

    // AI status check
    if (req.url === "/api/ai/status" && req.method === "GET") {
      const keyOk = !!(process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ configured: keyOk }));
      return;
    }

    // AI proxy route
    if (req.url !== "/api/ai/chat" || req.method !== "POST") {
      next();
      return;
    }

    try {
      const payload = JSON.parse(await readBody(req));
      const protocol = payload.protocol || "openai-compatible";
      const apiKey =
        payload.apiKey ||
        process.env.AI_API_KEY ||
        (protocol === "anthropic" ? process.env.ANTHROPIC_API_KEY : process.env.DEEPSEEK_API_KEY);

      if (!apiKey) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Missing AI API key." }));
        return;
      }

      const upstream =
        protocol === "anthropic"
          ? await callAnthropic(payload, apiKey)
          : await callOpenAiCompatible(payload, apiKey);

      const text = await upstream.text();
      res.statusCode = upstream.status;
      res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
      res.end(text);
    } catch (error) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: error.message || "AI proxy failed." }));
    }
  };

  return {
    name: "local-api-proxy",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), dataProxy()],
});

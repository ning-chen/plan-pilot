import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
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

function aiProxy() {
  const handler = async (req, res, next) => {
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
    name: "local-ai-proxy",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), aiProxy()],
});

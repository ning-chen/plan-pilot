import { defaultState } from "../app/initialState.js";
import { getLocalDate } from "../utils/dateTime.js";

export function isRecurringDerivedBlock(block) {
  return Boolean(block?.recurringDerived) || String(block?.id || "").startsWith("rec-");
}

export function expandRecurringBlocks(items, existingBlocks = [], options = {}) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const blocks = [];
  const baseDate = options.baseDate ? new Date(`${options.baseDate}T00:00:00`) : new Date();
  const existingKeys = new Set(
    existingBlocks.map((block) => `${block.date}|${block.start}|${block.taskId || block.title || ""}`),
  );

  items.forEach((item) => {
    if (!Number.isInteger(item.dayOfWeek) || item.dayOfWeek < 0 || item.dayOfWeek > 6) return;
    const cursor = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    const endDate = item.endDate ? new Date(`${item.endDate}T00:00:00`) : null;
    const maxDate = new Date(baseDate.getFullYear() + 1, baseDate.getMonth(), baseDate.getDate());
    const limit = endDate && endDate < maxDate ? endDate : maxDate;

    while (cursor <= limit) {
      if (cursor.getDay() === item.dayOfWeek) {
        const date = getLocalDate(cursor);
        const key = `${date}|${item.start}|${item.taskId || item.title || ""}`;
        if (!existingKeys.has(key)) {
          blocks.push({
            id: `rec-${item.id || ""}-${date}`,
            recurringId: item.id || "",
            recurringDerived: true,
            date,
            type: "busy",
            taskId: "",
            title: item.title || "",
            start: item.start,
            end: item.end,
            auto: false,
          });
          existingKeys.add(key);
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  });

  return blocks;
}

export function replaceRecurringBlocks(items, blocks = [], options = {}) {
  const manualBlocks = blocks.filter((block) => !isRecurringDerivedBlock(block));
  return manualBlocks.concat(expandRecurringBlocks(items, manualBlocks, options));
}

export function hydrateState(input, options = {}) {
  const mergeTasks = options.mergeTasks || ((tasks) => tasks);

  return {
    ...defaultState,
    ...input,
    settings: {
      ...defaultState.settings,
      ...(input?.settings || {}),
      workSegments:
        input?.settings?.workSegments ||
        (input?.settings?.workStart
          ? [{ start: input.settings.workStart, end: input.settings.workEnd || "18:00" }]
          : defaultState.settings.workSegments),
      shortBreak: input?.settings?.shortBreak ?? input?.settings?.breakMinutes ?? defaultState.settings.shortBreak,
      longBreak: input?.settings?.longBreak ?? defaultState.settings.longBreak,
    },
    ai: (() => {
      const ai = { ...defaultState.ai, ...(input?.ai || {}) };
      delete ai.apiKey;
      return ai;
    })(),
    goals: Array.isArray(input?.goals)
      ? input.goals.map((goal) => ({ progress: 0, ...goal }))
      : [],
    tasks: mergeTasks(Array.isArray(input?.tasks) ? input.tasks : []),
    blocks: replaceRecurringBlocks(
      Array.isArray(input?.recurring) ? input.recurring : [],
      Array.isArray(input?.blocks) ? input.blocks : [],
      { baseDate: options.recurringBaseDate },
    ),
    dayPlans: input?.dayPlans && typeof input.dayPlans === "object" ? input.dayPlans : {},
    reviews: Array.isArray(input?.reviews) ? input.reviews : [],
    recurring: Array.isArray(input?.recurring) ? input.recurring : defaultState.recurring || [],
  };
}

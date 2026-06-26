import { test } from "node:test";
import assert from "node:assert/strict";

import {
  expandRecurringBlocks,
  hydrateState,
  isRecurringDerivedBlock,
  replaceRecurringBlocks,
} from "../src/planner/hydration.js";

test("hydrateState：迁移旧 workStart/workEnd，并兼容 breakMinutes", () => {
  const state = hydrateState({
    settings: {
      workStart: "08:30",
      workEnd: "17:30",
      breakMinutes: 15,
    },
  });

  assert.deepEqual(state.settings.workSegments, [{ start: "08:30", end: "17:30" }]);
  assert.equal(state.settings.shortBreak, 15);
  assert.equal(state.settings.longBreak, 30);
});

test("hydrateState：不会把旧数据里的 AI apiKey 带入 planner 状态", () => {
  const state = hydrateState({
    ai: {
      enabled: true,
      provider: "custom",
      apiKey: "secret-key",
    },
  });

  assert.equal(state.ai.provider, "custom");
  assert.equal(Object.hasOwn(state.ai, "apiKey"), false);
});

test("hydrateState：目标补 progress，非数组字段回退为空集合", () => {
  const state = hydrateState({
    goals: [{ id: "g1", title: "写论文", type: "long" }],
    tasks: null,
    blocks: null,
    reviews: "bad",
    dayPlans: "bad",
  });

  assert.deepEqual(state.goals, [{ progress: 0, id: "g1", title: "写论文", type: "long" }]);
  assert.deepEqual(state.tasks, []);
  assert.deepEqual(state.blocks, []);
  assert.deepEqual(state.reviews, []);
  assert.deepEqual(state.dayPlans, {});
});

test("hydrateState：通过显式 mergeTasks 注入任务去重策略", () => {
  const state = hydrateState(
    {
      tasks: [
        { id: "t1", title: "读论文", date: "2026-06-26" },
        { id: "t2", title: "读论文", date: "2026-06-26" },
      ],
    },
    {
      mergeTasks(tasks) {
        return tasks.slice(0, 1);
      },
    },
  );

  assert.equal(state.tasks.length, 1);
  assert.equal(state.tasks[0].id, "t1");
});

test("expandRecurringBlocks：从指定基准日期展开未来一年内的周期安排", () => {
  const blocks = expandRecurringBlocks(
    [{ id: "r1", title: "组会", dayOfWeek: 1, start: "09:00", end: "10:00", endDate: "2026-07-06" }],
    [],
    { baseDate: "2026-06-26" },
  );

  assert.deepEqual(
    blocks.map((block) => block.date),
    ["2026-06-29", "2026-07-06"],
  );
  assert.equal(blocks[0].id, "rec-r1-2026-06-29");
  assert.equal(blocks[0].recurringDerived, true);
});

test("replaceRecurringBlocks：保留手动块、丢弃旧派生块，并避免重复已有安排", () => {
  const manualBlock = {
    id: "manual-1",
    date: "2026-06-29",
    type: "busy",
    title: "组会",
    start: "09:00",
    end: "10:00",
  };
  const oldDerived = {
    id: "rec-r1-2026-06-22",
    recurringDerived: true,
    date: "2026-06-22",
    type: "busy",
    title: "组会",
    start: "09:00",
    end: "10:00",
  };

  const blocks = replaceRecurringBlocks(
    [{ id: "r1", title: "组会", dayOfWeek: 1, start: "09:00", end: "10:00", endDate: "2026-06-29" }],
    [manualBlock, oldDerived],
    { baseDate: "2026-06-26" },
  );

  assert.equal(blocks.length, 1);
  assert.equal(blocks[0], manualBlock);
  assert.equal(isRecurringDerivedBlock(oldDerived), true);
  assert.equal(isRecurringDerivedBlock(manualBlock), false);
});

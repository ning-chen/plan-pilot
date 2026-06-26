import { useEffect, useRef, useState } from "react";

import { defaultState } from "../app/initialState.js";
import { STORAGE_KEY } from "../constants/appConstants.js";
import { hydrateState } from "../planner/hydration.js";

function hasPlannerContent(fileData) {
  return (
    (Array.isArray(fileData.tasks) && fileData.tasks.length > 0) ||
    (Array.isArray(fileData.blocks) && fileData.blocks.length > 0) ||
    (Array.isArray(fileData.goals) && fileData.goals.length > 0) ||
    (fileData.dayPlans != null && typeof fileData.dayPlans === "object" && Object.keys(fileData.dayPlans).length > 0) ||
    (Array.isArray(fileData.reviews) && fileData.reviews.length > 0) ||
    (Array.isArray(fileData.recurring) && fileData.recurring.length > 0) ||
    (fileData.settings != null && typeof fileData.settings === "object" && Object.keys(fileData.settings).length > 0) ||
    (fileData.ai != null && typeof fileData.ai === "object" && Object.keys(fileData.ai).length > 0)
  );
}

export function hydratePlannerState(input, mergeTasks) {
  return hydrateState(input, { mergeTasks });
}

// 只负责 planner 持久化：localStorage 启动、文件同步，以及加载后的数据压缩
export function usePlannerStore({ compactPlannerTasks, mergeTasks }) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? hydratePlannerState(JSON.parse(raw), mergeTasks) : defaultState;
    } catch {
      return defaultState;
    }
  });
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    fetch("/api/data")
      .then((response) => response.json())
      .then((fileData) => {
        if (!fileData || fileData.error) return;

        if (hasPlannerContent(fileData)) {
          // 文件数据存在时优先使用文件，再把恢复后的结构同步回 localStorage。
          const merged = hydratePlannerState(fileData, mergeTasks);
          setState(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          return;
        }

        // 文件存储为空时，用已有 localStorage 初始化文件，避免首次升级时清空本地数据。
        const localRaw = localStorage.getItem(STORAGE_KEY);
        if (localRaw) {
          fetch("/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: localRaw,
          }).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [mergeTasks]);

  useEffect(() => {
    setState((current) => {
      const compacted = compactPlannerTasks(current.tasks, current.blocks);
      const tasksChanged = compacted.tasks.length !== current.tasks.length;
      const blocksChanged =
        compacted.blocks.length !== current.blocks.length ||
        compacted.blocks.some((block, index) => block !== current.blocks[index]);

      return tasksChanged || blocksChanged ? { ...current, ...compacted } : current;
    });
  }, [compactPlannerTasks, loaded]);

  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("localStorage write failed:", error);
    }

    // 文件写入防抖，避免连续编辑时频繁请求本地 API
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      }).catch(() => {});
    }, 2000);
    return () => clearTimeout(saveTimer.current);
  }, [state, loaded]);

  return [state, setState];
}

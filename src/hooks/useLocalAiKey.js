import { useState } from "react";

import { AI_KEY_STORAGE_KEY } from "../constants/appConstants.js";

function readLocalAiKey() {
  try {
    return localStorage.getItem(AI_KEY_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function useLocalAiKey() {
  const [localAiKey, setLocalAiKey] = useState(readLocalAiKey);

  function updateLocalAiKey(value) {
    setLocalAiKey(value);
    try {
      if (value) {
        localStorage.setItem(AI_KEY_STORAGE_KEY, value);
      } else {
        localStorage.removeItem(AI_KEY_STORAGE_KEY);
      }
    } catch (error) {
      console.error("AI key localStorage write failed:", error);
    }
  }

  return [localAiKey, updateLocalAiKey];
}

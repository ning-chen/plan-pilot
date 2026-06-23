export const defaultState = {
  settings: {
    workSegments: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "18:00" }],
    shortBreak: 10,
    longBreak: 30,
  },
  ai: {
    enabled: true,
    provider: "deepseek",
    protocol: "openai-compatible",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-v4-pro",
    profileLearningEnabled: false,
  },
  goals: [],
  tasks: [],
  blocks: [],
  dayPlans: {},
  reviews: [],
  recurring: [],
};

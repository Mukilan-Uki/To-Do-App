import Task from "../models/Task.js";
import Routine from "../models/Routine.js";
import { buildUnifiedSystemPrompt } from "../services/aiPrompt.js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

async function callGroq(messages, { stream = false } = {}) {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: 1200,
      temperature: 0.65,
      stream,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Groq API error");
  }
  return response;
}

export const getAIContext = async (req, res) => {
  try {
    const tasks = await Task.find({
      $or: [
        { owner: req.user._id },
        { user: req.user._id },
        { collaborators: req.user._id },
      ],
    })
      .sort({ order: 1, createdAt: -1 })
      .select("title type status progress priority category dueDate subtasks order");

    let routine = await Routine.findOne({ owner: req.user._id });
    if (!routine) {
      routine = { title: "My Daily Routine", items: [] };
    }

    res.json({ tasks, routine });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unifiedChat = async (req, res) => {
  const { messages, context: clientContext } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ message: "Messages array is required" });
  }

  try {
    let context = clientContext;
    if (!context?.tasks) {
      const tasks = await Task.find({
        $or: [
          { owner: req.user._id },
          { user: req.user._id },
          { collaborators: req.user._id },
        ],
      }).sort({ order: 1, createdAt: -1 });
      const routine =
        (await Routine.findOne({ owner: req.user._id })) || { items: [] };
      context = { tasks, routine };
    }

    const systemPrompt = buildUnifiedSystemPrompt(context);
    const response = await callGroq([
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ]);

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content || "";
    return res.json({ content: aiText, context });
  } catch (error) {
    console.error("Unified AI error:", error);
    return res
      .status(500)
      .json({ message: "Failed to reach AI service", error: error.message });
  }
};

export const unifiedChatStream = async (req, res) => {
  const { messages, context: clientContext } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ message: "Messages array is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    let context = clientContext;
    if (!context?.tasks) {
      const tasks = await Task.find({
        $or: [
          { owner: req.user._id },
          { user: req.user._id },
          { collaborators: req.user._id },
        ],
      }).sort({ order: 1, createdAt: -1 });
      const routine =
        (await Routine.findOne({ owner: req.user._id })) || { items: [] };
      context = { tasks, routine };
    }

    const systemPrompt = buildUnifiedSystemPrompt(context);
    const response = await callGroq(
      [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      { stream: true },
    );

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((l) => l.trim());

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") {
          res.write("data: [DONE]\n\n");
          break;
        }
        try {
          const json = JSON.parse(payload);
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        } catch {
          /* ignore */
        }
      }
    }
    res.end();
  } catch (error) {
    console.error("Unified AI stream error:", error);
    res.write(
      `data: ${JSON.stringify({ error: error.message || "Stream failed" })}\n\n`,
    );
    res.end();
  }
};

/* Legacy endpoints kept for compatibility */
const LEGACY_TASK_PROMPT = `You are a smart task creation assistant for DoNow. Output tasks in <task> JSON when ready.`;

export const chatWithAI = async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ message: "Messages array is required" });
  }
  try {
    const response = await callGroq([
      { role: "system", content: LEGACY_TASK_PROMPT },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ]);
    const data = await response.json();
    return res.json({ content: data.choices?.[0]?.message?.content || "" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to reach AI service" });
  }
};

export const chatRoutineHealth = async (req, res) => {
  return unifiedChat(req, res);
};

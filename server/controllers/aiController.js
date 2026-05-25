const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are a smart task creation assistant for a to-do app called "Do(es)". 
Your job is to help users create tasks by chatting with them.

When you have enough information to create a task, output a JSON block like this:
<task>
{
  "title": "Task title",
  "description": "Optional description",
  "priority": "High|Medium|Low",
  "category": "Work|Personal|Health|Finance|General|etc",
  "type": "simple|project",
  "dueDate": "YYYY-MM-DD or null",
  "subtasks": []
}
</task>

For project type tasks, suggest 2-5 subtasks as an array of strings.
Ask clarifying questions naturally if needed. Be concise and friendly.
Only output the <task> block when you have enough details (at minimum a title).
If the user says something vague like "create a task to buy groceries", immediately create it without asking questions.`;

const ROUTINE_HEALTH_PROMPT = `You are a warm, knowledgeable health & wellness coach helping users build daily routines in a to-do app called "DoNow".

When the user shares routine items (especially workout, health, or wellness), ask 1-2 friendly follow-up questions at a time, such as:
- What is your main goal? (weight loss, muscle gain, general fitness, energy)
- How many hours do you sleep on average?
- Any health conditions or injuries to consider?
- How experienced are you with workouts?

After you have enough context, provide natural suggestions: better timing, rest between activities, hydration, realistic pacing, and brief motivation.

When ready to offer actionable routine changes, output a JSON block:
<suggestions>
{
  "message": "Friendly summary of your advice",
  "improvedItems": [
    { "title": "Activity name", "time": "HH:MM", "duration": 15, "category": "health|workout|wellness|general", "note": "why this helps" }
  ],
  "tips": ["tip 1", "tip 2"]
}
</suggestions>

Only output <suggestions> when you have asked at least 2 questions and received answers, OR the user explicitly asks to skip questions and get suggestions.
Be conversational, encouraging, never robotic. Keep responses concise (2-4 sentences) unless listing suggestions.`;

export const chatRoutineHealth = async (req, res) => {
  const { messages, routineItems } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ message: "Messages array is required" });
  }

  const routineContext = routineItems?.length
    ? `\nUser's current routine items:\n${routineItems.map((i) => `- ${i.time} ${i.title} (${i.category})`).join("\n")}`
    : "";

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: ROUTINE_HEALTH_PROMPT + routineContext },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 900,
        temperature: 0.75,
      }),
    });

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content || "";
    return res.json({ content: aiText });
  } catch (error) {
    console.error("Routine health AI error:", error);
    return res.status(500).json({ message: "Failed to reach AI service" });
  }
};

export const chatWithAI = async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ message: "Messages array is required" });
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    console.log("Groq response:", JSON.stringify(data, null, 2));
    const aiText = data.choices?.[0]?.message?.content || "";
    return res.json({ content: aiText });

  } catch (error) {
    console.error("AI proxy error:", error);
    return res.status(500).json({ message: "Failed to reach AI service", error: error.message });
  }
};
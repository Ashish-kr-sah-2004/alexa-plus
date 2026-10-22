import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import dns from 'node:dns';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { getUserProfile, saveUserProfile, logEvaluation } from './memory.js';
import { getDailyProblem, evaluateVerbalApproach, performWebSearch } from './tools.js';

// Prioritize IPv4 over IPv6 on Windows to eliminate 10s connection timeout lag
dns.setDefaultResultOrder('ipv4first');

const app = express();
app.use(express.json({ limit: '1mb' })); // Limit request body size
app.use(cors());

// STABILITY: Global crash handlers — prevent silent server death
process.on('uncaughtException', (err) => {
    console.error('🔴 UNCAUGHT EXCEPTION (server stayed alive):', err.message);
});
process.on('unhandledRejection', (reason) => {
    console.error('🔴 UNHANDLED REJECTION (server stayed alive):', reason);
});

// Optional AWS Bedrock client (fails gracefully to Groq if keys are not set)
let bedrock = null;
const awsKey = process.env.AWS_ACCESS_KEY_ID;
if (awsKey && !awsKey.startsWith("YOUR_") && awsKey !== "YOUR_AWS_ACCESS_KEY_HERE") {
    try {
        bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });
        console.log("☁️ Connected to AWS Bedrock.");
    } catch (e) {
        console.warn("AWS Bedrock init failed:", e.message);
    }
}

// Health Check & Root Endpoints for Cloud Deployments (Render, AWS, Railway)
app.get('/', (req, res) => res.json({ status: 'ok', service: 'alexa-plus-backend', time: new Date().toISOString() }));
app.get('/health', (req, res) => res.json({ status: 'healthy', uptime: process.uptime() }));

// 1. GET /api/profile - Returns candidate profile, streaks, and tracked weaknesses
app.get('/api/profile', async (req, res) => {
    const userId = req.query.userId || "user123";
    try {
        const profile = await getUserProfile(userId);
        res.json({ success: true, profile });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. POST /api/profile/mode - Sets active specialist mode
app.post('/api/profile/mode', async (req, res) => {
    const { userId = "user123", mode = "tech_coach" } = req.body;
    try {
        const profile = await saveUserProfile(userId, { currentMode: mode });
        res.json({ success: true, profile });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2b. POST /api/profile/focus - Sets active focus topic
app.post('/api/profile/focus', async (req, res) => {
    const { userId = "user123", focus = "Time Complexity : O(n²)" } = req.body;
    try {
        const profile = await getUserProfile(userId);
        const existing = profile.weakTopics || [];
        const weakTopics = [focus, ...existing.filter(t => t !== focus)];
        const updated = await saveUserProfile(userId, { weakTopics });
        res.json({ success: true, profile: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2c. POST /api/profile/solve - Increments solved count when candidate solves an exam question
app.post('/api/profile/solve', async (req, res) => {
    const { userId = "user123", topic = "Exam Practice" } = req.body;
    try {
        const profile = await getUserProfile(userId);
        const problemsSolved = (profile.problemsSolved || 0) + 1;
        const updated = await saveUserProfile(userId, { problemsSolved });
        res.json({ success: true, profile: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// In-memory conversation history store per user (capped to prevent memory leak)
const chatHistories = new Map();
const MAX_USERS_IN_MEMORY = 100; // Evict oldest users when limit exceeded

// Simple per-user rate limiter: max 3 requests per second
const userLastRequestTime = new Map();
const RATE_LIMIT_MS = 333; // Minimum 333ms between requests per user

// 3. POST /api/chat - Central AI Orchestrator & Intent Router
app.post('/api/chat', async (req, res) => {
    const { userPrompt, userId = "user123", mode } = req.body;
    if (!userPrompt || !userPrompt.trim()) {
        return res.status(400).json({ error: "userPrompt is required" });
    }

    // Rate limit check per user
    const now = Date.now();
    const lastReq = userLastRequestTime.get(userId) || 0;
    if (now - lastReq < RATE_LIMIT_MS) {
        return res.status(429).json({ response: "Please wait a moment before sending another request.", error: "rate_limited" });
    }
    userLastRequestTime.set(userId, now);

    console.log(`[${userId}] Received prompt: "${userPrompt}"`);

    // A. Load Persistent Candidate Profile
    const profile = await getUserProfile(userId);
    let activeMode = mode || profile.currentMode || "tech_coach";

    // Initialize in-memory conversation history
    if (!chatHistories.has(userId)) {
        // Evict oldest user if we have too many in memory
        if (chatHistories.size >= MAX_USERS_IN_MEMORY) {
            const oldestKey = chatHistories.keys().next().value;
            chatHistories.delete(oldestKey);
        }
        chatHistories.set(userId, []);
    }
    const userHistory = chatHistories.get(userId);

    // Helper to send response and persist conversation turn
    const sendResponse = (replyText, extra = {}) => {
        // Strip out huge exam questions/code blocks when storing in short-term history to stay under TPM limits
        const leanReply = replyText.replace(/\[EXAM_QUESTIONS\][\s\S]*?\[\/EXAM_QUESTIONS\]/g, "").replace(/```[\s\S]*?```/g, "").trim();
        userHistory.push({ role: "user", content: userPrompt });
        userHistory.push({ role: "assistant", content: leanReply || replyText.slice(0, 200) });
        // Keep only last 6 messages (3 turns) to prevent unbounded memory growth and token rate limits
        if (userHistory.length > 6) {
            chatHistories.set(userId, userHistory.slice(-6));
        }
        return res.json({ response: replyText, profile, ...extra });
    };

    const lower = userPrompt.toLowerCase().trim();

    // B. Detect Voice Mode Switching Commands
    if (lower.includes("switch to study coach") || lower.includes("study mode") || lower.includes("aptitude mode")) {
        activeMode = "study_coach";
        await saveUserProfile(userId, { currentMode: activeMode });
        return sendResponse("Switched to Study Coach mode! I am ready to test your Quantitative Aptitude, Logical Reasoning, and Speed Math for Amazon assessments.");
    }
    if (lower.includes("switch to tech coach") || lower.includes("dsa mode") || lower.includes("coding mode")) {
        activeMode = "tech_coach";
        await saveUserProfile(userId, { currentMode: activeMode });
        return sendResponse("Switched to Tech Coach mode! Ready for Data Structures, Java algorithms, and verbal system complexity interviews.");
    }
    if (lower.includes("switch to general") || lower.includes("assistant mode") || lower.includes("general mode")) {
        activeMode = "general_assistant";
        await saveUserProfile(userId, { currentMode: activeMode });
        return sendResponse("Switched to General Assistant mode! Ask me anything for quick, ChatGPT-style concise answers.");
    }

    // C. Detect Interactive Dashboard Command
    if (lower.includes("dashboard") || lower.includes("open dashboard") || lower.includes("mcp dashboard")) {
        return sendResponse("Opening your interactive MCP Dashboard now. [VIEW:DASHBOARD]");
    }

    // D. Tool 1: Targeted Problem Request Detection (DSA & Aptitude)
    const isExplainQuery = lower.startsWith("what is") || lower.startsWith("what's") || lower.startsWith("explain") || lower.startsWith("how to") || lower.startsWith("how do") || lower.startsWith("why is") || lower.startsWith("tell me about") || lower.startsWith("difference between");

    // In General Assistant mode, keep queries conversational unless user explicitly asks for DSA/practice problem
    const isProblemRequest = !isExplainQuery && (
        activeMode === "general_assistant"
            ? (lower.includes("dsa problem") || lower.includes("leetcode") || lower.includes("aptitude test") || lower.includes("give me a problem") || lower.includes("daily problem") || lower.includes("practice question"))
            : (
                lower.includes("problem") ||
                lower.includes("question") ||
                lower.includes("sawal") ||
                lower.includes("challenge") ||
                lower.includes("daily") ||
                lower.includes("practice") ||
                lower.includes("next") ||
                lower.includes("another") ||
                lower.includes("dsa") ||
                lower.includes("quant") ||
                lower.includes("aptitude") ||
                lower.includes("reasoning") ||
                lower.includes("verbal") ||
                lower.includes("leetcode") ||
                lower.includes("array") ||
                lower.includes("linked list") ||
                lower.includes("tree") ||
                lower.includes("trie") ||
                lower.includes("segment tree") ||
                lower.includes("lru") ||
                lower.includes("stack") ||
                lower.includes("binary search") ||
                lower.includes("dynamic programming") ||
                lower.includes("dp") ||
                lower.includes("graph") ||
                lower.includes("sliding window") ||
                lower.includes("string")
            )
    );

    // E. Tool 2: Verbal Algorithm Evaluation (Memory-Logged) — Only active in Tech Coach mode
    const evalResult = (activeMode === "tech_coach") ? evaluateVerbalApproach(userPrompt) : null;
    if (evalResult) {
        const updatedProfile = await logEvaluation(userId, {
            topic: "Verbal Algorithm Interview",
            approach: userPrompt,
            verdict: evalResult.verdict,
            weakness: evalResult.weakness,
            strength: evalResult.strength,
            solved: evalResult.optimal
        });

        const reply = `${evalResult.verdict}\n\n*Complexity Analysis:* ${evalResult.complexity}.\nI have updated your candidate profile memory accordingly.`;
        return sendResponse(reply, { profile: updatedProfile });
    }

    // F. Live Web-Grounded AI Generation (AWS Bedrock primary with Groq zero-latency fallback)
    try {
        let searchSnippets = [];

        // Dynamic Real-Time Web Scraping for ANY requested topic / problem or real-time query
        if (isProblemRequest) {
            const cleanTopic = lower
                .replace(/give me a|give me|ek|provide a|provide|practice|problem|question|sawal|challenge|on|for|from web|from website|from leetcode|from indiabix|please/gi, "")
                .trim();
            const queryStr = (activeMode === "tech_coach" || lower.includes("dsa") || lower.includes("leetcode") || lower.includes("code"))
                ? `leetcode ${cleanTopic || "popular interview"} problem statement examples`
                : `indiabix ${cleanTopic || "quantitative aptitude"} questions options explanation`;
            searchSnippets = await performWebSearch(queryStr);
        } else {
            const needsSearch = lower.includes("weather") || lower.includes("news") || lower.includes("score") || lower.includes("latest") || lower.includes("stock") || lower.startsWith("search ") || lower.includes("search for") || lower.includes("who is") || lower.includes("when is") || lower.includes("current");
            if (needsSearch) {
                searchSnippets = await performWebSearch(userPrompt);
            }
        }

        // Construct Persona System Prompt
        let modeInstructions = "";
        if (activeMode === "tech_coach") {
            modeInstructions = `You are Alexa+, the elite AI Tech & DSA Coach on an Echo Show device.
Your role: Prepare software engineers for Amazon and FAANG technical interviews using REAL, LIVE problems grounded from LeetCode and the web.

RULES:
1. Concise Spoken Delivery: Speak a 1-sentence intro (under 25 words) before the problem, e.g. "Here is your problem on [Topic] from the web. Read the statement and write your solution on screen!"
2. Dynamic Problem Formatting: ALWAYS format the question inside an [EXAM_QUESTIONS] JSON array block:
[EXAM_QUESTIONS]
[
  {
    "id": "web_dsa_1",
    "title": "Exact Problem Name (e.g., LRU Cache / Course Schedule / Implement Trie)",
    "topic": "Topic Name (e.g., Design, Dynamic Programming, Graphs)",
    "difficulty": "Easy" or "Medium" or "Hard",
    "question": "Full comprehensive problem description with clear problem narrative and method requirements",
    "examples": [
      {
        "input": "...",
        "output": "...",
        "explanation": "..."
      }
    ],
    "constraints": "e.g., 1 <= n <= 10^5, -10^4 <= val <= 10^4",
    "solutionCode": "Complete clean production-ready Java solution",
    "pythonCode": "Complete clean Python 3 solution",
    "cppCode": "Complete clean C++ solution",
    "jsCode": "Complete clean JavaScript solution",
    "targetOptimization": "Optimal Time: O(...) | Space: O(...)"
  }
]
[/EXAM_QUESTIONS]

3. Code Display: Immediately after [/EXAM_QUESTIONS], output the complete optimal Java solution inside a standard markdown code block:
\`\`\`java
// Complete Optimal Solution
\`\`\`
4. Personalization: Past identified weak topics: ${profile.weakTopics?.join(", ") || "None yet"}.
5. Remember user's name, context, and previous answers in this conversation.`;
        } else if (activeMode === "study_coach") {
            modeInstructions = `You are Alexa+, the AI Study Coach on an Echo Show device.
Your role: Help students master Amazon Online Assessment (OA) and FAANG campus tests:
- Quantitative Aptitude (Averages, Speed & Distance, Ages, Work & Time, Profit/Loss, Mixtures, Probability, Permutations)
- Logical Reasoning (Coding-Decoding, Syllogisms, Blood Relations, Number Series, Direction Sense)
- Verbal Aptitude (Subject-Verb Agreement, Spotting Errors, Idioms & Phrases, Antonyms, Critical Reasoning)

CRITICAL REAL-EXAM RULES:
1. When providing practice problems, quiz, or questions in Quantitative Aptitude, Logical Reasoning, or Verbal Aptitude:
   - Spoken speech MUST be short (under 25 words), e.g. "Here is your practice question from the web. Read the statement on screen and select your option!"
   - NEVER reveal or speak the answer or options aloud.
   - Do NOT wrap JSON in markdown code fences. Put pure valid JSON directly between [EXAM_QUESTIONS] and [/EXAM_QUESTIONS].
   - ALWAYS format the question(s) inside an [EXAM_QUESTIONS] JSON block like this:
[EXAM_QUESTIONS]
[
  {
    "id": "q1",
    "topic": "Topic Name (e.g., Coding-Decoding / Average Speed / Permutations / Subject-Verb Agreement)",
    "section": "Quantitative Aptitude" or "Logical Reasoning" or "Verbal Aptitude",
    "difficulty": "Easy" or "Medium" or "Hard",
    "marks": "+3 / -0.75",
    "question": "Full clear question statement with all necessary numbers and conditions",
    "options": ["42 km/h", "48 km/h", "54 km/h", "60 km/h"],
    "correctOption": 1,
    "hint": "Formula hint or logical clue without revealing the final answer",
    "explanation": "Step-by-step mathematical or logical derivation"
  }
]
[/EXAM_QUESTIONS]

CRITICAL RULE FOR OPTIONS:
- The "options" array MUST contain 4 real, distinct, actual choices with real values, numbers, or phrases (e.g. ["42 km/h", "48 km/h", "54 km/h", "60 km/h"] or ["O(N)", "O(log N)", "O(N^2)", "O(1)"]).
- NEVER EVER output literal dummy placeholders like "Option A", "Option B", "Option C", or "Option D"! The user MUST see the actual values so they can choose the correct answer.

2. If the user asks for an explanation, explain step-by-step with formulas or grammar rules in clear markdown.
3. Remember user's name, preferences, and context from earlier conversation turns.`;
        } else {
            modeInstructions = `You are a ChatGPT-style AI assistant (Alexa+) on an Echo Show device.
YOUR GOAL: Provide crisp, intelligent, direct, and concise short answers just like ChatGPT.

CRITICAL RULES:
1. ChatGPT-Style Short Answers: Answer directly in 2 to 4 crisp sentences (typically under 60-80 words). Do NOT waste words with conversational throat-clearing (avoid "Sure!", "As an AI...", "Here is what you need to know...", "Certainly!").
2. Core First: State the answer or key insight immediately in the first sentence.
3. Clean & Readable: If listing items or steps, provide at most 2-3 brief bullet points.
4. Factual & Grounded: If real-time web search results are provided below, synthesize them accurately into a quick summary.
5. NO Exam Questions / LeetCode Cards: Never output [EXAM_QUESTIONS] JSON blocks or problem schemas in General Assistant mode unless explicitly asked for a quiz.
6. Friendly & Smart: Maintain a helpful, confident, and professional ChatGPT tone.`;
        }

        const systemPrompt = `${modeInstructions}
${searchSnippets.length > 0 ? `\nREAL-TIME WEB SEARCH RESULTS:\n` + searchSnippets.map((s, i) => `[${i + 1}] ${s}`).join("\n") : ""}`;

        const historyMessages = [
            ...userHistory,
            { role: "user", content: userPrompt }
        ];

        const aiMaxTokens = activeMode === "general_assistant" ? 400 : 2048;

        // 1. Try AWS Bedrock if client initialized
        if (bedrock) {
            try {
                const modelId = process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0";
                let payload = {};

                if (modelId.includes("claude")) {
                    payload = {
                        anthropic_version: "bedrock-2023-05-31",
                        max_tokens: aiMaxTokens,
                        system: systemPrompt,
                        messages: historyMessages
                    };
                } else if (modelId.includes("titan")) {
                    payload = {
                        inputText: `${systemPrompt}\n\nUser: ${userPrompt}\n\nAssistant:`,
                        textGenerationConfig: { maxTokenCount: aiMaxTokens, temperature: 0.2 }
                    };
                } else {
                    payload = {
                        prompt: `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n${userPrompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n`,
                        max_gen_len: aiMaxTokens,
                        temperature: 0.2
                    };
                }

                const command = new InvokeModelCommand({
                    modelId,
                    contentType: "application/json",
                    accept: "application/json",
                    body: JSON.stringify(payload)
                });

                const bedrockRes = await bedrock.send(command);
                const rawString = new TextDecoder().decode(bedrockRes.body);
                const decoded = JSON.parse(rawString);

                let reply = "";
                if (decoded.content && decoded.content[0]?.text) {
                    reply = decoded.content[0].text;
                } else if (decoded.generation) {
                    reply = decoded.generation;
                } else if (decoded.results && decoded.results[0]?.outputText) {
                    reply = decoded.results[0].outputText;
                }

                if (reply) {
                    console.log("☁️ Successfully generated response via AWS Bedrock.");
                    return sendResponse(reply, { provider: "AWS Bedrock" });
                }
            } catch (bedrockErr) {
                console.warn("AWS Bedrock execution failed, falling back to Groq:", bedrockErr.message);
            }
        }

        // 2. Groq AI Generation Fallback
        const groqApiKey = process.env.GROQ_API_KEY;
        if (groqApiKey && !groqApiKey.startsWith("YOUR_") && groqApiKey !== "YOUR_GROQ_API_KEY_HERE") {
            const modelsToTry = ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.8-27b"];
            for (const groqModel of modelsToTry) {
                try {
                    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${groqApiKey}`
                        },
                        body: JSON.stringify({
                            model: groqModel,
                            messages: [
                                { role: "system", content: systemPrompt },
                                ...historyMessages
                            ],
                            temperature: 0.2,
                            max_tokens: aiMaxTokens
                        }),
                        signal: AbortSignal.timeout(25000) // 25-second timeout on Groq calls
                    });

                    if (groqRes.ok) {
                        const groqData = await groqRes.json();
                        const reply = groqData.choices?.[0]?.message?.content;
                        if (reply) {
                            console.log(`⚡ Successfully generated response via Groq (${groqModel}).`);
                            return sendResponse(reply, { provider: "Groq" });
                        }
                    } else {
                        const errBody = await groqRes.text();
                        console.error(`Groq API error (${groqModel}):`, groqRes.status, errBody);
                    }
                } catch (netErr) {
                    console.error(`Groq network error (${groqModel}):`, netErr.message);
                }
            }
        }
    } catch (err) {
        console.error("AI reasoning error:", err.message);
    }

    // G. Fallback Response (only if all AI providers fail or network offline)
    if (activeMode === "general_assistant") {
        return sendResponse("I'm here as your general AI assistant! Ask me any question, live facts, or tech concepts for quick, ChatGPT-style concise answers.", { provider: "Offline Assistant" });
    }

    if (isProblemRequest) {
        const problem = getDailyProblem(activeMode, profile.weakTopics, lower);
        if (activeMode === "study_coach") {
            const spokenIntro = `Here is your practice problem on ${problem.topic || problem.title}. Read the statement on screen and select your option!`;
            const reply = `${spokenIntro}\n\n[EXAM_QUESTIONS]\n${JSON.stringify([problem], null, 2)}\n[/EXAM_QUESTIONS]`;
            return sendResponse(reply, { provider: "Offline Bank Fallback" });
        } else {
            const prefix = problem.topic ? `Here is your ${problem.topic} challenge: ` : "Here is your curated problem: ";
            const spokenIntro = `${prefix}${problem.title} (${problem.difficulty}).`;
            const reply = `${spokenIntro}\n\n[EXAM_QUESTIONS]\n${JSON.stringify([problem], null, 2)}\n[/EXAM_QUESTIONS]\n\n\`\`\`java\n${problem.solutionCode}\n\`\`\`\n\nExplain your verbal approach aloud, and I will evaluate your Time and Space complexity!`;
            return sendResponse(reply, { provider: "Offline Bank Fallback" });
        }
    }

    let fallbackReply = `I am currently in ${activeMode} mode. How can I help you today?`;
    return sendResponse(fallbackReply, { provider: "Fallback" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Alexa+ Backend running on port ${PORT}`));

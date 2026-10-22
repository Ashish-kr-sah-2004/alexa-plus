"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Clock,
  Flag,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  Lightbulb,
  BookOpen,
  Award,
  Check,
  Send,
  Eye,
  EyeOff,
  Flame,
  Zap,
} from "lucide-react";

export interface ExamQuestion {
  id: string | number;
  topic?: string;
  section?: string;
  difficulty?: string;
  marks?: string;
  question: string;
  options: string[];
  correctOption?: number;
  answer?: string;
  hint?: string;
  explanation?: string;
  solutionCode?: string;
}

interface ExamArenaProps {
  rawText: string;
  activeMode: string;
  onAnswerSubmitted?: (isCorrect: boolean, questionTitle: string) => void;
  onVoiceTrigger?: () => void;
}

// Robust helper to safely convert ANY data structure (including objects with {statements}, arrays, etc.) into clean strings for React children
export function normalizeToString(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "number" || typeof val === "boolean") return String(val);

  if (Array.isArray(val)) {
    return val
      .map((item) => normalizeToString(item))
      .filter(Boolean)
      .join("\n");
  }

  if (typeof val === "object") {
    const parts: string[] = [];

    if (val.text || val.prompt || val.title || val.question) {
      const main = normalizeToString(val.text || val.prompt || val.title || val.question);
      if (main) parts.push(main);
    }

    if (val.context) {
      const ctx = normalizeToString(val.context);
      if (ctx) parts.push(`Context:\n${ctx}`);
    }

    // Handles the exact error: object with keys {statements}
    if (val.statements) {
      const stmts = normalizeToString(val.statements);
      if (stmts) parts.push(`Statements:\n${stmts}`);
    }

    if (val.conclusions) {
      const conc = normalizeToString(val.conclusions);
      if (conc) parts.push(`Conclusions:\n${conc}`);
    }

    if (val.premises) {
      const prem = normalizeToString(val.premises);
      if (prem) parts.push(`Premises:\n${prem}`);
    }

    if (val.conditions) {
      const cond = normalizeToString(val.conditions);
      if (cond) parts.push(`Conditions:\n${cond}`);
    }

    if (val.steps) {
      const steps = normalizeToString(val.steps);
      if (steps) parts.push(`Steps:\n${steps}`);
    }

    if (parts.length > 0) {
      return parts.join("\n\n");
    }

    // Fallback: extract stringifiable key-values
    const entries = Object.entries(val)
      .map(([k, v]) => {
        const cleanKey = k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const cleanVal = normalizeToString(v);
        return cleanVal ? `${cleanKey}:\n${cleanVal}` : "";
      })
      .filter(Boolean);

    if (entries.length > 0) {
      return entries.join("\n\n");
    }

    try {
      return JSON.stringify(val);
    } catch {
      return "";
    }
  }

  return String(val);
}

// Generate smart distractor options if text only provided an answer
function generateDistractors(answerText: string): string[] {
  const cleanAns = normalizeToString(answerText).replace(/\.$/, "");
  // Check if it's a number with units like "3 years", "₹864", "40 L", "150 meters", "8 days"
  const numberMatch = cleanAns.match(/^([₹$€]?)\s*([\d.]+)\s*([a-zA-Z%]*)$/);

  if (numberMatch) {
    const prefix = numberMatch[1] ? numberMatch[1] : "";
    const val = parseFloat(numberMatch[2]);
    const unit = numberMatch[3] ? ` ${numberMatch[3].trim()}` : "";

    let d1, d2, d3;
    if (val <= 10) {
      d1 = Math.max(1, val - 1);
      d2 = val + 2;
      d3 = val + 3;
    } else if (val <= 100) {
      d1 = Math.round(val * 0.8);
      d2 = Math.round(val * 1.15);
      d3 = Math.round(val * 1.25);
    } else {
      d1 = Math.round(val - 64);
      d2 = Math.round(val - 24);
      d3 = Math.round(val + 36);
    }

    const set = Array.from(new Set([val, d1, d2, d3])).slice(0, 4);
    while (set.length < 4) set.push(val + set.length * 2);

    // Options with prefix & unit
    const options = set.map((n) => `${prefix}${n}${unit}`);
    return options;
  }

  // Fallback default options
  return [
    cleanAns && !/^Option\s+[A-D]$/i.test(cleanAns) ? cleanAns : "Correct Value",
    `Alternative Value 1`,
    `Alternative Value 2`,
    `Cannot be determined`,
  ];
}

// Ensure options are ALWAYS real, distinct, and never dummy placeholders like "Option A"
function cleanAndSanitizeOptions(
  rawOptions: any[],
  questionText: any = "",
  answerText: any = "",
  explanationText: any = ""
): { options: string[]; correctIdx: number } {
  const qStr = normalizeToString(questionText);
  const aStr = normalizeToString(answerText);
  const eStr = normalizeToString(explanationText);

  const isPlaceholder = (s: string) => {
    if (!s) return true;
    const t = s.trim();
    return /^Option\s+[A-D]$/i.test(t) || /^[A-D]$/i.test(t) || t.toLowerCase() === "placeholder";
  };

  // Strip prefixes like "A) ", "Option A: ", "(B) "
  let cleaned = (Array.isArray(rawOptions) ? rawOptions : [])
    .map((o) => normalizeToString(o))
    .map((o) => o.replace(/^(?:Option\s+[A-D]|[\([A-D]\)])\s*[:\.\-–]?\s*/i, "").trim())
    .filter((o) => o.length > 0);

  const allOrMostlyPlaceholders =
    cleaned.length === 0 || cleaned.filter((o) => !isPlaceholder(o)).length <= 1;

  if (!allOrMostlyPlaceholders && cleaned.length >= 2) {
    while (cleaned.length < 4) {
      cleaned.push("None of the above");
    }
    cleaned = cleaned.slice(0, 4).map((c, i) => {
      if (isPlaceholder(c)) {
        return i === 3 ? "None of the above" : `Choice ${i + 1}`;
      }
      return c;
    });

    let correct = 0;
    if (aStr) {
      const aLower = aStr.toLowerCase().trim();
      const matchIdx = cleaned.findIndex(
        (c) => c.toLowerCase() === aLower || c.toLowerCase().includes(aLower) || aLower.includes(c.toLowerCase())
      );
      if (matchIdx !== -1) correct = matchIdx;
    }
    return { options: cleaned, correctIdx: correct };
  }

  // Fallback: derive actual real choices from answer, explanation, or question
  let answerToUse = aStr && !isPlaceholder(aStr) ? aStr : "";
  if (!answerToUse && eStr) {
    const ansMatch = eStr.match(/(?:answer|result|correct|equals?)\s*(?:is|:|=)?\s*([₹$€]?\s*[\d.]+\s*[a-zA-Z%]*)/i);
    if (ansMatch) answerToUse = ansMatch[1].trim();
  }
  if (!answerToUse && qStr) {
    const numMatch = qStr.match(/([₹$€]?\s*[\d.]+\s*(?:km\/h|m\/s|days?|hours?|years?|litres?|meters?|%))/i);
    if (numMatch) answerToUse = numMatch[1].trim();
  }

  if (answerToUse) {
    const generated = generateDistractors(answerToUse);
    return { options: generated, correctIdx: 0 };
  }

  // Context-aware choices (NEVER literal "Option A")
  const combined = (qStr + " " + eStr).toLowerCase();
  if (combined.includes("complexity") || combined.includes("o(")) {
    return { options: ["O(1) Constant", "O(log N) Logarithmic", "O(N) Linear", "O(N log N) Linearithmic"], correctIdx: 2 };
  }
  if (combined.includes("grammar") || combined.includes("error") || combined.includes("spelling")) {
    return { options: ["Grammatically correct", "Subject-verb disagreement", "Prepositional error", "Modifier error"], correctIdx: 1 };
  }
  if (combined.includes("statement") || combined.includes("assumption") || combined.includes("conclusion")) {
    return { options: ["Only statement I is sufficient", "Only statement II is sufficient", "Both statements are sufficient", "Neither statement is sufficient"], correctIdx: 0 };
  }

  return { options: ["Valid as Stated", "Conditions Insufficient", "Calculated Value Exceeded", "Cannot be determined"], correctIdx: 0 };
}

function tryRepairAndExtractQuestions(content: string): ExamQuestion[] {
  const clean = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  // Robust regex that handles escaped quotes and multiline characters
  const qMatch =
    clean.match(/"(?:question|title|statement|problem)":\s*"((?:\\.|[^"\\])*)"/i) ||
    clean.match(/(?:question|statement|problem):\s*"((?:\\.|[^"\\])*)"/i) ||
    clean.match(/"(?:question|statement|problem)":\s*'([^']+)'/i);

  let question = "";
  if (qMatch) {
    question = qMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n").trim();
  }

  // If question is still empty, grab meaningful text lines
  if (!question) {
    const textLines = clean
      .split("\n")
      .map((l) => l.trim())
      .filter(
        (l) =>
          l &&
          !l.startsWith("{") &&
          !l.startsWith("}") &&
          !l.startsWith("[") &&
          !l.startsWith("]") &&
          !l.includes('"id":') &&
          !l.includes('"topic":')
      );
    if (textLines.length > 0) {
      question = textLines[0].replace(/^["']|["'],?$/g, "").replace(/^question:\s*/i, "").trim();
    }
  }

  if (!question) {
    question = "Solve the problem statement provided and select your option below.";
  }

  const topicMatch = clean.match(/"topic":\s*"((?:\\.|[^"\\])*)"/);
  const topic = topicMatch ? topicMatch[1].replace(/\\"/g, '"') : "Aptitude & Reasoning";

  const sectionMatch = clean.match(/"section":\s*"((?:\\.|[^"\\])*)"/);
  const section = sectionMatch ? sectionMatch[1].replace(/\\"/g, '"') : "Logical Reasoning";

  const difficultyMatch = clean.match(/"difficulty":\s*"((?:\\.|[^"\\])*)"/);
  const difficulty = difficultyMatch ? difficultyMatch[1].replace(/\\"/g, '"') : "Medium";

  const marks = "+3 / -0.75";
  const rawCorrectOption = parseInt(clean.match(/"correctOption":\s*(\d+)/)?.[1] || "0", 10);
  const hintMatch = clean.match(/"hint":\s*"((?:\\.|[^"\\])*)"/);
  const hint = hintMatch ? hintMatch[1].replace(/\\"/g, '"') : "Analyze the given conditions step-by-step.";

  const expMatch = clean.match(/"explanation":\s*"((?:\\.|[^"\\])*)"/);
  const explanation = expMatch ? expMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n") : "Step-by-step derivation.";

  // Extract options array
  let rawOpts: string[] = [];
  const optionsBlockMatch = clean.match(/"options":\s*\[([\s\S]*?)\]/);
  if (optionsBlockMatch) {
    const rawInner = optionsBlockMatch[1];
    rawOpts = [...rawInner.matchAll(/"((?:\\.|[^"\\])*)"/g)].map((m) => m[1].replace(/\\"/g, '"').trim());
    if (rawOpts.length === 0) {
      rawOpts = [...rawInner.matchAll(/'([^']+)'/g)].map((m) => m[1].trim());
    }
  }

  const sanitized = cleanAndSanitizeOptions(rawOpts, question, "", explanation);
  const correctOption =
    !isNaN(rawCorrectOption) && rawCorrectOption < sanitized.options.length ? rawCorrectOption : sanitized.correctIdx;

  return [
    {
      id: "repaired_1",
      topic,
      section,
      difficulty,
      marks,
      question,
      options: sanitized.options,
      correctOption,
      answer: sanitized.options[correctOption] || sanitized.options[0],
      hint,
      explanation,
    },
  ];
}

export function parseExamQuestions(rawText: string): {
  introText: string;
  questions: ExamQuestion[];
} {
  if (!rawText) return { introText: "", questions: [] };

  // 1. Check for [EXAM_QUESTIONS] tag (handles complete, unclosed, or truncated tags)
  const jsonTagIndex = rawText.indexOf("[EXAM_QUESTIONS]");
  if (jsonTagIndex !== -1) {
    const rawAfterTag = rawText.slice(jsonTagIndex + "[EXAM_QUESTIONS]".length);
    const closeTagIndex = rawAfterTag.indexOf("[/EXAM_QUESTIONS]");
    let jsonContent = (closeTagIndex !== -1 ? rawAfterTag.slice(0, closeTagIndex) : rawAfterTag).trim();
    const intro = rawText.slice(0, jsonTagIndex).trim();

    // Clean code fences (```json or ```) and trailing commas
    jsonContent = jsonContent
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const sanitizedJson = jsonContent.replace(/,\s*([\]}])/g, "$1");

    try {
      const parsed = JSON.parse(sanitizedJson);
      const questionsList = Array.isArray(parsed) ? parsed : [parsed];

      const normalized: ExamQuestion[] = questionsList.map((q: any, idx: number) => {
        // Extract and normalize question
        let rawQuestion = normalizeToString(q.question || q.title || q.problem || q.text || "");

        // If statements are present at the root of q or inside q.statements, safely append
        if (q.statements) {
          const stmtsText = normalizeToString(q.statements);
          if (stmtsText && !rawQuestion.includes(stmtsText)) {
            rawQuestion = rawQuestion ? `${rawQuestion}\n\nStatements:\n${stmtsText}` : `Statements:\n${stmtsText}`;
          }
        }
        if (q.conclusions) {
          const concText = normalizeToString(q.conclusions);
          if (concText && !rawQuestion.includes(concText)) {
            rawQuestion = rawQuestion ? `${rawQuestion}\n\nConclusions:\n${concText}` : `Conclusions:\n${concText}`;
          }
        }
        if (q.premises) {
          const premText = normalizeToString(q.premises);
          if (premText && !rawQuestion.includes(premText)) {
            rawQuestion = rawQuestion ? `${rawQuestion}\n\nPremises:\n${premText}` : `Premises:\n${premText}`;
          }
        }
        if (!rawQuestion) {
          rawQuestion = `Question ${idx + 1}`;
        }

        const rawTopic = normalizeToString(q.topic || q.title || "Aptitude & Problem Solving");
        const rawSection = normalizeToString(q.section || "Amazon Online Assessment");
        const rawDifficulty = normalizeToString(q.difficulty || "Medium");
        const rawAnswer = normalizeToString(q.answer || "");
        const rawExplanation = normalizeToString(q.explanation || q.targetOptimization || "Refer to the formula derivation.");
        const rawHint = normalizeToString(q.hint || "Analyze the relationship between the given quantities step-by-step.");

        const sanitized = cleanAndSanitizeOptions(
          Array.isArray(q.options) ? q.options : [],
          rawQuestion,
          rawAnswer,
          rawExplanation
        );

        let correctIdx = typeof q.correctOption === "number" ? q.correctOption : sanitized.correctIdx;
        if (correctIdx < 0 || correctIdx >= sanitized.options.length) {
          correctIdx = 0;
        }

        return {
          id: q.id || `q_${idx + 1}`,
          topic: rawTopic,
          section: rawSection,
          difficulty: rawDifficulty,
          marks: q.marks || "+3 / -0.75",
          question: rawQuestion,
          options: sanitized.options,
          correctOption: correctIdx,
          answer: rawAnswer || sanitized.options[correctIdx],
          hint: rawHint,
          explanation: rawExplanation,
          solutionCode: q.solutionCode ? normalizeToString(q.solutionCode) : undefined,
        };
      });

      if (normalized.length > 0) {
        return { introText: intro, questions: normalized };
      }
    } catch (e) {
      // Robust recovery from truncated/incomplete JSON
      const repaired = tryRepairAndExtractQuestions(jsonContent);
      if (repaired.length > 0) {
        return { introText: intro, questions: repaired };
      }
    }
  }

  // 2. Intelligent Regex Parsing for Numbered Markdown format
  const numberedPattern = /(?:\*\*(\d+)\.\s*([^*]+)\*\*|(?:\n|^)\s*(\d+)\.\s+([A-Za-z\s&–-]+?)(?:\:|\n|\s{2,}))([\s\S]*?)(?=(?:\*\*\d+\.|\n\s*\d+\.|$))/g;
  const matches = [...rawText.matchAll(numberedPattern)];

  if (matches.length > 0) {
    const questions: ExamQuestion[] = [];
    let intro = rawText.split(/\*\*\d+\.|\n\s*\d+\./)[0].trim();

    matches.forEach((m, idx) => {
      const qNum = m[1] || m[3] || `${idx + 1}`;
      const title = normalizeToString((m[2] || m[4] || `Question ${qNum}`).replace(/:$/, "").trim());
      const body = normalizeToString(m[5] || "");

      // Extract Answer
      let answer = "";
      let questionText = body;
      const ansMatch = body.match(/\*Answer:\*?\s*([^\n*]+)/i) || body.match(/Answer:\s*([^\n]+)/i);

      if (ansMatch) {
        answer = ansMatch[1].trim().replace(/\.$/, "");
        questionText = body.replace(ansMatch[0], "").trim();
      }

      // Check if explicit options like A) ... B) ... exist
      const optionMatches = [...questionText.matchAll(/(?:[A-D]\)|\([A-D]\))\s*([^A-D\n)]+)/g)];
      const rawExtracted = optionMatches.length >= 2 ? optionMatches.map((om) => om[1].trim()) : [];
      const sanitized = cleanAndSanitizeOptions(rawExtracted, questionText, answer, "");

      questions.push({
        id: `parsed_${idx + 1}`,
        topic: title,
        section: "Quantitative Aptitude",
        difficulty: idx === 0 ? "Easy" : idx === 1 ? "Medium" : "Hard",
        marks: "+3 / -0.75",
        question: questionText.replace(/^[\s:–-]+/, "").trim(),
        options: sanitized.options,
        correctOption: sanitized.correctIdx,
        answer: answer || sanitized.options[sanitized.correctIdx],
        hint: `Focus on the mathematical core of "${title}". Set up a simple equation with the given values.`,
        explanation: answer
          ? `The calculated answer is ${answer}. Verify using the underlying ratio or percentage formula.`
          : "Step-by-step derivation for this problem.",
      });
    });

    if (questions.length > 0) {
      return { introText: intro, questions };
    }
  }

  return { introText: rawText, questions: [] };
}

export default function ExamArena({
  rawText,
  activeMode,
  onAnswerSubmitted,
  onVoiceTrigger,
}: ExamArenaProps) {
  const { introText, questions } = parseExamQuestions(rawText);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Per-question state: answers selected, submitted status, review flag
  const [userSelections, setUserSelections] = useState<{ [qId: string]: number }>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<{ [qId: string]: boolean }>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<{ [qId: string]: boolean }>({});
  const [revealedHints, setRevealedHints] = useState<{ [qId: string]: boolean }>({});
  const [revealedSolutions, setRevealedSolutions] = useState<{ [qId: string]: boolean }>({});

  // Real-time CBT Exam Timer
  const [qSeconds, setQSeconds] = useState(0);

  useEffect(() => {
    setCurrentIdx(0);
    setUserSelections({});
    setSubmittedQuestions({});
    setFlaggedQuestions({});
    setRevealedHints({});
    setRevealedSolutions({});
    setQSeconds(0);
  }, [rawText]);

  useEffect(() => {
    const timer = setInterval(() => {
      setQSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [currentIdx]);

  // Audio feedback for answer submission
  const playAudioFeedback = (isCorrect: boolean) => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (isCorrect) {
        // Cheerful rising chime (523Hz -> 659Hz -> 784Hz)
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(784.0, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      } else {
        // Soft low double-buzz
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      }
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  if (!questions || questions.length === 0) {
    return null;
  }

  const currentQ = questions[currentIdx] || questions[0];
  const qId = String(currentQ.id);
  const selectedOption = userSelections[qId];
  const isSubmitted = !!submittedQuestions[qId];
  const isFlagged = !!flaggedQuestions[qId];
  const isCorrect = isSubmitted && selectedOption === currentQ.correctOption;
  const isHintOpen = !!revealedHints[qId];
  const isSolutionOpen = !!revealedSolutions[qId];

  // Calculate live exam score
  let totalScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  questions.forEach((q) => {
    const sel = userSelections[String(q.id)];
    const subm = submittedQuestions[String(q.id)];
    if (subm && sel !== undefined) {
      if (sel === q.correctOption) {
        totalScore += 3.0;
        correctCount++;
      } else {
        totalScore -= 0.75;
        wrongCount++;
      }
    }
  });

  const handleSelectOption = (idx: number) => {
    if (isSubmitted) return; // Prevent changing after submit
    setUserSelections((prev) => ({ ...prev, [qId]: idx }));
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === undefined) return;
    setSubmittedQuestions((prev) => ({ ...prev, [qId]: true }));
    const correct = selectedOption === currentQ.correctOption;
    playAudioFeedback(correct);
    if (onAnswerSubmitted) {
      onAnswerSubmitted(correct, currentQ.topic || `Question ${currentIdx + 1}`);
    }
  };

  const handleClearSelection = () => {
    if (isSubmitted) return;
    setUserSelections((prev) => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
  };

  const handleToggleFlag = () => {
    setFlaggedQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full flex flex-col gap-4 font-sans animate-fade-in select-none">
      {/* 1. Official CBT Exam Console Header Bar */}
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold shadow-inner">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/25">
                {currentQ.section || "Amazon Online Assessment"}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Topic: <strong className="text-slate-200">{currentQ.topic}</strong>
              </span>
            </div>
            <h2 className="text-sm font-semibold text-white tracking-wide mt-0.5 flex items-center gap-2">
              <span>CBT Exam Simulator</span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-normal">
                Question {currentIdx + 1} of {questions.length}
              </span>
            </h2>
          </div>
        </div>

        {/* Exam Score & Live Question Clock */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Live Score Pill */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400">Score:</span>
            <span
              className={`font-mono font-bold ${
                totalScore > 0
                  ? "text-emerald-400"
                  : totalScore < 0
                  ? "text-rose-400"
                  : "text-slate-300"
              }`}
            >
              {totalScore > 0 ? `+${totalScore.toFixed(2)}` : totalScore.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              ({correctCount}✔ {wrongCount}✘)
            </span>
          </div>

          {/* Question Elapsed Timer */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{formatTimer(qSeconds)}</span>
          </div>

          {/* Bookmark / Flag Question */}
          <button
            onClick={handleToggleFlag}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isFlagged
                ? "bg-purple-500/20 border-purple-500/60 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.35)]"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
            title={isFlagged ? "Marked for Review" : "Flag for Review"}
          >
            <Flag className={`w-4 h-4 ${isFlagged ? "fill-purple-400 text-purple-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Question Navigation Palette Tabs (if multiple questions) */}
      {questions.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 px-1">
          {questions.map((q, idx) => {
            const thisQId = String(q.id);
            const isCurr = idx === currentIdx;
            const isSub = !!submittedQuestions[thisQId];
            const isFlg = !!flaggedQuestions[thisQId];
            const isCorr = isSub && userSelections[thisQId] === q.correctOption;

            return (
              <button
                key={thisQId}
                onClick={() => {
                  setCurrentIdx(idx);
                  setQSeconds(0);
                }}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer shrink-0 ${
                  isCurr
                    ? "bg-emerald-500/20 border-emerald-400/80 text-emerald-300 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400/40"
                    : isSub
                    ? isCorr
                      ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-400"
                      : "bg-rose-950/40 border-rose-800/60 text-rose-400"
                    : isFlg
                    ? "bg-purple-950/40 border-purple-800/60 text-purple-300"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <span>Q{idx + 1}</span>
                {isFlg && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                {isSub && (
                  <span>
                    {isCorr ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] text-rose-400">✕</span>
                    )}
                  </span>
                )}
                <span className="text-[11px] opacity-75 max-w-[120px] truncate hidden md:inline">
                  {q.topic}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. The Core Question Paper Arena */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-5 md:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col gap-5 relative overflow-hidden">
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

        {/* Question Header Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs px-3 py-1 rounded-lg tracking-wider shadow-sm">
              QUESTION {currentIdx + 1}
            </span>
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                currentQ.difficulty?.toLowerCase().includes("easy")
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : currentQ.difficulty?.toLowerCase().includes("hard")
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
              }`}
            >
              {currentQ.difficulty || "Medium"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="text-emerald-400 font-bold">+3.00</span>
            <span className="text-slate-600">/</span>
            <span className="text-rose-400 font-bold">-0.75</span>
            <span className="text-slate-500 text-[11px] ml-1">Marks</span>
          </div>
        </div>

        {/* Problem Statement text with crystal clarity */}
        <div className="relative z-10">
          <p className="text-base md:text-lg text-slate-100 font-medium leading-relaxed tracking-wide whitespace-pre-line">
            {normalizeToString(currentQ.question)}
          </p>
        </div>

        {/* 4. Interactive Multiple Choice Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10 my-1">
          {currentQ.options.map((optText, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx); // A, B, C, D
            const isSelected = selectedOption === optIdx;
            const isCorrectOption = optIdx === currentQ.correctOption;
            const cleanOpt = normalizeToString(optText);

            let cardStyles =
              "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60";

            if (isSubmitted) {
              if (isCorrectOption) {
                cardStyles =
                  "bg-emerald-950/40 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]";
              } else if (isSelected && !isCorrectOption) {
                cardStyles =
                  "bg-rose-950/40 border-rose-500 text-rose-200 ring-2 ring-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.3)]";
              } else {
                cardStyles = "bg-slate-950/40 border-slate-800/50 text-slate-500 opacity-60";
              }
            } else if (isSelected) {
              cardStyles =
                "bg-emerald-500/15 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/50";
            }

            return (
              <button
                key={optIdx}
                onClick={() => handleSelectOption(optIdx)}
                disabled={isSubmitted}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all duration-200 cursor-pointer group ${cardStyles}`}
              >
                {/* Option Badge A, B, C, D */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                    isSubmitted
                      ? isCorrectOption
                        ? "bg-emerald-500 text-slate-950"
                        : isSelected
                        ? "bg-rose-500 text-white"
                        : "bg-slate-800 text-slate-400"
                      : isSelected
                      ? "bg-emerald-400 text-slate-950 font-black shadow-sm"
                      : "bg-slate-800 border border-slate-700 text-slate-400 group-hover:text-slate-200 group-hover:border-slate-600"
                  }`}
                >
                  {isSubmitted && isCorrectOption ? (
                    <Check className="w-4 h-4" />
                  ) : isSubmitted && isSelected && !isCorrectOption ? (
                    <span className="text-xs">✕</span>
                  ) : (
                    letter
                  )}
                </div>

                {/* Option Text */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <span className="text-sm md:text-[15px] font-medium leading-snug break-words">
                    {cleanOpt.replace(/^(?:Option\s+[A-D]|[\([A-D]\)])\s*[:\.\-–]?\s*/i, "").trim() || cleanOpt}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 5. Live Grading / Submission Feedback Banner */}
        {isSubmitted && (
          <div
            className={`p-4 rounded-2xl border relative z-10 flex items-start gap-3 animate-fade-in ${
              isCorrect
                ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.18)]"
                : "bg-rose-950/50 border-rose-500/50 text-rose-200 shadow-[0_0_30px_rgba(244,63,94,0.18)]"
            }`}
          >
            {isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm tracking-wide">
                  {isCorrect ? "Correct! +3.00 Marks Awarded" : "Incorrect (-0.75 Negative Marks)"}
                </h4>
              </div>
              <p className="text-xs mt-1 text-slate-300 leading-relaxed">
                {isCorrect
                  ? "Excellent calculation! You solved this question correctly according to Amazon assessment standards."
                  : `The correct option was (${String.fromCharCode(
                      65 + (currentQ.correctOption ?? 0)
                    )}) ${normalizeToString(currentQ.answer || currentQ.options[currentQ.correctOption ?? 0])}. See the detailed derivation below.`}
              </p>
            </div>
          </div>
        )}

        {/* 6. Expandable Learning Drawers (Hint & Detailed Solution) */}
        <div className="flex flex-col gap-2 relative z-10 pt-2 border-t border-slate-800/70">
          {/* Hint Accordion */}
          {currentQ.hint && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden transition-all">
              <button
                onClick={() =>
                  setRevealedHints((prev) => ({ ...prev, [qId]: !prev[qId] }))
                }
                className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-amber-300/90 hover:text-amber-300 hover:bg-slate-800/40 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>Exam Hint & Formula Clue</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {isHintOpen ? "Hide ▴" : "Show ▾"}
                </span>
              </button>
              {isHintOpen && (
                <div className="px-4 py-3 border-t border-slate-800/80 bg-amber-500/5 text-xs text-amber-200/90 leading-relaxed font-normal whitespace-pre-line">
                  {normalizeToString(currentQ.hint)}
                </div>
              )}
            </div>
          )}

          {/* Detailed Solution & Derivation (Kept hidden so answer isn't spoiled before trying) */}
          {(currentQ.explanation || currentQ.answer) && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden transition-all">
              <button
                onClick={() =>
                  setRevealedSolutions((prev) => ({ ...prev, [qId]: !prev[qId] }))
                }
                className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-emerald-300/90 hover:text-emerald-300 hover:bg-slate-800/40 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isSolutionOpen ? "Hide Step-by-Step Derivation" : "View Step-by-Step Solution"}
                  </span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {isSolutionOpen ? "Hide ▴" : "Reveal ▾"}
                </span>
              </button>
              {isSolutionOpen && (
                <div className="px-4 py-3.5 border-t border-slate-800/80 bg-slate-900/60 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-mono">
                  {normalizeToString(currentQ.explanation || `Answer: ${currentQ.answer}`)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 7. Bottom Exam Action Console Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80 relative z-10">
          <div className="flex items-center gap-2">
            {!isSubmitted && selectedOption !== undefined && (
              <button
                onClick={handleClearSelection}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
              >
                Clear Selection
              </button>
            )}

            {/* Alexa Voice Trigger */}
            {onVoiceTrigger && (
              <button
                onClick={onVoiceTrigger}
                className="px-3 py-1.5 rounded-xl text-xs text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Speak your answer aloud"
              >
                <span>🎙️ Speak Answer</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            {/* Previous Question */}
            {currentIdx > 0 && (
              <button
                onClick={() => {
                  setCurrentIdx((prev) => prev - 1);
                  setQSeconds(0);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
            )}

            {/* Submit Answer Button */}
            {!isSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedOption === undefined}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                  selectedOption !== undefined
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                    : "bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed"
                }`}
              >
                <span>Submit & Check</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            ) : currentIdx < questions.length - 1 ? (
              <button
                onClick={() => {
                  setCurrentIdx((prev) => prev + 1);
                  setQSeconds(0);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                <span>Assessment Completed!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

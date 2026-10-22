"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Mic, MicOff, Volume2, Send, Code2, BookOpen, Compass, Flame, Target, CheckCircle2, ChevronDown, Check } from 'lucide-react';
import ExamArena, { parseExamQuestions, normalizeToString } from './ExamArena';
import LeetCodeArena from './LeetCodeArena';

export default function AlexaPlusShow() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [inputText, setInputText] = useState("");
  const [assistantResponse, setAssistantResponse] = useState("Say 'Alexa, give me a daily problem' to start.");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [iframeUrl, setIframeUrl] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [activeMode, setActiveMode] = useState<string>("tech_coach");

  const getBackendUrl = () => (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001').replace(/\/+$/, '');

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>("");
  const isListeningRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isSendingRef = useRef<boolean>(false); // Prevent duplicate concurrent requests
  const speechKeepAliveRef = useRef<any>(null); // Chrome SpeechSynthesis keepAlive timer
  const [isFocusMenuOpen, setIsFocusMenuOpen] = useState(false);
  const focusMenuRef = useRef<HTMLDivElement>(null);

  // Segmented Mode Slider animation state (Silky Smooth GPU Sliding)
  const [sliderStyle, setSliderStyle] = useState({ left: 4, width: 0, opacity: 0 });
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const updateSlider = (mode: string) => {
    const activeBtn = tabRefs.current[mode];
    if (activeBtn) {
      setSliderStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        opacity: 1,
      });
    }
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      updateSlider(activeMode);
    });
    const handleResize = () => updateSlider(activeMode);
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, [activeMode]);

  const focusOptions = [
    "Time Complexity : O(1)",
    "Time Complexity : O(n)",
    "Time Complexity : O(n²)",
    "Space Complexity : O(1)",
    "Recursion & Stack"
  ];

  // Question Timer state for Study Coach (Quant) mode
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (activeMode === "study_coach" && isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeMode, isTimerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResetTimer = () => {
    setTimerSeconds(0);
    setIsTimerRunning(false);
  };

  const handleSelectFocus = async (focusOption: string) => {
    setIsFocusMenuOpen(false);
    if (profile) {
      const existing = profile.weakTopics || [];
      const updatedTopics = [focusOption, ...existing.filter((t: string) => t !== focusOption)];
      setProfile({ ...profile, weakTopics: updatedTopics });
    }
    try {
      const backendUrl = getBackendUrl();
      await fetch(`${backendUrl}/api/profile/focus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: "user123", focus: focusOption })
      });
    } catch (e) {
      console.warn("Failed to update focus on backend", e);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (focusMenuRef.current && !focusMenuRef.current.contains(e.target as Node)) {
        setIsFocusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }));
    };
    updateTime();
    const clockTimer = setInterval(updateTime, 1000);

    // Real-time synchronization of candidate profile & metrics from persistent memory
    const backendUrl = getBackendUrl();

    const syncProfile = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/profile?userId=user123`);
        const data = await res.json();
        if (data && data.profile) {
          setProfile((prev: any) => {
            if (!prev) return data.profile;
            if (
              prev.streakDays !== data.profile.streakDays ||
              prev.problemsSolved !== data.profile.problemsSolved ||
              JSON.stringify(prev.weakTopics) !== JSON.stringify(data.profile.weakTopics) ||
              prev.currentMode !== data.profile.currentMode
            ) {
              return data.profile;
            }
            return prev;
          });
        }
      } catch (err) { }
    };

    syncProfile();
    // Poll profile every 10s instead of 2s — prevents unnecessary load on 500+ question sessions
    const syncTimer = setInterval(syncProfile, 10000);

    // Unhide Next.js dev indicator if user previously hid it
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('__next_dev_tools_hidden');
        localStorage.removeItem('__next_dev_indicator');
        sessionStorage.removeItem('__next_dev_tools_hidden');
      } catch (e) { }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        try {
          window.speechSynthesis.getVoices();
        } catch (e) { }
      };
    }

    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN'; // Indian English accent recognition

      recognitionRef.current.onresult = (event: any) => {
        let fullText = "";
        let isFinalChunk = false;
        for (let i = 0; i < event.results.length; ++i) {
          fullText += event.results[i][0].transcript + " ";
          if (event.results[i].isFinal) isFinalChunk = true;
        }
        fullText = fullText.trim();
        setTranscript(fullText);
        latestTranscriptRef.current = fullText;

        // Ultra-fast responsive pause detection:
        // When speech is finalized: 600ms pause triggers instant send!
        // When interim speech: 850ms pause triggers send.
        const pauseDelay = isFinalChunk ? 600 : 850;

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (latestTranscriptRef.current && isListeningRef.current) {
            const promptToSend = latestTranscriptRef.current;
            latestTranscriptRef.current = "";
            recognitionRef.current?.stop();
            setIsListening(false);
            isListeningRef.current = false;
            handleSendPrompt(promptToSend);
          }
        }, pauseDelay);
      };

      // AUTO-RECOVERY: If recognition dies unexpectedly while user is still listening,
      // restart it automatically. This prevents the "frozen mic" bug after many uses.
      recognitionRef.current.onend = () => {
        if (isListeningRef.current) {
          // Unexpected death while user thinks mic is on — restart silently
          try {
            setTimeout(() => {
              if (isListeningRef.current && recognitionRef.current) {
                recognitionRef.current.start();
              }
            }, 200);
          } catch (e) {
            setIsListening(false);
            isListeningRef.current = false;
          }
        } else {
          setIsListening(false);
          isListeningRef.current = false;
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        // 'no-speech' and 'aborted' are normal lifecycle events — don't kill listening
        if (event?.error === 'no-speech' || event?.error === 'aborted') {
          return; // The onend handler will auto-restart if needed
        }
        // For real errors (network, not-allowed), stop cleanly
        setIsListening(false);
        isListeningRef.current = false;
      };
    }

    // CHROME SPEECHSYNTHESIS FREEZE FIX:
    // Chrome pauses SpeechSynthesis after ~15 seconds of inactivity.
    // This keepAlive timer nudges the engine every 5 seconds to prevent freezing.
    speechKeepAliveRef.current = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 5000);

    return () => {
      clearInterval(clockTimer);
      clearInterval(syncTimer);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (speechKeepAliveRef.current) clearInterval(speechKeepAliveRef.current);
    };
  }, []);

  const switchMode = (mode: string) => {
    setActiveMode(mode);
    updateSlider(mode);
    if (mode === "study_coach") {
      setTimerSeconds(0);
      setIsTimerRunning(false);
    }
    if (mode === "general_assistant") {
      setAssistantResponse("Switched to General Assistant mode! Ask me anything, and I'll give you quick, ChatGPT-style concise answers.");
    }
    const backendUrl = getBackendUrl();
    fetch(`${backendUrl}/api/profile/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: "user123", mode })
    })
      .then(res => res.json())
      .then(data => {
        if (data.profile) setProfile(data.profile);
      })
      .catch(() => { });
  };

  const playListeningChime = () => {
    try {
      // Initialize AudioContext on first user interaction
      if (!audioContextRef.current) {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }
      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      // Start at 440Hz and rise to 660Hz over 0.2s
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.warn('Listening chime failed', e);
    }
  };

  const stopAlexaSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) { }
    }
  };

  const toggleListen = () => {
    // 🛑 Barge-in: Stop Alexa voice immediately when user taps mic so they can speak freely
    stopAlexaSpeech();

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    if (isListening) {
      // User tapped mic to finish speaking early: send accumulated speech immediately!
      recognitionRef.current?.stop();
      setIsListening(false);
      isListeningRef.current = false;
      if (latestTranscriptRef.current.trim()) {
        const promptToSend = latestTranscriptRef.current;
        latestTranscriptRef.current = "";
        handleSendPrompt(promptToSend);
      }
    } else {
      // Start listening fresh
      // Play subtle Alexa-like listening chime before starting speech recognition
      playListeningChime();
      latestTranscriptRef.current = "";
      setTranscript("");
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = 'en-IN';
        }
        recognitionRef.current?.start();
        setIsListening(true);
        isListeningRef.current = true;
      } catch (e) { }
    }
  };

  const utteranceRef = useRef<any>(null);

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    // 1. Clean exam tags, JSON, and spoilers
    let preprocessed = text
      .replace(/\[EXAM_QUESTIONS\][\s\S]*?\[\/EXAM_QUESTIONS\]/gi, "")
      .replace(/\*?Answer:\*?[^\n.]+/gi, "")
      .replace(/\[VIEW:DASHBOARD\]/g, "");

    const isHindiText = /[\u0900-\u097F]/.test(preprocessed);
    const codeAnnouncement = isHindiText ? " मैंने कोड स्क्रीन पर दिखा दिया है। " : " I have displayed the code on the screen. ";
    let cleanText = preprocessed
      .replace(/```[\s\S]*?```/g, codeAnnouncement)
      .replace(/\|[^\n]+\|/g, "") // remove table rows
      .replace(/[*_#`~>\[\]\(\)]/g, " ")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) {
      cleanText = isHindiText
        ? "मैंने परीक्षा के प्रश्न स्क्रीन पर दिखा दिए हैं। कृपया हल करें।"
        : "I have displayed the assessment questions on your screen. Take your time to solve!";
    }

    // 2. Real Alexa rule: Speak the first 2-3 sentences crisp and clearly
    const sentences = cleanText.split(/(?<=[.!?।])\s+/);
    const alexaSpoken = sentences.slice(0, 3).join(" ").trim() || cleanText;

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch (e) { }

    const utterance = new SpeechSynthesisUtterance(alexaSpoken);
    utteranceRef.current = utterance; // Prevent garbage collection bug in Chrome

    // Language voice selection based on isHindiText detected above
    // Setup pitch, rate, volume
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // 3. Female Voice Selection (Real Alexa = Female)
    const voices = window.speechSynthesis.getVoices() || [];
    let selectedVoice: SpeechSynthesisVoice | null = null;

    // Known male voice names to always exclude
    const maleNames = ['prabhat', 'ravi', 'male', 'david', 'mark', 'james', 'richard', 'george', 'daniel'];
    const isFemale = (v: SpeechSynthesisVoice) =>
      !maleNames.some(m => v.name.toLowerCase().includes(m));

    if (isHindiText) {
      utterance.lang = 'hi-IN';
      // Prefer known Hindi female voices
      selectedVoice = voices.find(v =>
        (v.lang === 'hi-IN' || v.lang.toLowerCase().startsWith('hi')) &&
        isFemale(v) &&
        (v.name.includes('Swara') || v.name.includes('Natural') || v.name.toLowerCase().includes('female'))
      ) || voices.find(v =>
        (v.lang === 'hi-IN' || v.lang.toLowerCase().startsWith('hi')) && isFemale(v)
      ) || null;
    }

    if (!selectedVoice) {
      utterance.lang = 'en-IN';
      // Tier 1: Best known Indian English female voices (Microsoft/Google)
      selectedVoice = voices.find(v =>
        (v.lang === 'en-IN' || v.lang === 'en_IN' || v.lang.toLowerCase().startsWith('en-in')) &&
        (v.name.includes('Neerja') || v.name.includes('Swara'))
      )
        // Tier 2: Any en-IN female voice
        || voices.find(v =>
          (v.lang === 'en-IN' || v.lang === 'en_IN' || v.lang.toLowerCase().startsWith('en-in')) &&
          isFemale(v)
        )
        // Tier 3: Any English female voice (en-US, en-GB, etc.)
        || voices.find(v =>
          v.lang.startsWith('en') &&
          isFemale(v) &&
          (v.name.includes('Zira') || v.name.includes('Jenny') || v.name.includes('Samantha') ||
            v.name.includes('Google') || v.name.toLowerCase().includes('female'))
        )
        // Tier 4: Any English female voice at all
        || voices.find(v => v.lang.startsWith('en') && isFemale(v))
        || null;
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    // Slightly higher pitch for natural feminine Alexa tone
    utterance.pitch = 1.05;

    utterance.onerror = (e: any) => {
      // Ignore normal lifecycle events like 'canceled' or 'interrupted' when speech is stopped
      if (!e || e.error === 'canceled' || e.error === 'interrupted' || !e.error) {
        return;
      }
      console.warn("SpeechSynthesis non-critical notice:", e.error);
    };

    // STABILITY: onend callback to clean up utterance ref
    utterance.onend = () => {
      utteranceRef.current = null;
    };

    // Give browser a short delay so cancel() completes before speaking
    setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.resume();
          window.speechSynthesis.speak(utterance);
        }
      } catch (err) {
        console.warn("Speech speak warning:", err);
      }
    }, 100);
  };

  const handleSendPrompt = async (text: string) => {
    // GUARD: Prevent duplicate concurrent requests (causes freeze on rapid fire)
    if (isSendingRef.current) {
      console.warn('[Alexa+] Blocked duplicate request — previous request still pending.');
      return;
    }
    isSendingRef.current = true;

    setAssistantResponse("Thinking...");
    setCodeSnippet("");
    const backendUrl = getBackendUrl();
    const mcpUrl = process.env.NEXT_PUBLIC_MCP_URL || 'http://localhost:3002';

    // TIMEOUT: AbortController with 30-second timeout prevents hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt: text, userId: "user123", mode: activeMode }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();

      if (data.profile) {
        setProfile(data.profile);
        if (data.profile.currentMode) setActiveMode(data.profile.currentMode);
      }

      const codeMatch = data.response.match(/```(?:java|python|javascript)?\n([\s\S]*?)```/);
      if (codeMatch) {
        setCodeSnippet(codeMatch[1]);
        setIframeUrl("");
      }

      if (data.response.includes("[VIEW:DASHBOARD]")) {
        setIframeUrl(`${mcpUrl}/ui/index.html`);
        setCodeSnippet("");
      } else if (!codeMatch) {
        setIframeUrl("");
      }

      const cleanResponse = data.response.replace(/```[\s\S]*?```/g, "").replace("[VIEW:DASHBOARD]", "").trim();
      setAssistantResponse(cleanResponse);
      speakText(cleanResponse);

    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError') {
        setAssistantResponse('The request timed out. Please try again — the AI server might be under heavy load.');
      } else {
        setAssistantResponse(`Connection error. Please ensure the backend is accessible at ${backendUrl}.`);
      }
    } finally {
      isSendingRef.current = false;
    }
  };

  const handleExamAnswer = async (isCorrect: boolean, topic: string) => {
    if (isCorrect) {
      try {
        const backendUrl = getBackendUrl();
        const res = await fetch(`${backendUrl}/api/profile/solve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: "user123", topic })
        });
        const data = await res.json();
        if (data && data.profile) {
          setProfile(data.profile);
        }
      } catch (e) {
        console.warn("Failed to update solve count on backend", e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-0 md:p-6 lg:p-8 font-sans selection:bg-emerald-500/30">
      <div className="bg-black/95 w-full max-w-4xl h-screen md:h-[720px] md:max-h-[92vh] rounded-none md:rounded-[2.5rem] border-0 md:border-8 border-gray-800 shadow-[0_0_60px_rgba(16,185,129,0.12)] relative overflow-hidden flex flex-col">

        {/* Top Header */}
        <div className="w-full px-3.5 sm:px-7 py-2.5 sm:py-3.5 flex justify-between items-center bg-slate-900/80 border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3.5">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-black shadow-[0_0_20px_rgba(16,185,129,0.35)]">
              <img
                src="/power-logo.png"
                alt="Alexa+ Logo"
                className="w-full h-full object-contain p-0.5 sm:p-1 select-none"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white flex items-center gap-1.5 sm:gap-2.5 leading-none">
                <span>Alexa<span className="text-emerald-400 font-black ml-0.5">+</span></span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-300 tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  {activeMode === "tech_coach" ? "DSA" : activeMode === "study_coach" ? "Quant" : "Assistant"}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Candidate Quick Stats Capsule (Real Native Emojis) */}
            {profile && (
              <div className="flex items-center gap-1.5 sm:gap-3 bg-slate-950/60 border border-slate-800/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs shadow-inner">
                <span className="flex items-center gap-1 text-amber-400 font-semibold" title="Active Study Streak">
                  <span className="text-xs sm:text-sm select-none">🔥</span>
                  <span>{profile.streakDays}d<span className="hidden sm:inline"> streak</span></span>
                </span>
                <span className="w-px h-3 bg-slate-800" />
                <span className="flex items-center gap-1 text-emerald-400 font-semibold" title="Problems Solved">
                  <span className="text-xs sm:text-sm select-none">✅</span>
                  <span>{profile.problemsSolved}<span className="hidden sm:inline"> solved</span></span>
                </span>
              </div>
            )}

            {/* Live Clock with Indicator */}
            <div className="text-[11px] sm:text-xs text-slate-300 font-medium bg-slate-950/60 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-slate-800/80 flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="tabular-nums">{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Sub-Header: Segmented Mode Switcher */}
        <div className="w-full px-3.5 sm:px-7 py-2 sm:py-2.5 bg-slate-950/40 border-b border-slate-800/50 flex items-center justify-center shrink-0">
          {/* Official Segmented Control Track with Silky-Smooth GPU Sliding Pill */}
          <div className="relative inline-flex p-1 bg-slate-900/95 rounded-xl border border-slate-800 shadow-inner overflow-hidden justify-between sm:justify-start w-full sm:w-auto">
            {/* Physical Sliding Pill Indicator */}
            <div
              className="absolute top-1 bottom-1 rounded-lg bg-slate-800 border border-emerald-500/35 shadow-[0_2px_12px_rgba(16,185,129,0.18)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none will-change-transform"
              style={{
                transform: `translateX(${sliderStyle.left - 4}px)`,
                left: "4px",
                width: `${sliderStyle.width}px`,
                opacity: sliderStyle.opacity,
              }}
            />

            <button
              ref={(el) => { tabRefs.current["tech_coach"] = el; }}
              onClick={() => switchMode("tech_coach")}
              className={`relative z-10 flex-1 sm:flex-none justify-center px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 sm:gap-1.5 transition-colors duration-200 cursor-pointer select-none ${activeMode === "tech_coach"
                ? "text-emerald-300 font-semibold"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              <Code2 className={`w-3.5 h-3.5 transition-colors duration-200 shrink-0 ${activeMode === "tech_coach" ? "text-emerald-400" : "text-slate-400"}`} />
              <span className="hidden sm:inline">Tech Coach (DSA)</span>
              <span className="sm:hidden text-[11px]">DSA Coach</span>
            </button>

            <button
              ref={(el) => { tabRefs.current["study_coach"] = el; }}
              onClick={() => switchMode("study_coach")}
              className={`relative z-10 flex-1 sm:flex-none justify-center px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 sm:gap-1.5 transition-colors duration-200 cursor-pointer select-none ${activeMode === "study_coach"
                ? "text-emerald-300 font-semibold"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              <BookOpen className={`w-3.5 h-3.5 transition-colors duration-200 shrink-0 ${activeMode === "study_coach" ? "text-emerald-400" : "text-slate-400"}`} />
              <span className="hidden sm:inline">Study Coach (Quant)</span>
              <span className="sm:hidden text-[11px]">Quant Coach</span>
            </button>

            <button
              ref={(el) => { tabRefs.current["general_assistant"] = el; }}
              onClick={() => switchMode("general_assistant")}
              className={`relative z-10 flex-1 sm:flex-none justify-center px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 sm:gap-1.5 transition-colors duration-200 cursor-pointer select-none ${activeMode === "general_assistant"
                ? "text-emerald-300 font-semibold"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              <Compass className={`w-3.5 h-3.5 transition-colors duration-200 shrink-0 ${activeMode === "general_assistant" ? "text-emerald-400" : "text-slate-400"}`} />
              <span className="hidden sm:inline">General Assistant</span>
              <span className="sm:hidden text-[11px]">Assistant</span>
            </button>
          </div>
        </div>

        {/* Content Area with smooth native scroll */}
        <div className="flex-1 min-h-0 px-3.5 sm:px-8 py-3.5 sm:py-5 flex flex-col gap-3.5 sm:gap-5 overflow-y-auto overscroll-contain">
          {(() => {
            const isDsaMode = activeMode === "tech_coach";
            const isDsaProblem = isDsaMode && (
              Boolean(codeSnippet) ||
              assistantResponse.includes("```") ||
              assistantResponse.includes("dsa_") ||
              assistantResponse.includes("Solution") ||
              assistantResponse.toLowerCase().includes("two sum") ||
              assistantResponse.toLowerCase().includes("rotate array") ||
              assistantResponse.toLowerCase().includes("parenthes") ||
              assistantResponse.toLowerCase().includes("problem") ||
              assistantResponse.toLowerCase().includes("nums") ||
              assistantResponse.toLowerCase().includes("complexity")
            );

            if (isDsaProblem) {
              return (
                <LeetCodeArena
                  rawResponse={assistantResponse}
                  codeSnippet={codeSnippet}
                  onSolveSuccess={(t) => handleExamAnswer(true, t)}
                  onVoiceTrigger={toggleListen}
                  profile={profile}
                />
              );
            }

            const examData = parseExamQuestions(assistantResponse);
            if (activeMode !== "general_assistant" && examData.questions.length > 0) {
              return (
                <div className="flex flex-col gap-4">
                  {examData.introText && (
                    <div className="bg-slate-900/90 px-5 py-3 rounded-2xl backdrop-blur-md border border-slate-700/80 flex items-center justify-between gap-3 shadow-md shrink-0">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <p className="text-sm md:text-base text-slate-200 font-medium">
                          {normalizeToString(examData.introText)}
                        </p>
                      </div>
                      <button
                        onClick={() => speakText(examData.introText || assistantResponse)}
                        title="Read Aloud"
                        className="p-2 rounded-full bg-slate-800 border border-slate-700 hover:bg-emerald-500 hover:border-emerald-400 transition-all text-slate-300 hover:text-white shadow-md cursor-pointer shrink-0"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <ExamArena
                    rawText={assistantResponse}
                    activeMode={activeMode}
                    onAnswerSubmitted={handleExamAnswer}
                    onVoiceTrigger={toggleListen}
                  />
                </div>
              );
            }

            return (
              /* Main Chat Card with clear colored glow and smooth drop-shadow */
              <div className="bg-slate-900/90 p-5 md:p-6 rounded-2xl backdrop-blur-md border border-slate-700/80 shadow-[0_10px_35px_rgba(0,0,0,0.6),0_0_25px_rgba(16,185,129,0.12)] relative group transition-all duration-300 hover:border-emerald-500/40 shrink-0">
                <p className="text-lg md:text-xl leading-relaxed text-slate-100 pr-12 font-medium whitespace-pre-line">
                  {assistantResponse.replace(/\[\/?EXAM_QUESTIONS\]/gi, "").trim()}
                </p>
                <button
                  onClick={() => speakText(assistantResponse)}
                  title="Read Aloud"
                  className="absolute top-5 right-5 p-2.5 rounded-full bg-slate-800 border border-slate-700 hover:bg-emerald-500 hover:border-emerald-400 transition-all text-slate-300 hover:text-white shadow-md cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            );
          })()}

          {!activeMode.includes("tech_coach") && codeSnippet && (
            <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-700/80 animate-fade-in shrink-0">
              <SyntaxHighlighter language="java" style={dracula} customStyle={{ margin: 0, padding: '1.25rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {codeSnippet}
              </SyntaxHighlighter>
            </div>
          )}

          {iframeUrl && (
            <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-700/80 h-[400px] animate-fade-in bg-slate-900 shrink-0">
              <iframe src={iframeUrl} className="w-full h-full border-none" title="MCP Dashboard"></iframe>
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-4 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-md flex flex-col items-center gap-1.5 sm:gap-2 shrink-0 z-20">
          {transcript && (
            <p className="text-emerald-400 text-xs sm:text-sm font-medium italic animate-pulse text-center">
              "{transcript}"
            </p>
          )}

          {/* Voice & Prominent Input Controls */}
          <div className="w-full max-w-2xl flex items-center gap-2 sm:gap-3.5">
            <button
              onClick={toggleListen}
              className={`relative p-2.5 sm:p-3.5 rounded-full transition-all duration-300 shrink-0 flex items-center justify-center
                        ${isListening
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white ring-4 ring-emerald-400/50 shadow-[0_0_25px_rgba(16,185,129,0.85)] scale-105'
                  : 'bg-slate-800/90 hover:bg-slate-700 border border-slate-600/60 text-slate-200 hover:text-white shadow-lg hover:shadow-slate-700/50 hover:border-slate-500'}`}
              title={isListening ? 'Listening... Tap to Stop' : 'Tap to Speak'}
            >
              {isListening && (
                <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/40 pointer-events-none"></span>
              )}
              <Mic className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${isListening ? 'scale-110' : ''}`} />
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                stopAlexaSpeech();
                if (inputText.trim()) {
                  setTranscript(inputText);
                  handleSendPrompt(inputText);
                  setInputText("");
                }
              }}
              className="flex-1 flex items-center bg-slate-800/95 border-2 border-slate-700/90 focus-within:border-emerald-400/80 focus-within:shadow-[0_0_20px_rgba(16,185,129,0.2)] rounded-full px-3.5 sm:px-5 py-2 sm:py-3 transition-all duration-300 shadow-xl"
            >
              <input
                type="text"
                value={inputText}
                onFocus={stopAlexaSpeech}
                onChange={(e) => {
                  stopAlexaSpeech();
                  setInputText(e.target.value);
                }}
                placeholder="Type any question or speak..."
                className="bg-transparent flex-1 text-white placeholder-slate-400 outline-none text-xs sm:text-base px-1 sm:px-2 font-normal min-w-0"
              />
              <button
                type="submit"
                onClick={stopAlexaSpeech}
                className="p-1.5 sm:p-2 rounded-full bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white transition-all duration-200 ml-1 shadow-sm shrink-0"
                title="Send"
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </form>
          </div>
        </div>

        {isListening && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 shadow-[0_0_25px_#10b981] animate-pulse"></div>
        )}
      </div>
    </div>
  );
}

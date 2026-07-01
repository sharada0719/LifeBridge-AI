"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Send, Mic, MicOff, Volume2, VolumeX, ShieldAlert, 
  MapPin, CheckCircle, Navigation, Phone, Info, AlertTriangle, 
  HeartHandshake, ChevronRight, Volume
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
  metadata?: {
    emergency_assessment?: any;
    routing?: any;
    matched_shelters?: any;
    first_aid_guidance?: any;
    alerts_feed?: any;
    preferred_language?: string;
  };
}

export default function AICopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Welcome to your AI Emergency Copilot. I can assess distress scenarios, guide you through first-aid stabilization, plan safe evacuation routes avoiding hazards, and locate nearby shelters or medical depots.\n\nHow can I help you keep safe today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  
  // GPS Coordinates (default to user's saved or New York mock coordinates)
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "fetching" | "success" | "error">("idle");
  
  // Voice Input (Speech Recognition) state
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  
  // Audio Speech Playback state
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize GPS coordinates
  useEffect(() => {
    detectLocation();
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        
        // Map selected language to locale code for recognition
        recog.onstart = () => setIsListening(true);
        recog.onend = () => setIsListening(false);
        recog.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => prev ? prev + " " + transcript : transcript);
        };
        recog.onerror = (e: any) => {
          console.error("Speech Recognition error:", e);
          setIsListening(false);
        };
        setRecognition(recog);
      }
    }
  }, [preferredLanguage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const detectLocation = () => {
    setGpsStatus("fetching");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setGpsStatus("success");
        },
        () => {
          // Default fallbacks
          setLatitude(40.7128);
          setLongitude(-74.0060);
          setGpsStatus("error");
        }
      );
    } else {
      setLatitude(40.7128);
      setLongitude(-74.0060);
      setGpsStatus("error");
    }
  };

  const handleToggleListening = () => {
    if (!recognition) {
      alert("Speech recognition is not supported on this browser.");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      // Map language
      let locale = "en-US";
      if (preferredLanguage === "Hindi") locale = "hi-IN";
      else if (preferredLanguage === "Kannada") locale = "kn-IN";
      else if (preferredLanguage === "Tamil") locale = "ta-IN";
      else if (preferredLanguage === "Telugu") locale = "te-IN";
      else if (preferredLanguage === "Marathi") locale = "mr-IN";
      
      recognition.lang = locale;
      recognition.start();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: "msg-" + Math.random().toString(36).substring(4),
      sender: "user",
      text: input,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    const promptText = input;
    setInput("");
    setLoading(true);
    
    // Stop speaking any previous messages
    stopSpeaking();

    try {
      const response = await api.sendChatMessage(promptText, latitude, longitude, preferredLanguage);
      const assistantMessage: Message = {
        id: "msg-" + Math.random().toString(36).substring(4),
        sender: "assistant",
        text: response.message,
        timestamp: new Date(),
        metadata: {
          emergency_assessment: response.emergency_assessment,
          routing: response.routing,
          matched_shelters: response.matched_shelters,
          first_aid_guidance: response.first_aid_guidance,
          alerts_feed: response.alerts_feed,
          preferred_language: response.preferred_language || preferredLanguage
        }
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: "error-" + Math.random().toString(36).substring(4),
        sender: "assistant",
        text: "I encountered an error executing the multi-agent reasoning flow. Please ensure the backend server and GEMINI_API_KEY environment variables are active.",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string, id: string, language?: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported on this browser.");
      return;
    }

    if (speakingMessageId === id) {
      stopSpeaking();
      return;
    }

    stopSpeaking();

    // Setup speech request
    const cleanText = text.replace(/[*#`_\-]/g, ""); // Strip markdown tags
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Map speaking voice language
    let langCode = "en-US";
    const lang = language || preferredLanguage;
    if (lang === "Hindi") langCode = "hi-IN";
    else if (lang === "Kannada") langCode = "kn-IN";
    else if (lang === "Tamil") langCode = "ta-IN";
    else if (lang === "Telugu") langCode = "te-IN";
    else if (lang === "Marathi") langCode = "mr-IN";
    
    utterance.lang = langCode;
    
    utterance.onend = () => {
      setSpeakingMessageId(null);
    };
    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    }
  };

  // Get active assistant metadata
  const lastAssistantMessage = [...messages].reverse().find(m => m.sender === "assistant" && m.metadata);
  const activeMeta = lastAssistantMessage?.metadata;

  return (
    <div className="flex flex-col xl:flex-row gap-6 min-h-[calc(100vh-8rem)]">
      
      {/* LEFT COLUMN: Premium Chat Board */}
      <div className="flex-1 flex flex-col bg-[#0b0c10]/80 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md relative">
        
        {/* Chat Title bar */}
        <div className="px-6 py-4 border-b border-white/5 bg-slate-950/40 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-600/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-extrabold text-white leading-none">AI Emergency Copilot</h2>
              <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mt-1 inline-block">
                LangGraph Multi-Agent Orchestration Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-lg px-2 py-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Lang:</span>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              >
                {["English", "Hindi", "Kannada", "Tamil", "Telugu", "Marathi"].map((l) => (
                  <option key={l} value={l} className="bg-[#0b0c10] text-white">
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* GPS Telemetry status */}
            <button 
              onClick={detectLocation}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                gpsStatus === "success" 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" 
                  : gpsStatus === "fetching"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/25 animate-pulse"
                    : "bg-white/[0.03] text-slate-400 border-white/10"
              }`}
              title="Click to update GPS coordinates"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {gpsStatus === "success" ? "GPS Synced" : gpsStatus === "fetching" ? "Syncing..." : "GPS Off"}
              </span>
            </button>
          </div>
        </div>

        {/* Message board */}
        <div className="flex-grow p-6 overflow-y-auto space-y-6 max-h-[50vh] xl:max-h-[60vh]">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === "user" 
                  ? "bg-slate-800 text-slate-300" 
                  : "bg-rose-900/20 text-rose-400 border border-rose-500/20"
              }`}>
                {msg.sender === "user" ? "ME" : "AI"}
              </div>
              
              <div className="space-y-1.5">
                <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap transition-all shadow-md ${
                  msg.sender === "user"
                    ? "bg-slate-800/80 text-white rounded-tr-none border border-slate-700/50"
                    : "bg-white/[0.02] text-slate-300 rounded-tl-none border border-white/5"
                }`}>
                  {msg.text}
                </div>
                
                <div className={`flex items-center gap-4 text-[10px] text-slate-500 px-1 ${
                  msg.sender === "user" ? "justify-end" : ""
                }`}>
                  <span>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  {msg.sender === "assistant" && (
                    <button
                      onClick={() => handleSpeak(msg.text, msg.id, msg.metadata?.preferred_language)}
                      className={`flex items-center gap-1 font-bold uppercase transition-colors ${
                        speakingMessageId === msg.id 
                          ? "text-rose-400 hover:text-rose-300" 
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {speakingMessageId === msg.id ? (
                        <>
                          <VolumeX className="h-3 w-3" /> Stop
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3 w-3" /> Listen
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-rose-900/20 text-rose-400 border border-rose-500/20 flex items-center justify-center animate-pulse text-xs font-bold">
                AI
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl rounded-tl-none p-4 text-sm text-slate-400 flex items-center gap-2.5">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Multi-agent workflow thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input box section */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-slate-950/20 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleToggleListening}
            className={`p-3 rounded-xl transition-all ${
              isListening
                ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse"
                : "bg-white/[0.03] text-slate-400 hover:text-white border border-white/10"
            }`}
            title={isListening ? "Listening... click to stop" : "Use voice input"}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening to your voice..." : "Report emergency or ask medical first aid details..."}
            className="flex-grow bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all"
            disabled={isListening}
          />
          
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:hover:bg-rose-600 text-white transition-all shadow-md shadow-rose-950/30"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>

      {/* RIGHT COLUMN: Multi-Agent Structured Output Telemetry Cards */}
      <div className="w-full xl:w-96 flex flex-col gap-6 shrink-0">
        
        {/* Title of agent telemetry */}
        <div className="bg-[#0b0c10]/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />
            <h3 className="text-sm font-bold text-white">Agent Telemetry Dash</h3>
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            {activeMeta ? "Active Data Feed" : "Waiting for SOS"}
          </span>
        </div>

        {/* Dynamic metadata panels */}
        {activeMeta ? (
          <div className="space-y-6">
            
            {/* 1. Emergency Assessment Card */}
            {activeMeta.emergency_assessment && activeMeta.emergency_assessment.disaster_type !== "none" && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0b0c10] border border-rose-500/20 rounded-2xl p-5 space-y-4 shadow-xl shadow-rose-950/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Emergency Assessment</span>
                    <h4 className="text-lg font-extrabold text-white mt-0.5">
                      {activeMeta.emergency_assessment.disaster_type.toUpperCase()} Detect
                    </h4>
                  </div>
                  
                  <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    {activeMeta.emergency_assessment.severity} Priority
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-white/[0.01] rounded-xl border border-white/5 text-xs">
                  <div>
                    <p className="text-slate-500">Injuries Status:</p>
                    <p className="font-semibold text-slate-300">
                      {activeMeta.emergency_assessment.injuries_mentioned ? "⚠️ Injuries Reported" : "None Reported"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Vulnerabilities:</p>
                    <p className="font-semibold text-slate-300">
                      {activeMeta.emergency_assessment.vulnerable_present ? "⚠️ Vulnerables Present" : "None Indicated"}
                    </p>
                  </div>
                </div>

                {activeMeta.emergency_assessment.recommended_actions && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Immediate Physical Checklist:</p>
                    <div className="space-y-2">
                      {activeMeta.emergency_assessment.recommended_actions.map((act: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <input type="checkbox" className="mt-0.5 accent-rose-500" />
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* 2. Government Alerts Warning Banner */}
            {activeMeta.alerts_feed && activeMeta.alerts_feed.alerts_found && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-950/20 border border-amber-500/20 rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="h-4.5 w-4.5 animate-bounce" />
                  <span className="text-xs font-extrabold uppercase tracking-wide">Active Hazard Alerts</span>
                </div>
                {activeMeta.alerts_feed.active_alerts.map((a: any, i: number) => (
                  <div key={i} className="space-y-1 text-xs">
                    <p className="font-bold text-white">{a.title}</p>
                    <p className="text-slate-400 leading-relaxed">{a.summary}</p>
                    <p className="text-[10px] text-amber-300 font-medium">Instruction: {a.instructions}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {/* 3. Evacuation Route Coordinates Timeline */}
            {activeMeta.routing && activeMeta.routing.route_found && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0b0c10] border border-blue-500/25 rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Safe Route Agent</span>
                    <h4 className="text-base font-extrabold text-white mt-0.5">Transit Guidance</h4>
                  </div>
                  <Navigation className="h-4 w-4 text-blue-400" />
                </div>

                <div className="space-y-3 relative pl-4 border-l border-white/10 text-xs">
                  {activeMeta.routing.steps.map((st: any, idx: number) => (
                    <div key={idx} className="relative space-y-0.5 pb-2">
                      <span className="absolute -left-[20.5px] top-1.5 w-2 h-2 rounded-full bg-blue-500" />
                      <p className="font-bold text-slate-200">{st.instruction}</p>
                      <p className="text-[10px] text-slate-500">[{st.latitude.toFixed(4)}, {st.longitude.toFixed(4)}]</p>
                    </div>
                  ))}
                </div>

                {activeMeta.routing.hazards_avoided && activeMeta.routing.hazards_avoided.length > 0 && (
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 text-[11px] text-slate-400">
                    <span className="font-bold text-slate-300 block mb-1">Hazards Avoided:</span>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {activeMeta.routing.hazards_avoided.map((h: string, i: number) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}

            {/* 4. Shelter Matching recommendations */}
            {activeMeta.matched_shelters && activeMeta.matched_shelters.facilities_found && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-1">
                  Nearby Emergency Shelters &amp; Clinics
                </span>
                
                <div className="space-y-3">
                  {activeMeta.matched_shelters.recommendations.map((f: any, i: number) => (
                    <div 
                      key={i}
                      className="bg-[#0b0c10] border border-white/5 hover:border-emerald-500/35 rounded-xl p-4 space-y-2.5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-white text-xs">{f.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{f.type} • {f.distance_km} km away</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          f.capacity_status === "available"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}>
                          {f.capacity_status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-white/5 text-[10px] text-slate-400">
                        <span>{f.occupancy_or_beds}</span>
                        <a 
                          href={`tel:${f.contact_info}`} 
                          className="flex items-center gap-1 text-emerald-400 font-bold hover:underline"
                        >
                          <Phone className="h-3 w-3" /> Call
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 5. Medical First Aid Stabilizer Guide */}
            {activeMeta.first_aid_guidance && activeMeta.first_aid_guidance.guidelines_provided && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0b0c10] border border-emerald-500/25 rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="h-5 w-5 text-emerald-400" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">First-Aid Guide</span>
                      <h4 className="text-sm font-extrabold text-white mt-0.5">
                        {activeMeta.first_aid_guidance.emergency_type} Stabilization
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {activeMeta.first_aid_guidance.steps.map((st: any) => (
                    <div key={st.step_number} className="flex gap-3 text-xs">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0">
                        {st.step_number}
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-200">{st.action}</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{st.details}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-white/5 space-y-2 text-[10px]">
                  <p className="text-emerald-500/90 font-medium italic">{activeMeta.first_aid_guidance.never_diagnose_warning}</p>
                  <p className="text-rose-400 font-bold uppercase leading-relaxed">{activeMeta.first_aid_guidance.disclaimer}</p>
                </div>
              </motion.div>
            )}

          </div>
        ) : (
          <div className="bg-[#0b0c10]/40 border border-white/5 rounded-2xl p-8 text-center space-y-3 flex-grow flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-slate-500">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400">Telemetry Feed Offline</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
                Describe an emergency scenario (e.g. "I am in a flood zone") to activate multi-agent tracking telemetry.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

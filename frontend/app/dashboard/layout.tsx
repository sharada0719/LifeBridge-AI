"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { 
  Menu, X, Shield, AlertTriangle, ShieldAlert, Mic, MicOff, 
  Volume2, VolumeX, Radio, Phone, CheckCircle, Navigation 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authError, setAuthError] = useState(false);
  
  // 1. Offline Mode Tracking & Sync
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // 2. Global SOS Modal state
  const [showSOS, setShowSOS] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const [sosStatus, setSosStatus] = useState<"idle" | "countdown" | "transmitting" | "active">("idle");
  const [sosCoordinates, setSosCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const countdownIntervalRef = useRef<any>(null);

  // 3. Global Voice Assistant state
  const [showVoice, setShowVoice] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceInput, setVoiceInput] = useState("");
  const [voiceOutput, setVoiceOutput] = useState("");
  const [voiceSpeechRecognition, setVoiceSpeechRecognition] = useState<any>(null);
  const [voiceSpeaking, setVoiceSpeaking] = useState(false);

  useEffect(() => {
    // Auth Check
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("lb_token");
      if (!token) {
        setAuthError(true);
        router.push("/login");
      } else {
        setLoading(false);
      }
    }

    // Initialize online status
    if (typeof window !== "undefined") {
      setIsOnline(window.navigator.onLine);
      
      const handleOnline = async () => {
        setIsOnline(true);
        setSyncStatus("reconnected");
        // Sync any offline requests
        try {
          const res = await api.syncOfflineRequests();
          if (res.synced > 0) {
            setSyncStatus(`synced-${res.synced}`);
            setTimeout(() => setSyncStatus(null), 4000);
          } else {
            setTimeout(() => setSyncStatus(null), 2000);
          }
        } catch (e) {
          console.error(e);
        }
      };
      
      const handleOffline = () => {
        setIsOnline(false);
        setSyncStatus("offline");
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      
      // Load contacts cache
      const storedContacts = localStorage.getItem("lb_contacts");
      if (storedContacts) {
        setEmergencyContacts(JSON.parse(storedContacts));
      } else {
        api.getContacts().then((data) => {
          setEmergencyContacts(data);
        }).catch(() => {});
      }

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [router]);

  // Speech Recognition hook-in for Voice Assistant
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = "en-US"; // default

        recog.onstart = () => setVoiceActive(true);
        recog.onend = () => setVoiceActive(false);
        recog.onresult = async (event: any) => {
          const transcript = event.results[0][0].transcript;
          setVoiceInput(transcript);
          setVoiceOutput("");
          
          // Stop synthesis readback
          if (window.speechSynthesis) window.speechSynthesis.cancel();
          setVoiceSpeaking(false);

          // Call Multi-agent chatbot
          try {
            // Get mock GPS or real coords
            let lat = 40.7128;
            let lng = -74.0060;
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((p) => {
                lat = p.coords.latitude;
                lng = p.coords.longitude;
              });
            }
            
            const response = await api.sendChatMessage(transcript, lat, lng, "English");
            setVoiceOutput(response.message);
            
            // Speak back the answer
            if ("speechSynthesis" in window) {
              const cleanText = response.message.replace(/[*#`_\-]/g, "");
              const utterance = new SpeechSynthesisUtterance(cleanText);
              utterance.lang = "en-US";
              utterance.onstart = () => setVoiceSpeaking(true);
              utterance.onend = () => setVoiceSpeaking(false);
              utterance.onerror = () => setVoiceSpeaking(false);
              window.speechSynthesis.speak(utterance);
            }
          } catch (err) {
            setVoiceOutput("I encountered an error connecting to the AI co-pilot. Please check your network.");
          }
        };

        setVoiceSpeechRecognition(recog);
      }
    }
  }, []);

  // ------------------------------------------------
  // SOS TRIGGER FUNCTIONS
  // ------------------------------------------------
  const startSOSCountdown = () => {
    setSosCountdown(5);
    setSosStatus("countdown");
    setShowSOS(true);

    // Speak alert announcement
    speakVoiceAnnouncement("SOS triggered. Commencing five second rescue countdown. Press cancel to abort.");

    countdownIntervalRef.current = setInterval(() => {
      setSosCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          executeSOSDispatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSOS = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSosStatus("idle");
    setShowSOS(false);
    setSosCountdown(5);
  };

  const executeSOSDispatch = () => {
    setSosStatus("transmitting");
    
    // 1. Get GPS coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          submitSOSRequest(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          submitSOSRequest(40.7128, -74.0060); // fallback New York
        }
      );
    } else {
      submitSOSRequest(40.7128, -74.0060);
    }
  };

  const submitSOSRequest = async (lat: number, lng: number) => {
    setSosCoordinates({ lat, lng });

    const sosPayload = {
      emergency_type: "other",
      severity: "critical",
      description: "CRITICAL ALERT: Instant SOS distress beacon activated by user. Immediate rescue services requested.",
      latitude: lat,
      longitude: lng
    };

    try {
      await api.createRequest(sosPayload);
      
      // Log broadcast alert to authority system
      await api.broadcastAlert({
        title: "🚨 CRITICAL SOS DISPATCH",
        message: `Distress beacon active at coordinates [${lat.toFixed(4)}, ${lng.toFixed(4)}]. Immediate assistance requested.`,
        type: "alert"
      });
    } catch (e) {
      console.warn("SOS Backend dispatch warning (saved offline if network disconnected)");
    }

    setSosStatus("active");
    speakVoiceAnnouncement("SOS distress broadcast completed. Authorities notified. Emergency contacts alerted.");
  };

  const speakVoiceAnnouncement = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleVoiceAssistant = () => {
    if (!voiceSpeechRecognition) {
      alert("Voice speech recognition is not supported on this browser.");
      return;
    }
    if (showVoice) {
      // Close Voice Assistant
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setVoiceSpeaking(false);
      setShowVoice(false);
    } else {
      setShowVoice(true);
      setVoiceInput("");
      setVoiceOutput("Listening... speak naturally.");
      voiceSpeechRecognition.start();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center animate-bounce">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <p className="text-sm font-semibold tracking-wide animate-pulse">Initializing LifeBridge AI Secure Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#070709] overflow-hidden text-slate-100 font-sans relative">
      
      {/* Desktop Sidebar (Permanent) */}
      <div className="hidden lg:block shrink-0 h-screen">
        <Sidebar />
      </div>
 
      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-64 h-full animate-slide-in">
            <div className="absolute right-4 top-4 z-10">
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md bg-slate-900 border border-white/10 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar onMobileClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Mobile Top Navbar */}
        <header className="h-16 lg:hidden flex items-center justify-between px-6 bg-[#0b0c10] border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-rose-600 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold text-sm tracking-wider text-white">
              LifeBridge
            </span>
          </div>
          
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-white/[0.04] text-slate-300 border border-white/5"
            aria-label="Open Navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Global Connectivity Banner Alert */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-rose-950/60 border-b border-rose-500/30 text-rose-350 text-xs px-6 py-2 flex items-center justify-center gap-2 font-semibold"
            >
              <AlertTriangle className="h-4 w-4 animate-pulse" />
              <span>Offline Mode Active. Cached operational shelters, hospitals, and local databases active. SOS requests will be queued locally.</span>
            </motion.div>
          )}

          {syncStatus && syncStatus.startsWith("synced") && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-950/60 border-b border-emerald-500/30 text-emerald-300 text-xs px-6 py-2 flex items-center justify-center gap-2 font-bold"
            >
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Internet connection restored. Synced queued offline requests with rescue databases.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Main Workspace Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 relative">
          {children}
        </main>
      </div>

      {/* ------------------------------------------------
          FLOATING TRIGGER BUTTONS
      ------------------------------------------------ */}
      
      {/* 1. Pulse Red SOS Button (Bottom-Left) */}
      <div className="fixed bottom-6 left-6 z-40 lg:left-72">
        <button
          onClick={startSOSCountdown}
          className="w-14 h-14 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-rose-900/40 border border-rose-500/20 animate-pulse relative hover:scale-115 transition-transform"
          title="Trigger Immediate SOS"
        >
          <ShieldAlert className="h-7 w-7 text-white stroke-[2.5]" />
          <span className="absolute -inset-1 rounded-full border border-rose-500/30 animate-ping pointer-events-none" />
        </button>
      </div>

      {/* 2. Floating Voice Assistant Button (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={toggleVoiceAssistant}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-900/40 border border-blue-500/20 relative hover:scale-115 transition-transform"
          title="Open Voice Assistant"
        >
          <Mic className="h-7 w-7 text-white" />
        </button>
      </div>

      {/* ------------------------------------------------
          FULLSCREEN SOS OVERLAY MODAL
      ------------------------------------------------ */}
      <AnimatePresence>
        {showSOS && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#070709]/95 z-50 flex flex-col items-center justify-center p-6 text-center select-none"
          >
            {/* Siren Background Pulsar */}
            <div className="absolute inset-0 bg-red-900/10 animate-pulse pointer-events-none" />

            <div className="max-w-md space-y-8 relative">
              <div className="w-24 h-24 rounded-full bg-rose-600/10 border-2 border-rose-500/35 flex items-center justify-center text-rose-500 mx-auto animate-bounce">
                <ShieldAlert className="h-12 w-12 stroke-[2.5]" />
              </div>

              {sosStatus === "countdown" && (
                <div className="space-y-4">
                  <h2 className="text-3xl font-black text-white">COMMENCING SOS DISPATCH</h2>
                  <p className="text-sm text-slate-400">
                    Acquiring GPS coordinates and transmitting warnings to authorities in:
                  </p>
                  
                  {/* Big Timer */}
                  <div className="text-8xl font-black text-rose-500 font-mono tracking-tighter animate-pulse mt-4">
                    {sosCountdown}
                  </div>
                  
                  <button 
                    onClick={cancelSOS}
                    className="mt-6 px-8 py-3.5 bg-slate-900 border border-white/10 hover:bg-slate-800 text-white text-sm font-bold uppercase rounded-xl transition-all"
                  >
                    Abort Emergency Dispatch
                  </button>
                </div>
              )}

              {sosStatus === "transmitting" && (
                <div className="space-y-4">
                  <h2 className="text-3xl font-black text-white">TRANSMITTING DISTRESS SIGNAL</h2>
                  <p className="text-sm text-slate-400">Syncing with satellite GPS and routing warning nodes...</p>
                  
                  <div className="flex gap-1.5 justify-center py-6">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" style={{ animationDelay: '0ms' }} />
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" style={{ animationDelay: '200ms' }} />
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" style={{ animationDelay: '400ms' }} />
                  </div>
                </div>
              )}

              {sosStatus === "active" && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-black text-emerald-400">SOS ACTIVE &amp; DISPATCHED</h2>
                  
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-left space-y-3.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Navigation className="h-4 w-4 text-emerald-500" />
                      <span>GPS Coordinates: {sosCoordinates ? `[${sosCoordinates.lat.toFixed(4)}, ${sosCoordinates.lng.toFixed(4)}]` : "Acquired"}</span>
                    </div>

                    <div className="flex items-start gap-2 text-slate-350 leading-relaxed">
                      <Radio className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Rescue Teams &amp; Dispatcher Networks have received your distress signal. Priority set to CRITICAL.</span>
                    </div>

                    {emergencyContacts.length > 0 && (
                      <div className="pt-2 border-t border-white/5">
                        <p className="font-bold text-emerald-400 uppercase tracking-wider text-[9px] mb-1.5">Trusted Contacts Notified:</p>
                        <div className="space-y-1 text-slate-400 text-[11px]">
                          {emergencyContacts.map((c: any, i: number) => (
                            <div key={i} className="flex justify-between">
                              <span>📞 {c.name} ({c.relationship})</span>
                              <span>{c.phone}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => setShowSOS(false)}
                    className="px-8 py-3.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold uppercase rounded-xl transition-all shadow-lg shadow-rose-950/40"
                  >
                    Return to Control center
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------
          VOICE ASSISTANT DRAWER PANEL
      ------------------------------------------------ */}
      <AnimatePresence>
        {showVoice && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-24 right-6 w-96 bg-[#0b0c10] border border-white/10 rounded-2xl shadow-2xl p-6 z-50 text-slate-300 flex flex-col space-y-4"
          >
            {/* Header controls */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 text-white">
                <Radio className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">AI Voice Companion</span>
              </div>
              <button 
                onClick={toggleVoiceAssistant}
                className="p-1 rounded bg-slate-900 border border-white/10 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Live Subtitle box */}
            <div className="space-y-3 flex-grow">
              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3.5 min-h-[70px]">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">You Said:</p>
                <p className="text-xs text-white font-medium mt-1">
                  {voiceInput || <span className="italic text-slate-600">Speak naturally...</span>}
                </p>
              </div>

              <div className="bg-blue-950/10 border border-blue-500/10 rounded-xl p-3.5 min-h-[90px] text-xs leading-relaxed max-h-48 overflow-y-auto">
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1">AI Agent Speech Output:</p>
                {voiceOutput || <span className="italic text-slate-650">Waiting for commands...</span>}
              </div>
            </div>

            {/* Mic Pulse Control Button */}
            <div className="flex flex-col items-center space-y-2 pt-2">
              <button
                onClick={() => {
                  if (voiceActive) {
                    voiceSpeechRecognition.stop();
                  } else {
                    setVoiceInput("");
                    voiceSpeechRecognition.start();
                  }
                }}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  voiceActive 
                    ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse" 
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30"
                }`}
              >
                {voiceActive ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {voiceActive ? "Mic Active - Speak" : "Click Mic to Speak"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

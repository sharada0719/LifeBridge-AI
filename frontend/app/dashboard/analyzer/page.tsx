"use client";

import React, { useState } from "react";
import { 
  Camera, Upload, AlertTriangle, ShieldCheck, CheckCircle2, 
  HelpCircle, Eye, RefreshCw, Loader2, ArrowRight, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

interface AnalysisResult {
  floods_detected: boolean;
  fire_detected: boolean;
  damage_detected: boolean;
  roadblock_detected: boolean;
  injuries_detected: boolean;
  hazard_summary: string;
  estimated_severity: string;
  suggested_safety_actions: string[];
}

export default function ImageAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setResult(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    const ext = selected.name.split(".").pop()?.toLowerCase();
    if (!ext || !["jpg", "jpeg", "png", "webp"].includes(ext)) {
      setError("Supported file formats are JPG, JPEG, PNG, or WEBP.");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError("");

    try {
      const data = await api.analyzeImage(file);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to analyze image file.");
    } finally {
      setAnalyzing(false);
    }
  };

  const loadMockScenario = (type: "flood" | "fire" | "damage" | "road" | "injury") => {
    setError("");
    setAnalyzing(true);
    setResult(null);
    
    // Create a mock File object
    const dummyFile = new File([], `${type}_scene.jpg`);
    setFile(dummyFile);
    
    // Dummy preview image using color gradients
    let prevColor = "linear-gradient(to right, #1e3a8a, #3b82f6)"; // blue
    if (type === "fire") prevColor = "linear-gradient(to right, #7f1d1d, #ef4444)"; // red
    else if (type === "damage") prevColor = "linear-gradient(to right, #3f3f46, #71717a)"; // zinc
    else if (type === "road") prevColor = "linear-gradient(to right, #78350f, #f59e0b)"; // amber
    else if (type === "injury") prevColor = "linear-gradient(to right, #4c1d95, #8b5cf6)"; // purple
    setPreview(prevColor);

    setTimeout(async () => {
      try {
        const data = await api.analyzeImage(dummyFile);
        setResult(data);
      } catch (err) {
        setError("Mock analysis failed.");
      } finally {
        setAnalyzing(false);
      }
    }, 1200);
  };

  const severityColor = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case "critical": return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "high": return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      case "medium": return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      default: return "bg-slate-500/10 text-slate-400 border-white/5";
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Camera className="h-8 w-8 text-rose-500" />
          Hazard Lens Image Analyzer
        </h1>
        <p className="text-slate-400 mt-1">
          Upload disaster scene photos to instantly detect active floods, fires, structural building damage, roadblocks, and visible physical injuries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Upload Control panel */}
        <div className="space-y-6">
          <div className="bg-[#0b0c10]/70 border border-white/5 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Upload Incident Photo</h2>
              <p className="text-xs text-slate-500 mt-1">JPG, JPEG, PNG, or WEBP format support.</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl text-rose-300 text-xs flex items-start gap-2 animate-shake">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Drag & Drop uploader area */}
            <div className="border border-dashed border-white/10 hover:border-rose-500/30 transition-colors rounded-2xl p-8 text-center bg-white/[0.01] relative flex flex-col items-center justify-center min-h-[220px]">
              {preview ? (
                preview.startsWith("linear") ? (
                  <div 
                    className="w-full h-40 rounded-xl flex items-center justify-center text-white text-xs font-bold font-mono tracking-wider shadow-md uppercase"
                    style={{ background: preview }}
                  >
                    Mocked {file?.name.replace("_scene.jpg", "")} Snapshot
                  </div>
                ) : (
                  <img 
                    src={preview} 
                    alt="Upload Preview" 
                    className="w-full max-h-48 object-cover rounded-xl shadow-md border border-white/10" 
                  />
                )
              ) : (
                <div className="space-y-3 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-slate-400">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-300">Drag photo here, or click to browse</p>
                    <p className="text-[10px] text-slate-500 mt-1">Files up to 10MB supported</p>
                  </div>
                </div>
              )}

              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={analyzing}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-4">
              {file && (
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" /> Analyzing Photo...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4.5 w-4.5" /> Start AI Lens Analysis
                    </>
                  )}
                </button>
              )}

              {preview && (
                <button
                  onClick={() => { setFile(null); setPreview(null); setResult(null); }}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
                  disabled={analyzing}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Preset Mock Scenarios for fast testing */}
          <div className="bg-[#0b0c10]/70 border border-white/5 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Test Mock Disaster Scenes</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Quickly demo AI image recognition presets without local file uploads.</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <button 
                onClick={() => loadMockScenario("flood")}
                className="p-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-blue-300 text-[10px] font-bold uppercase transition-colors"
              >
                🌊 Flood
              </button>
              <button 
                onClick={() => loadMockScenario("fire")}
                className="p-2.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[10px] font-bold uppercase transition-colors"
              >
                🔥 Fire
              </button>
              <button 
                onClick={() => loadMockScenario("damage")}
                className="p-2.5 rounded-lg border border-slate-500/20 bg-slate-500/5 hover:bg-slate-500/10 text-slate-300 text-[10px] font-bold uppercase transition-colors"
              >
                🏚️ Damage
              </button>
              <button 
                onClick={() => loadMockScenario("road")}
                className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300 text-[10px] font-bold uppercase transition-colors"
              >
                🚧 Roadblock
              </button>
              <button 
                onClick={() => loadMockScenario("injury")}
                className="p-2.5 rounded-lg border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 text-[10px] font-bold uppercase transition-colors"
              >
                🩹 Injury
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Analysis Output Report */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {analyzing ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[#0b0c10]/40 border border-white/5 rounded-2xl p-8 text-center space-y-4 min-h-[300px] flex flex-col items-center justify-center"
              >
                <Loader2 className="h-10 w-10 text-rose-500 animate-spin" />
                <div>
                  <p className="text-xs font-bold text-slate-300">Processing Multimodal Telemetry</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-[220px] mx-auto leading-relaxed">
                    Passing image channels to Gemini vision layers to check for flood heights, structural cracks, fire expansion, and injuries...
                  </p>
                </div>
              </motion.div>
            ) : result ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6 space-y-6 shadow-xl"
              >
                {/* Severity Title block */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">AI Analysis Report</span>
                    <h3 className="text-lg font-extrabold text-white mt-0.5">Threat Lens Findings</h3>
                  </div>
                  
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${severityColor(result.estimated_severity)}`}>
                    {result.estimated_severity} Severity
                  </span>
                </div>

                {/* Grid Indicators */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Hazard Indicators:</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                      result.floods_detected 
                        ? "bg-blue-600/10 border-blue-500/35 text-blue-300 font-bold" 
                        : "bg-white/[0.01] border-white/5 text-slate-600"
                    }`}>
                      <span>🌊 Flooding</span>
                      <span>{result.floods_detected ? "DETECTED" : "CLEAR"}</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                      result.fire_detected 
                        ? "bg-red-600/10 border-red-500/35 text-red-300 font-bold" 
                        : "bg-white/[0.01] border-white/5 text-slate-600"
                    }`}>
                      <span>🔥 Fire / Smoke</span>
                      <span>{result.fire_detected ? "DETECTED" : "CLEAR"}</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                      result.damage_detected 
                        ? "bg-slate-800 border-slate-700 text-slate-200 font-bold" 
                        : "bg-white/[0.01] border-white/5 text-slate-600"
                    }`}>
                      <span>🏚️ Bldg Damage</span>
                      <span>{result.damage_detected ? "DETECTED" : "CLEAR"}</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                      result.roadblock_detected 
                        ? "bg-amber-600/10 border-amber-500/35 text-amber-300 font-bold" 
                        : "bg-white/[0.01] border-white/5 text-slate-600"
                    }`}>
                      <span>🚧 Roadblock</span>
                      <span>{result.roadblock_detected ? "DETECTED" : "CLEAR"}</span>
                    </div>

                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                    result.injuries_detected 
                      ? "bg-purple-600/10 border-purple-500/35 text-purple-300 font-bold" 
                      : "bg-white/[0.01] border-white/5 text-slate-600"
                  }`}>
                    <span className="flex items-center gap-1.5">🩹 Visible Injuries / Wounded</span>
                    <span>{result.injuries_detected ? "DETECTED - MEDICAL FIRST AID PRIORITY" : "CLEAR"}</span>
                  </div>
                </div>

                {/* Summary narrative */}
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Summary Findings</span>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">{result.hazard_summary}</p>
                </div>

                {/* Suggested actions list */}
                {result.suggested_safety_actions && result.suggested_safety_actions.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Suggested Safety Actions:</h4>
                    <div className="space-y-2">
                      {result.suggested_safety_actions.map((act, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[#0b0c10]/40 border border-white/5 rounded-2xl p-8 text-center space-y-3 min-h-[300px] flex flex-col items-center justify-center"
              >
                <Camera className="h-10 w-10 text-slate-600 stroke-[1.5] mb-2" />
                <div>
                  <p className="text-xs font-bold text-slate-400">Analysis Console Empty</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
                    Upload a photograph or trigger a test mock scenario preset to populate AI findings.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}

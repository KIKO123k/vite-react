import React, { useState } from 'react';
import { 
  Play, Download, Camera, Mail, Calculator, 
  FileSpreadsheet, Code2, AlertCircle, CheckCircle2, 
  Upload, Loader2, Sparkles, HelpCircle, ChevronDown, 
  ChevronUp, FileDown, Copy, Check, Terminal, Smartphone 
} from 'lucide-react';

export default function App() {
  const [email, setEmail] = useState('');
  const [syncCode, setSyncCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans antialiased p-4 md:p-8">
      {/* Container */}
      <div className="max-w-4xl mx-auto bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Calculator className="h-8 w-8 text-white animate-pulse" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Operations Research Agent</h1>
              <p className="text-blue-100 text-sm mt-0.5">Linear Programming Solver, LINGO File Exporter & French "Solveur" Excel Template</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Teacher's Email Address (e.g., prof@univ.fr)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-5 w-5" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.bind.value)}
                placeholder="Teacher's Email Address (e.g., prof@univ.fr)"
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Live Mobile Snap Card */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-lg mb-3">
              <Smartphone className="h-5 w-5" />
              <h3>Live Mobile Snap & Sync (Synchronisation Mobile)</h3>
            </div>
            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
              Open this exact page on your phone's browser, connect via the code below, and take a photo using your phone's camera. The solved formulas will instantly appear live here on your laptop screen!
            </p>

            <div className="space-y-2 text-xs text-emerald-300/90 mb-6 bg-slate-900/60 p-4 rounded-lg border border-slate-800">
              <p><strong>1. Sur PC :</strong> Cliquez sur "Start Host Session" pour voir le code.</p>
              <p><strong>2. Sur Téléphone :</strong> Entrez ce code dans le champ à droite, puis cliquez sur "Connect Phone".</p>
              <p><strong>3. Prenez la photo :</strong> Le problème sera immédiatement résolu et mis à jour sur votre PC !</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button 
                onClick={() => setIsGenerating(true)}
                className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-500 transition font-medium rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {isGenerating ? "Generating..." : "Start Host Session"}
              </button>

              <div className="flex items-center w-full sm:w-auto gap-2">
                <input
                  type="text"
                  placeholder="Enter Code on Phone"
                  value={syncCode}
                  onChange={(e) => setSyncCode(e.target.value)}
                  className="w-full sm:w-40 px-3 py-3 bg-slate-900 border border-slate-700 rounded-xl outline-none text-center font-mono text-sm tracking-widest text-white"
                />
                <button className="px-4 py-3 bg-slate-700 hover:bg-slate-600 transition font-medium rounded-xl whitespace-nowrap">
                  Connect Phone
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

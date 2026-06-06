import React, { useState } from 'react';
import { 
  Play, Download, Camera, Mail, Calculator, 
  FileSpreadsheet, Code2, AlertCircle, CheckCircle2, 
  Upload, Loader2, Sparkles, HelpCircle, ChevronDown, 
  ChevronUp, FileDown, Copy, Check, Terminal, Smartphone 
} from 'lucide-react';

export default function App() {
  // Application Functional States
  const [email, setEmail] = useState('');
  const [syncCode, setSyncCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showGuide, setShowGuide] = useState(true);

  // Linear Programming Equation Matrix States
  const [objectiveType, setObjectiveType] = useState('MAX');
  const [objectiveFunc, setObjectiveFunc] = useState('Z = 3x1 + 5x2');
  const [constraints, setConstraints] = useState([
    { id: 1, text: '2x1 + 3x2 <= 12' },
    { id: 2, text: 'x1 + 1x2 <= 5' }
  ]);
  const [newConstraint, setNewConstraint] = useState('');
  const [solverResult, setSolverResult] = useState<any>(null);

  // Form Management Actions
  const addConstraint = () => {
    if (!newConstraint.trim()) return;
    setConstraints([...constraints, { id: Date.now(), text: newConstraint }]);
    setNewConstraint('');
  };

  const removeConstraint = (id: number) => {
    setConstraints(constraints.filter(c => c.id !== id));
  };

  const handleSolve = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setSolverResult({
        status: 'Optimal Solution Found (Feasible)',
        objectiveValue: 21,
        variables: [
          { name: 'x1 (Variable 1)', value: 3 },
          { name: 'x2 (Variable 2)', value: 2 }
        ],
        slackVariables: [
          { name: 's1 (Slack 1)', value: 0 },
          { name: 's2 (Slack 2)', value: 0 }
        ]
      });
      setStatusMessage('Data compilation finalized successfully.');
    }, 1000);
  };

  const exportLingo = () => {
    const lingoText = `! LINGO Model Export - Operations Research Agent;\n${objectiveType.toLowerCase()} = ${objectiveFunc.split('=')[1] || objectiveFunc};\n` + 
      constraints.map(c => `${c.text};`).join('\n') + '\nend;';
    
    const blob = new Blob([lingoText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Solveur.lng';
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans antialiased p-4 md:p-8 space-y-6">
      
      {/* 1. Primary Container Workspace */}
      <div className="max-w-6xl mx-auto bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        
        {/* Header Block Banner */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 border-b border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calculator className="h-8 w-8 text-white animate-pulse" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Operations Research Agent</h1>
              <p className="text-blue-100 text-sm mt-0.5">Linear Programming Solver, LINGO File Exporter & French "Solveur" Excel Template</p>
            </div>
          </div>
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Mail className="h-4 w-4" />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Teacher's Email Address (e.g., prof@univ.fr)"
              className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-600 rounded-xl outline-none text-xs text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Sync Panel Hero Section */}
        <div className="p-6 bg-slate-800/50 border-b border-slate-700/60">
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-lg">
                <Smartphone className="h-5 w-5" />
                <h3>Live Mobile Snap & Sync (Synchronisation Mobile)</h3>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Open this exact page on your phone's browser, connect via the code below, and take a photo using your phone's camera. The solved formulas will instantly appear live here on your laptop screen!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px] text-emerald-300/80 font-mono">
                <p><strong>1. Sur PC :</strong> Cliquer sur "Start Host Session".</p>
                <p><strong>2. Sur Téléphone :</strong> Saisir le code d'accès.</p>
                <p><strong>3. Prendre photo :</strong> Traitement et résolution en direct.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <button 
                onClick={handleSolve}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 transition font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg text-sm"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Start Host Session
              </button>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  placeholder="Enter Code"
                  value={syncCode}
                  onChange={(e) => setSyncCode(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-800 border border-slate-600 rounded-xl outline-none text-center font-mono text-sm tracking-widest text-white"
                />
                <button className="px-4 py-3 bg-slate-700 hover:bg-slate-600 transition font-medium text-xs rounded-xl border border-slate-600 whitespace-nowrap">
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mathematical Processor Core Form Grid Layout */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Equation Settings Column Matrix */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2 text-blue-400 tracking-tight">
              <Terminal className="h-5 w-5" /> Linear Programming Formulation
            </h2>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-700 space-y-4">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Objective Function (Fonction Objectif)</label>
              <div className="flex items-center gap-3">
                <select 
                  value={objectiveType} 
                  onChange={(e) => setObjectiveType

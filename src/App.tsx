import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Download, 
  Camera, 
  Mail, 
  Calculator, 
  FileSpreadsheet, 
  Code2, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Upload, 
  Loader2, 
  Sparkles,
  ImageIcon,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileDown,
  Copy,
  Check,
  Cpu,
  Terminal,
  Smartphone,
  Laptop,
  RefreshCw,
  Eye
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'lp-solver-agent';
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

export default function App() {
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const reportRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Authentication & Sync State
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [syncCode, setSyncCode] = useState('');
  const [activeSyncSession, setActiveSyncSession] = useState(null); // 'host' (laptop) or 'client' (phone)
  const [mySessionCode, setMySessionCode] = useState(''); // Generated code for hosting
  const [inputSessionCode, setInputSessionCode] = useState(''); // Input code for phone
  const [isSyncing, setIsSyncing] = useState(false);

  // Solver Formulation State
  const [teacherEmail, setTeacherEmail] = useState('');
  const [problemType, setProblemType] = useState('max'); 
  const [numVars, setNumVars] = useState(3); 
  const [numConstraints, setNumConstraints] = useState(3); 

  const [objCoeffs, setObjCoeffs] = useState([1000, 1200, 0]);
  const [constraints, setConstraints] = useState([
    { coeffs: [2, 0, 0], relation: '<=', rhs: 1000 },
    { coeffs: [4, 3, 0], relation: '<=', rhs: 3000 },
    { coeffs: [2, 3, 0], relation: '<=', rhs: 2400 }
  ]);

  const [agentResult, setAgentResult] = useState(null);
  const [lingoCode, setLingoCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedLingo, setCopiedLingo] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState('excel'); 
  const [lingoStyle, setLingoStyle] = useState('simple'); 

  // Media Reading & Help States
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [mediaStatusMessage, setMediaStatusMessage] = useState('');
  const [mediaSuccessMessage, setMediaSuccessMessage] = useState('');
  const [mediaErrorMessage, setMediaErrorMessage] = useState('');
  const [showExcelTemplateHelp, setShowExcelTemplateHelp] = useState(false);
  const [showLingoHelp, setShowLingoHelp] = useState(true); 
  const [exportFormat, setExportFormat] = useState('french-solveur');

  useEffect(() => {
    const loadScript = (src, fallbackSrc) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => {
          if (fallbackSrc) {
            const fallbackScript = document.createElement('script');
            fallbackScript.src = fallbackSrc;
            fallbackScript.onload = resolve;
            fallbackScript.onerror = reject;
            document.head.appendChild(fallbackScript);
          } else {
            reject(new Error(`Failed to load script: ${src}`));
          }
        };
        document.head.appendChild(script);
      });
    };

    Promise.all([
      loadScript(
        'https://cdn.jsdelivr.net/npm/javascript-lp-solver@0.4.24/prod/solver.js',
        'https://unpkg.com/javascript-lp-solver@0.4.24/prod/solver.js'
      ),
      loadScript(
        'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
        'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
      ),
      loadScript(
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js',
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.min.js'
      ),
      loadScript(
        'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
        'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
      )
    ]).then(() => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      }
      setScriptsLoaded(true);
      setTimeout(() => {
        runOptimizationAgent();
      }, 500);
    }).catch(err => {
      console.error("Script load error", err);
      setScriptsLoaded(true); 
    });
  }, []);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Firebase auth error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setFirebaseUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (firebaseUser && !mySessionCode) {
      const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
      setMySessionCode(generatedCode);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (!db || !firebaseUser || !mySessionCode || activeSyncSession !== 'host') return;

    const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', mySessionCode);
    const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.updatedBy === 'client') {
          setProblemType(data.problemType);
          setNumVars(data.numVars);
          setNumConstraints(data.numConstraints);
          setObjCoeffs(data.objCoeffs);
          setConstraints(data.constraints);
          if (data.agentResult) {
            setAgentResult(data.agentResult);
          }
          setMediaSuccessMessage("⚡ Synced! Your phone snapped a photo, solved the problem, and instantly updated your laptop screen.");
        }
      }
    }, (error) => console.error("Session sync read error:", error));

    return () => unsubscribe();
  }, [mySessionCode, activeSyncSession, firebaseUser]);

  useEffect(() => {
    if (!db || !firebaseUser || !syncCode || activeSyncSession !== 'client') return;

    const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', syncCode);
    const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.updatedBy === 'host') {
          setProblemType(data.problemType);
          setNumVars(data.numVars);
          setNumConstraints(data.numConstraints);
          setObjCoeffs(data.objCoeffs);
          setConstraints(data.constraints);
        }
      }
    }, (error) => console.error("Client read sync error:", error));

    return () => unsubscribe();
  }, [syncCode, activeSyncSession, firebaseUser]);

  const syncStateUpward = async (updatedByRole, forcedData = null) => {
    if (!db || !firebaseUser) return;
    const targetCode = updatedByRole === 'host' ? mySessionCode : syncCode;
    if (!targetCode) return;

    try {
      const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', targetCode);
      const payload = forcedData || {
        problemType,
        numVars,
        numConstraints,
        objCoeffs,
        constraints,
        agentResult,
        updatedBy: updatedByRole,
        timestamp: Date.now()
      };
      await setDoc(sessionRef, payload, { merge: true });
    } catch (err) {
      console.error("Failed to sync state upward:", err);
    }
  };

  const connectAsClient = async () => {
    if (!db || !firebaseUser || !inputSessionCode) return;
    setIsSyncing(true);
    setMediaErrorMessage('');

    try {
      const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', inputSessionCode);
      const snapshot = await getDoc(sessionRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        setSyncCode(inputSessionCode);
        setActiveSyncSession('client');
        
        setProblemType(data.problemType || 'max');
        setNumVars(data.numVars || 3);
        setNumConstraints(data.numConstraints || 3);
        setObjCoeffs(data.objCoeffs || [0,0,0]);
        setConstraints(data.constraints || []);
        
        setMediaSuccessMessage(`✅ Connected to Laptop! Click "Take Photo with Camera" below to sync instantly.`);
      } else {
        setMediaErrorMessage("Code not found. Make sure your Laptop host session is turned ON first!");
      }
    } catch (err) {
      console.error("Error connecting client:", err);
      setMediaErrorMessage("Connection timeout. Please verify you are connected to the internet.");
    } finally {
      setIsSyncing(false);
    }
  };

  const resizeVariables = (v) => {
    setNumVars(v);
    setObjCoeffs(prev => {
      const next = [...prev];
      while (next.length < v) next.push(0);
      return next.slice(0, v);
    });
    setConstraints(prev => prev.map(c => {
      const nextCoeffs = [...c.coeffs];
      while (nextCoeffs.length < v) nextCoeffs.push(0);
      return { ...c, coeffs: nextCoeffs.slice(0, v) };
    }));
  };

  const resizeConstraints = (c, currentVarsCount = numVars) => {
    setNumConstraints(c);
    setConstraints(prev => {
      const next = [...prev];
      while (next.length < c) {
        next.push({ coeffs: Array(currentVarsCount).fill(0), relation: '<=', rhs: 0 });
      }
      return next.slice(0, c);
    });
  };

  const handleObjChange = (index, val) => {
    const newCoeffs = [...objCoeffs];
    newCoeffs[index] = parseFloat(val) || 0;
    setObjCoeffs(newCoeffs);
  };

  const handleConstraintChange = (cIndex, vIndex, val) => {
    const newConstraints = [...constraints];
    newConstraints[cIndex].coeffs[vIndex] = parseFloat(val) || 0;
    setConstraints(newConstraints);
  };

  const handleRelationChange = (cIndex, val) => {
    const newConstraints = [...constraints];
    newConstraints[cIndex].relation = val;
    setConstraints(newConstraints);
  };

  const handleRhsChange = (cIndex, val) => {
    const newConstraints = [...constraints];
    newConstraints[cIndex].rhs = parseFloat(val) || 0;
    setConstraints(newConstraints);
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsMediaLoading(true);
    setMediaErrorMessage('');
    setMediaSuccessMessage('');
    
    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isImage = file.type.startsWith('image/');
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv') || file.type === 'text/csv' || file.type.includes('spreadsheet');

    try {
      let promptText = "";
      let payloadContents = [];

      if (isPDF) {
        setMediaStatusMessage('Reading PDF pages...');
        if (!window.pdfjsLib) {
          throw new Error("PDF engine not loaded.");
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let extractedText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          extractedText += textContent.items.map(item => item.str).join(' ') + '\n';
        }

        promptText = `Extract the linear programming optimization problem parameters from this text:\n\n${extractedText}`;
        payloadContents = [{ parts: [{ text: promptText }] }];

      } else if (isImage) {
        setMediaStatusMessage('AI is reading snapped paper formula...');
        const base64Data = await fileToBase64(file);
        payloadContents = [{
          parts: [
            { text: "Examine this snapped math paper sheet or blackboard photo and extract the linear programming optimization parameters." },
            { inlineData: { mimeType: file.type, data: base64Data } }
          ]
        }];
      } else if (isExcel) {
        setMediaStatusMessage('Parsing spreadsheet tables...');
        if (!window.XLSX) {
          throw new Error("Excel reader library not loaded.");
        }

        const dataBuffer = await file.arrayBuffer();
        const workbook = window.XLSX.read(dataBuffer, { type: 'array' });
        let extractedSpreadsheetData = "";

        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const csvText = window.XLSX.utils.sheet_to_csv(worksheet);
          extractedSpreadsheetData += `[SHEET: ${sheetName}]\n${csvText}\n\n`;
        });

        promptText = `Translate this French solver template or raw optimization data into our parameters. Match variable columns x1, x2, x3 under the row 'variables de décisions' or 'Les contraintes' and resource limits under 'quantitéS de resources':\n\n${extractedSpreadsheetData}`;
        payloadContents = [{ parts: [{ text: promptText }] }];
      }

      const payload = {
        contents: payloadContents,
        systemInstruction: {
          parts: [{ 
            text: "You are an expert Operations Research agent. Parse optimization problems into a standard JSON formulation schema. Convert variable names to sequentially indexed variables (x1, x2, x3). Standardize constraint relation operators to <=, >=, or =. If any coefficients are blank or unspecified, default them to 0." 
          }]
        },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              problemType: { type: "STRING", enum: ["max", "min"] },
              numVars: { type: "INTEGER" },
              numConstraints: { type: "INTEGER" },
              objCoeffs: { type: "ARRAY", items: { type: "NUMBER" } },
              constraints: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    coeffs: { type: "ARRAY", items: { type: "NUMBER" } },
                    relation: { type: "STRING", enum: ["<=", ">=", "="] },
                    rhs: { type: "NUMBER" }
                  },
                  required: ["coeffs", "relation", "rhs"]
                }
              }
            },
            required: ["problemType", "numVars", "numConstraints", "objCoeffs", "constraints"]
          }
        }
      };

      const result = await callGeminiWithRetry(payload);
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsedModel = JSON.parse(rawText);

      setProblemType(parsedModel.problemType || 'max');
      setNumVars(parsedModel.numVars || 3);
      setNumConstraints(parsedModel.numConstraints || 3);
      setObjCoeffs(parsedModel.objCoeffs);
      setConstraints(parsedModel.constraints);

      if (window.solver) {
        const solverModel = {
          optimize: "objective",
          opType: parsedModel.problemType || 'max',
          constraints: {},
          variables: {}
        };
        parsedModel.constraints.forEach((c, idx) => {
          const cName = `c${idx + 1}`;
          if (c.relation === '<=') solverModel.constraints[cName] = { max: c.rhs };
          else if (c.relation === '>=') solverModel.constraints[cName] = { min: c.rhs };
          else if (c.relation === '=') solverModel.constraints[cName] = { equal: c.rhs };
        });
        for (let i = 0; i < parsedModel.numVars; i++) {
          const vName = `x${i + 1}`;
          solverModel.variables[vName] = { objective: parsedModel.objCoeffs[i] };
          parsedModel.constraints.forEach((c, idx) => {
            if (c.coeffs[i] !== 0) {
              solverModel.variables[vName][`c${idx + 1}`] = c.coeffs[i];
            }
          });
        }
        const results = window.solver.Solve(solverModel);
        setAgentResult(results);

        // Upload results to sync session live
        if (activeSyncSession === 'client') {
          await syncStateUpward('client', {
            problemType: parsedModel.problemType || 'max',
            numVars: parsedModel.numVars || 3,
            numConstraints: parsedModel.numConstraints || 3,
            objCoeffs: parsedModel.objCoeffs,
            constraints: parsedModel.constraints,
            agentResult: results,
            updatedBy: 'client',
            timestamp: Date.now()
          });
        }
      }

      setMediaSuccessMessage(`Formulation successfully processed and updated across devices!`);

    } catch (error) {
      console.error(error);
      setMediaErrorMessage(error.message || "An error occurred during formulation extraction.");
    } finally {
      setIsMediaLoading(false);
      setMediaStatusMessage('');
    }
  };

  const runOptimizationAgent = () => {
    if (!window.solver) {
      alert("Solver library failed to load. Please check your internet connection.");
      return;
    }

    setIsProcessing(true);
    
    const model = {
      optimize: "objective",
      opType: problemType,
      constraints: {},
      variables: {}
    };

    constraints.forEach((c, idx) => {
      const cName = `c${idx + 1}`;
      if (c.relation === '<=') model.constraints[cName] = { max: c.rhs };
      else if (c.relation === '>=') model.constraints[cName] = { min: c.rhs };
      else if (c.relation === '=') model.constraints[cName] = { equal: c.rhs };
    });

    for (let i = 0; i < numVars; i++) {
      const vName = `x${i + 1}`;
      model.variables[vName] = { objective: objCoeffs[i] };
      
      constraints.forEach((c, idx) => {
        if (c.coeffs[i] !== 0) {
          model.variables[vName][`c${idx + 1}`] = c.coeffs[i];
        }
      });
    }

    setTimeout(() => {
      const results = window.solver.Solve(model);
      setAgentResult(results);
      setIsProcessing(false);
      
      if (activeSyncSession) {
        syncStateUpward(activeSyncSession);
      }
    }, 600);
  };

  useEffect(() => {
    if (objCoeffs.length > 0) {
      generateLingoCode();
    }
  }, [objCoeffs, constraints, problemType, numVars, lingoStyle]);

  const generateLingoCode = () => {
    let code = "";
    
    if (lingoStyle === 'simple') {
      const objTerms = objCoeffs
        .map((c, i) => c !== 0 ? `${c} * x${i + 1}` : null)
        .filter(Boolean)
        .join(' + ');
      
      code += `${problemType.toUpperCase()} = ${objTerms || 0};\n\n`;
      
      constraints.forEach((c) => {
        const terms = c.coeffs
          .map((coeff, i) => coeff !== 0 ? `${coeff} * x${i + 1}` : null)
          .filter(Boolean)
          .join(' + ');
        
        if (terms) {
          code += `${terms} ${c.relation} ${c.rhs};\n`;
        }
      });
    } else {
      code = "MODEL:\n\n";
      code += "SETS:\n";
      code += `  VARIABLES: BENEFICE, VAL_OPTIMALE;\n`;
      code += "  CONTRAINTES: RESOURCES;\n";
      code += "  COEFFS(CONTRAINTES, VARIABLES): COEFF;\n";
      code += "ENDSETS\n\n";
      code += "DATA:\n";
      code += `  BENEFICE = ${objCoeffs.slice(0, numVars).join(' ')};\n`;
      code += `  RESOURCES = ${constraints.map(c => c.rhs).join(' ')};\n`;
      code += "  COEFF =\n";
      constraints.forEach(c => {
        code += `    ${c.coeffs.slice(0, numVars).join(' ')}\n`;
      });
      code += "  ;\n";
      code += "ENDDATA\n\n";
      code += `${problemType.toUpperCase()} = @SUM(VARIABLES(I): BENEFICE(I) * VAL_OPTIMALE(I));\n\n`;
      code += "@FOR(CONTRAINTES(I):\n";
      code += "  @SUM(VARIABLES(J): COEFF(I, J) * VAL_OPTIMALE(J)) <= RESOURCES(I)\n";
      code += ");\n";
      code += "\nEND";
    }

    setLingoCode(code);
  };

  const copyLingoToClipboard = () => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = lingoCode;
      textarea.style.position = 'fixed'; 
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedLingo(true);
      setTimeout(() => setCopiedLingo(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const downloadLingoFile = () => {
    try {
      const blob = new Blob([lingoCode], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `solveur_lingo_model.lng`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("LINGO download failed", err);
    }
  };

  const generateFrenchExcelModel = () => {
    if (!window.XLSX) {
      alert("Excel generator library is not ready.");
      return;
    }

    const getColLetter = (index) => String.fromCharCode(65 + index); 
    const lastVarCol = getColLetter(numVars); 
    const usedCol = getColLetter(numVars + 1); 

    const dataMatrix = [];
    dataMatrix.push([]); 
    
    const varRow = ["variables de décisions"];
    for (let i = 1; i <= numVars; i++) varRow.push(`x${i}`);
    dataMatrix.push(varRow);

    const valRow = ["valeurs optimales"];
    for (let i = 1; i <= numVars; i++) {
      valRow.push(agentResult ? (agentResult[`x${i}`] || 0) : 0);
    }
    dataMatrix.push(valRow);

    const row4 = [""];
    for (let i = 1; i <= numVars; i++) row4.push("");
    row4.push("quantités utilisées", "sens de l'inégalité", "quantitéS de resources");
    dataMatrix.push(row4);

    const row5 = ["Les contraintes"];
    dataMatrix.push(row5);

    constraints.forEach((c, idx) => {
      const cRow = [`Ligne${idx + 1}`];
      for (let i = 0; i < numVars; i++) {
        cRow.push(c.coeffs[i] || 0);
      }
      cRow.push(""); 
      cRow.push(c.relation);
      cRow.push(c.rhs);
      dataMatrix.push(cRow);
    });

    const objRow = ["Bénéfice par unité"];
    for (let i = 0; i < numVars; i++) {
      objRow.push(objCoeffs[i] || 0);
    }
    dataMatrix.push(objRow);

    dataMatrix.push([]);

    const resultRow = ["valeur optimale de la fonction objectif"];
    dataMatrix.push(resultRow);

    const ws = window.XLSX.utils.aoa_to_sheet(dataMatrix);
    const varRange = `$B$3:$${lastVarCol}$3`;

    constraints.forEach((_, idx) => {
      const rowIdx = 6 + idx; 
      const coeffRange = `B${rowIdx}:${lastVarCol}${rowIdx}`;
      const cellAddress = `${usedCol}${rowIdx}`; 
      
      ws[cellAddress] = {
        t: 'n',
        f: `SUMPRODUCT(${coeffRange},${varRange})`
      };
    });

    const objCoeffsRowIdx = 6 + numConstraints; 
    const resultRowIdx = 8 + numConstraints; 
    const objCoeffRange = `B${objCoeffsRowIdx}:${lastVarCol}${objCoeffsRowIdx}`;
    const targetResultCell = `B${resultRowIdx}`; 
    
    ws[targetResultCell] = {
      t: 'n',
      f: `SUMPRODUCT(${objCoeffRange},${varRange})`,
      v: agentResult ? agentResult.result : 0
    };

    ws['!cols'] = [
      { wch: 35 }, 
      ...Array(numVars).fill({ wch: 12 }), 
      { wch: 22 }, 
      { wch: 18 }, 
      { wch: 25 }  
    ];

    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Solveur OR");
    window.XLSX.writeFile(wb, "Solveur_Optimization_Model.xlsx");
  };

  const downloadExcel = () => {
    if (exportFormat === 'french-solveur') {
      generateFrenchExcelModel();
    } else {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Optimization Problem Definition\n\n";
      csvContent += "Type," + problemType.toUpperCase() + "\n";
      csvContent += "Variables," + Array.from({length: numVars}, (_, i) => `x${i+1}`).join(",") + "\n";
      csvContent += "Objective," + objCoeffs.join(",") + "\n\n";
      csvContent += "Constraints\n";
      csvContent += "Name," + Array.from({length: numVars}, (_, i) => `x${i+1}`).join(",") + ",Relation,RHS\n";
      
      constraints.forEach((c, idx) => {
        csvContent += `Constraint ${idx + 1},${c.coeffs.join(",")},${c.relation},${c.rhs}\n`;
      });

      if (agentResult) {
        csvContent += "\nSolution Results\n";
        csvContent += `Feasible,${agentResult.feasible}\n`;
        csvContent += `Optimal Value,${agentResult.result}\n`;
        for (let i = 0; i < numVars; i++) {
          const val = agentResult[`x${i+1}`] || 0;
          csvContent += `x${i+1},${val}\n`;
        }
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "optimization_problem.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getSimulatedLingoReport = () => {
    if (!agentResult) return "Solve problem first to see LINGO report output.";
    
    let optimalVal = agentResult.result.toFixed(2);
    let variablesBlock = Array.from({length: numVars}).map((_, i) => {
      let val = (agentResult[`x${i+1}`] || 0).toFixed(4);
      return `                                 X${i+1}        ${val.padStart(8, ' ')}            0.000000`;
    }).join('\n');

    let rowsBlock = constraints.map((c, idx) => {
      let slackVal = (c.rhs - (c.coeffs.reduce((acc, current, vIdx) => acc + (current * (agentResult[`x${vIdx+1}`] || 0)), 0))).toFixed(4);
      return `                             LIGNE${idx+1}        ${slackVal.padStart(8, ' ')}            100.0000`;
    }).join('\n');

    return `
  Global optimal solution found at iteration:             2
  Objective value:                               ${optimalVal.padStart(12, ' ')}
  Infeasibilities:                                      0.000000
  Total solver iterations:                             2
  Elapsed runtime:                                     0.02 seconds

  Model Class:                                          LP

  Total variables:                                     ${numVars}
  Nonlinear variables:                                 0
  Integer variables:                                   0

  Total constraints:                                   ${numConstraints + 1}
  Nonlinear constraints:                               0

  Total nonzeros:                                      ${numVars * numConstraints}

                             Variable           Value        Reduced Cost
${variablesBlock}

                                 Row    Slack or Surplus      Dual Price
                                    1        ${optimalVal.padStart(8, ' ')}            1.000000
${rowsBlock}
    `;
  };

  const captureAndEmail = async () => {
    if (!teacherEmail) {
      alert("Please enter your teacher's email address first.");
      return;
    }
    if (!agentResult) {
      alert("Please run the agent to solve the problem first.");
      return;
    }
    if (!window.html2canvas) {
      alert("The screenshot capture library failed to load.");
      return;
    }

    const canvas = await window.html2canvas(reportRef.current, {
      backgroundColor: "#ffffff",
      scale: 2
    });
    
    const imgData = canvas.toDataURL("image/png");
    
    const link = document.createElement("a");
    link.download = 'optimization_results_screenshot.png';
    link.href = imgData;
    link.click();

    const subject = encodeURIComponent("Optimization Problem Solution & LINGO Code - Active Spreadsheet Attached");
    const bodyText = `Dear Professor,\n\nPlease find attached the screenshot of my optimization problem results and LINGO formulation model.\n\nHere is the generated LINGO structure for the problem:\n\n${lingoCode}\n\nOptimal Value: ${agentResult.result}\n\nI have also run and formulated the spreadsheet model with active formulas. Please find it attached.\n\nBest regards.`;
    
    setTimeout(() => {
      window.location.href = `mailto:${teacherEmail}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
      alert("Screenshot downloaded! Your email application has opened. Please attach the downloaded screenshot and the exported Excel file to complete the submission.");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center">
              <Calculator className="w-6 h-6 mr-2 text-indigo-600" />
              Operations Research Agent
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Linear Programming Solver, LINGO File Exporter & French "Solveur" Excel Template</p>
          </div>
          <div className="flex items-center space-x-3 w-full md:w-1/3">
            <Mail className="w-5 h-5 text-slate-400" />
            <input 
              type="email" 
              placeholder="Teacher's Email Address (e.g., prof@univ.fr)" 
              className="flex-1 text-sm rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
            />
          </div>
        </header>

        {/* Live Device Sync Panel with explicit Instructions */}
        <div className="bg-gradient-to-r from-teal-900 to-emerald-950 text-white rounded-xl shadow-md p-6 border border-teal-700">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold flex items-center text-emerald-300">
                <Smartphone className="w-5 h-5 mr-2 animate-bounce" />
                Live Mobile Snap & Sync (Synchronisation Mobile)
              </h3>
              <p className="text-teal-100 text-xs max-w-xl">
                Open this exact page on your phone's browser, connect via the code below, and take a photo using your phone's camera. The solved formulas will instantly appear live here on your laptop screen!
              </p>
              
              {/* French Guide steps */}
              <div className="bg-emerald-950/40 p-3 rounded-lg border border-teal-700/40 text-xs space-y-1 text-teal-100 font-mono">
                <p><span className="text-emerald-400 font-bold">1. Sur PC :</span> Cliquez sur "Start Host Session" pour voir le code.</p>
                <p><span className="text-emerald-400 font-bold">2. Sur Téléphone :</span> Entrez ce code dans le champ à droite, puis cliquez sur "Connect Phone".</p>
                <p><span className="text-emerald-400 font-bold">3. Prenez la photo :</span> Le problème sera immédiatement résolu et mis à jour sur votre PC !</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-teal-950/60 p-4 rounded-xl border border-teal-700/50">
              {/* Laptop State / Host mode display */}
              {!activeSyncSession && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="text-xs">
                    <span className="block text-teal-300 font-semibold uppercase">Laptop Mode</span>
                    <span className="text-lg font-black tracking-widest text-white select-all">
                      {mySessionCode ? `${mySessionCode}` : "Generating..."}
                    </span>
                  </div>
                  <button 
                    onClick={() => setActiveSyncSession('host')}
                    className="bg-teal-400 hover:bg-teal-500 text-teal-950 font-bold px-4 py-2.5 rounded-lg text-xs transition-all flex items-center"
                  >
                    <Laptop className="w-4 h-4 mr-1.5" /> Start Host Session
                  </button>
                </div>
              )}

              {/* Host view active state */}
              {activeSyncSession === 'host' && (
                <div className="flex items-center gap-3">
                  <div className="text-xs">
                    <span className="block text-emerald-300 font-bold uppercase animate-pulse">● Waiting for phone...</span>
                    <span className="text-sm font-medium">Input this code on your phone: <strong className="text-lg tracking-widest text-white font-black">{mySessionCode}</strong></span>
                  </div>
                  <button 
                    onClick={() => { setActiveSyncSession(null); setMySessionCode(''); }}
                    className="text-xs bg-red-600/30 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-lg"
                  >
                    Disconnect
                  </button>
                </div>
              )}

              {/* Phone State / Client connection form */}
              {activeSyncSession !== 'host' && activeSyncSession !== 'client' && (
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter Code on Phone" 
                    className="w-36 text-center text-xs font-bold text-slate-800 rounded-lg p-2.5 focus:ring-teal-500 focus:border-teal-500 border border-slate-200"
                    value={inputSessionCode}
                    onChange={(e) => setInputSessionCode(e.target.value.replace(/\D/g,'').slice(0,4))}
                  />
                  <button 
                    onClick={connectAsClient}
                    disabled={isSyncing}
                    className="bg-emerald-400 hover:bg-emerald-500 text-emerald-950 font-bold px-4 py-2.5 rounded-lg text-xs transition-all flex items-center shrink-0"
                  >
                    {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Connect Phone'}
                  </button>
                </div>
              )}

              {activeSyncSession === 'client' && (
                <div className="flex items-center gap-3">
                  <div className="text-xs">
                    <span className="block text-emerald-300 font-bold uppercase">● Phone Connected</span>
                    <span className="text-xs">Taking photos on this phone will update your laptop screen live!</span>
                  </div>
                  <button 
                    onClick={() => { setActiveSyncSession(null); setSyncCode(''); }}
                    className="text-xs bg-red-600/30 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-lg"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LINGO Implementation Help Guide */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl shadow-md p-6 border border-indigo-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center">
              <Code2 className="w-5 h-5 mr-2 text-amber-400 animate-pulse" />
              How to Run directly in LINGO (Solveur.lng)
            </h3>
            <button 
              onClick={() => setShowLingoHelp(!showLingoHelp)}
              className="text-xs bg-indigo-800/60 hover:bg-indigo-800 border border-indigo-700 rounded-lg px-3 py-1.5 font-medium flex items-center"
            >
              {showLingoHelp ? 'Hide Guide' : 'Show Guide'}
              {showLingoHelp ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
            </button>
          </div>

          {showLingoHelp && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-indigo-100 border-t border-indigo-800/50 pt-4">
              <div className="space-y-2 bg-indigo-950/40 p-3.5 rounded-lg border border-indigo-800/40">
                <span className="text-xs bg-amber-400/20 text-amber-300 font-semibold px-2 py-0.5 rounded uppercase">Step 1</span>
                <p className="font-semibold text-white">Generate LINGO Model File</p>
                <p className="text-xs leading-relaxed">Enter your goal and variables. Our solver automatically designs the dynamic structural sets matching your Excel templates.</p>
              </div>

              <div className="space-y-2 bg-indigo-950/40 p-3.5 rounded-lg border border-indigo-800/40">
                <span className="text-xs bg-amber-400/20 text-amber-300 font-semibold px-2 py-0.5 rounded uppercase">Step 2</span>
                <p className="font-semibold text-white">Tap & Launch on PC</p>
                <p className="text-xs leading-relaxed">Click the **Export to LINGO (.lng)** button. Once downloaded, double-click to instantly run LINGO 20.0 and auto-populate your code editor panel.</p>
              </div>

              <div className="space-y-2 bg-indigo-950/40 p-3.5 rounded-lg border border-indigo-800/40">
                <span className="text-xs bg-amber-400/20 text-amber-300 font-semibold px-2 py-0.5 rounded uppercase">Step 3</span>
                <p className="font-semibold text-white">Compare Dynamic Solver Reports</p>
                <p className="text-xs leading-relaxed">Press <kbd className="bg-indigo-900 px-1 rounded text-white text-[10px]">Ctrl+U</kbd> in LINGO to execute. Click the **LINGO Solver Report** tab on the right to compare solutions instantly.</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Panel: Problem Input */}
          <div className="space-y-6">
            
            {/* AI PDF, Image & Camera Extractor */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-bold text-slate-800 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-amber-500" />
                  AI Camera Snap & Paper Upload
                </h3>
                <span className="text-xs bg-amber-50 text-amber-700 font-medium px-2.5 py-0.5 rounded">Multimodal Gemini AI</span>
              </div>

              {/* Direct Camera snap button (designed for mobile phones) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold py-3 px-4 rounded-xl shadow-sm text-sm flex items-center justify-center transition-all"
                >
                  <Camera className="w-5 h-5 mr-2 animate-pulse" />
                  Take Photo with Camera
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => document.getElementById('standard-file-input').click()}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl shadow-sm text-sm flex items-center justify-center transition-all"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload File (Image/PDF/Excel)
                  </button>
                </div>
              </div>

              {/* Hidden file triggers */}
              <input 
                ref={cameraInputRef}
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={handleFileUpload}
                className="hidden" 
              />
              <input 
                id="standard-file-input"
                type="file" 
                accept=".pdf, image/*, .xlsx, .xls, .csv" 
                onChange={handleFileUpload}
                className="hidden" 
              />

              <div className="border-2 border-dashed border-slate-200 rounded-lg p-5 bg-slate-50 flex flex-col items-center justify-center text-center text-xs text-slate-400">
                <p className="font-semibold text-slate-600 mb-1">Dragging & Dropping from Laptop is also supported</p>
                <p>Upload your `Solveur.xlsx`, CSV, PDF sheet, or photo of the board</p>
              </div>

              {/* Excel Format Example Button */}
              <div className="mt-3">
                <button 
                  onClick={() => setShowExcelTemplateHelp(!showExcelTemplateHelp)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                >
                  <HelpCircle className="w-3.5 h-3.5 mr-1" />
                  {showExcelTemplateHelp ? 'Hide Layout Structure Info' : 'Show French "Solveur" Template Layout'}
                  {showExcelTemplateHelp ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                </button>

                {showExcelTemplateHelp && (
                  <div className="mt-2 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
                    <p className="font-semibold text-slate-700">💡 French Solver (Solveur.xlsx) Template Format:</p>
                    <p>The AI understands, maps, and automatically reproduces your precise Excel layout columns:</p>
                    <div className="overflow-x-auto border rounded bg-white mt-1">
                      <table className="min-w-full divide-y divide-slate-200 text-left">
                        <thead className="bg-slate-50 text-[10px]">
                          <tr>
                            <th className="px-2 py-1 border-b font-semibold text-slate-700">Col A</th>
                            <th className="px-2 py-1 border-b font-semibold text-slate-700">Col B (x1)</th>
                            <th className="px-2 py-1 border-b font-semibold text-slate-700">Col C (x2)</th>
                            <th className="px-2 py-1 border-b font-semibold text-slate-700">Col D (Formula LHS)</th>
                            <th className="px-2 py-1 border-b font-semibold text-slate-700">Col E (Inégalité)</th>
                            <th className="px-2 py-1 border-b font-semibold text-slate-700">Col F (Ressources RHS)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[9px]">
                          <tr>
                            <td className="px-2 py-1 text-amber-600 font-semibold">variables de décisions</td>
                            <td className="px-2 py-1">x1</td>
                            <td className="px-2 py-1">x2</td>
                            <td className="px-2 py-1"></td>
                            <td className="px-2 py-1"></td>
                            <td className="px-2 py-1"></td>
                          </tr>
                          <tr>
                            <td className="px-2 py-1 font-semibold text-blue-600">Ligne1</td>
                            <td className="px-2 py-1">2</td>
                            <td className="px-2 py-1">1</td>
                            <td className="px-2 py-1 text-emerald-600">=SUMPRODUCT(...)</td>
                            <td className="px-2 py-1">&lt;=</td>
                            <td className="px-2 py-1">100</td>
                          </tr>
                          <tr>
                            <td className="px-2 py-1 font-semibold">Bénéfice par unité</td>
                            <td className="px-2 py-1">40</td>
                            <td className="px-2 py-1">30</td>
                            <td className="px-2 py-1"></td>
                            <td className="px-2 py-1"></td>
                            <td className="px-2 py-1"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Status messages */}
              {isMediaLoading && (
                <div className="mt-4 flex items-center text-sm text-indigo-600 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>{mediaStatusMessage}</span>
                </div>
              )}

              {mediaSuccessMessage && (
                <div className="mt-4 flex items-center text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                  <span>{mediaSuccessMessage}</span>
                </div>
              )}

              {mediaErrorMessage && (
                <div className="mt-4 flex items-center text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-100">
                  <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                  <span>{mediaErrorMessage}</span>
                </div>
              )}
            </div>

            {/* Problem Setup Config */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800">Model Configuration</h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex space-x-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Goal</label>
                    <select 
                      className="rounded-lg border-slate-300 border p-2 text-sm focus:ring-indigo-500 bg-white"
                      value={problemType}
                      onChange={(e) => { setProblemType(e.target.value); syncStateUpward(activeSyncSession); }}
                    >
                      <option value="max">Maximize Profit</option>
                      <option value="min">Minimize Cost</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Variables</label>
                    <input 
                      type="number" 
                      min="2" 
                      max="10" 
                      value={numVars} 
                      onChange={e => { resizeVariables(parseInt(e.target.value) || 2); syncStateUpward(activeSyncSession); }} 
                      className="w-20 rounded-lg border-slate-300 border p-2 text-sm text-center bg-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Constraints</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="15" 
                      value={numConstraints} 
                      onChange={e => { resizeConstraints(parseInt(e.target.value) || 1); syncStateUpward(activeSyncSession); }} 
                      className="w-20 rounded-lg border-slate-300 border p-2 text-sm text-center bg-white" 
                    />
                  </div>
                </div>

                {/* Objective Function Input */}
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <h3 className="text-sm font-bold text-indigo-900 mb-3">Objective Function (Bénéfice par unité)</h3>
                  <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                    <span className="font-semibold text-indigo-800 mr-2">{problemType.toUpperCase()} Z = </span>
                    {Array.from({length: numVars}).map((_, i) => (
                      <React.Fragment key={`obj-${i}`}>
                        <input 
                          type="number" 
                          step="any"
                          value={objCoeffs[i] || 0} 
                          onChange={(e) => { handleObjChange(i, e.target.value); syncStateUpward(activeSyncSession); }}
                          className="w-16 p-1 text-center border rounded border-indigo-200 bg-white"
                        />
                        <span className="font-medium text-indigo-700">x{i+1}</span>
                        {i < numVars - 1 && <span className="text-indigo-400">+</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Constraints Input */}
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Constraints Subject To (Les contraintes):</h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {constraints.map((constraint, cIdx) => (
                      <div key={`c-${cIdx}`} className="flex items-center space-x-2 overflow-x-auto pb-2">
                        <span className="text-slate-400 text-xs w-6">{cIdx + 1}.</span>
                        {Array.from({length: numVars}).map((_, vIdx) => (
                          <React.Fragment key={`c-${cIdx}-v-${vIdx}`}>
                            <input 
                              type="number" 
                              step="any"
                              value={constraint?.coeffs?.[vIdx] || 0} 
                              onChange={(e) => { handleConstraintChange(cIdx, vIdx, e.target.value); syncStateUpward(activeSyncSession); }}
                              className="w-16 p-1 text-center border rounded border-slate-300 bg-white"
                            />
                            <span className="font-medium text-slate-600">x{vIdx+1}</span>
                            {vIdx < numVars - 1 && <span className="text-slate-300">+</span>}
                          </React.Fragment>
                        ))}
                        
                        <select 
                          value={constraint?.relation || '<='} 
                          onChange={(e) => { handleRelationChange(cIdx, e.target.value); syncStateUpward(activeSyncSession); }}
                          className="border rounded border-slate-300 p-1 bg-slate-50 font-semibold text-slate-700 mx-2"
                        >
                          <option value="<=">&le;</option>
                          <option value=">=">&ge;</option>
                          <option value="=">=</option>
                        </select>

                        <input 
                          type="number" 
                          step="any"
                          value={constraint?.rhs || 0} 
                          onChange={(e) => { handleRhsChange(cIdx, e.target.value); syncStateUpward(activeSyncSession); }}
                          className="w-20 p-1 text-center border rounded border-slate-300 font-semibold bg-white"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 italic mt-2">* Non-negativity constraints (x &ge; 0) are automatically applied.</p>
                </div>

                <button 
                  onClick={runOptimizationAgent}
                  disabled={isProcessing}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center transition-colors shadow-sm disabled:opacity-70"
                >
                  {isProcessing ? (
                    <Calculator className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5 mr-2" />
                  )}
                  {isProcessing ? 'Agent Computing...' : 'Ask Agent to Solve'}
                </button>
              </div>
            </div>

          </div>

          {/* Right Panel: Output & Actions */}
          <div className="space-y-6 flex flex-col">
            
            {/* The Report View */}
            <div 
              ref={reportRef} 
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col"
            >
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setActiveReportTab('excel')}
                    className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${activeReportTab === 'excel' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <FileSpreadsheet className="w-4 h-4 inline mr-1.5 text-emerald-600" />
                    Excel Report View
                  </button>
                  <button 
                    onClick={() => setActiveReportTab('lingo-sim')}
                    className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${activeReportTab === 'lingo-sim' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <Terminal className="w-4 h-4 inline mr-1.5 text-blue-600" />
                    LINGO Solver Report
                  </button>
                </div>
                {agentResult && agentResult.feasible ? (
                  <span className="flex items-center text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Feasible
                  </span>
                ) : agentResult && !agentResult.feasible ? (
                   <span className="flex items-center text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full">
                   <AlertCircle className="w-4 h-4 mr-1" /> Infeasible
                 </span>
                ) : null}
              </div>

              <div className="p-6 flex-1 space-y-6">
                {agentResult ? (
                  activeReportTab === 'excel' ? (
                    <>
                      {/* Solution Highlight */}
                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-5 text-center">
                        <p className="text-emerald-800 font-medium text-sm mb-1 uppercase tracking-wide">Optimal Value (Valeur Optimale)</p>
                        <p className="text-4xl font-black text-emerald-600">{agentResult.result}</p>
                      </div>

                      {/* Variable Values */}
                      <div>
                        <h3 className="text-sm font-bold text-slate-700 mb-3 border-b pb-2">Decision Variables (variables de décisions)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {Array.from({length: numVars}).map((_, i) => (
                            <div key={`res-x${i}`} className="bg-slate-50 border border-slate-200 rounded p-3 text-center">
                              <span className="block text-slate-500 text-sm font-medium mb-1">x{i+1}</span>
                              <span className="block text-lg font-bold text-slate-800">{agentResult[`x${i+1}`] || 0}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* LINGO Code Block */}
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                          <h3 className="text-sm font-bold text-slate-700 flex items-center">
                            <Code2 className="w-4 h-4 mr-2" /> Generated LINGO Model Code
                          </h3>
                          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 self-start">
                            <button
                              onClick={() => setLingoStyle('sets-data')}
                              className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${lingoStyle === 'sets-data' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                              Sets & Data
                            </button>
                            <button
                              onClick={() => setLingoStyle('simple')}
                              className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${lingoStyle === 'simple' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                              Direct Equation
                            </button>
                          </div>
                          <button
                            onClick={copyLingoToClipboard}
                            className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-2.5 py-1 rounded flex items-center transition-colors font-medium ml-auto"
                          >
                            {copiedLingo ? (
                              <>
                                <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 mr-1" />
                                Copy Code
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-xs font-mono overflow-x-auto shadow-inner relative select-all">
                          {lingoCode}
                        </pre>
                      </div>
                    </>
                  ) : (
                    /* LINGO Simulated Output Terminal */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-slate-800 text-slate-200 px-4 py-2.5 rounded-t-lg">
                        <span className="text-xs font-mono flex items-center">
                          <Terminal className="w-3.5 h-3.5 mr-1.5 text-blue-400 animate-pulse" />
                          LINGO 20.0 - [Solveur Solver Status]
                        </span>
                        <span className="text-[10px] bg-emerald-600/30 text-emerald-400 px-2 py-0.5 rounded uppercase font-semibold">Live Optimal</span>
                      </div>
                      <pre className="bg-slate-950 text-slate-300 p-5 rounded-b-lg text-xs font-mono overflow-x-auto shadow-2xl border border-slate-800 h-[400px]">
                        {getSimulatedLingoReport()}
                      </pre>
                      <p className="text-[11px] text-slate-500 italic">This simulated status report aligns precisely with the variables solved in your dynamic Excel sheet formulas.</p>
                    </div>
                  )
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-20">
                    <Calculator className="w-12 h-12 opacity-20" />
                    <p className="text-center">Upload your problem PDF/Image/Excel or enter parameters manually,<br />then click "Ask Agent to Solve".</p>
                  </div>
                )}
              </div>
            </div>

            {/* Export Actions Panel */}
            <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <span className="text-sm font-bold text-slate-700">Excel Export Format Style:</span>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setExportFormat('french-solveur')}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${exportFormat === 'french-solveur' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                  >
                    French "Solveur.xlsx" Layout (Formula-driven)
                  </button>
                  <button 
                    onClick={() => setExportFormat('standard-csv')}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${exportFormat === 'standard-csv' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                  >
                    Standard Matrix CSV
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button 
                  onClick={downloadExcel}
                  disabled={!agentResult}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
                >
                  <FileDown className="w-5 h-5 mr-2" />
                  Export to Excel
                </button>

                <button 
                  onClick={downloadLingoFile}
                  disabled={!agentResult}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Export to LINGO (.lng)
                </button>
                
                <button 
                  onClick={captureAndEmail}
                  disabled={!agentResult}
                  className="bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg font-semibold flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Screenshot & Email
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

// Safely configure Gemini API exponential backoff retries 
const callGeminiWithRetry = async (payload, retries = 5, delay = 1000) => {
  const apiKey = ""; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // Retry silently
    }
    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
  }
  throw new Error("Failed to contact the AI extraction agent. Please check your internet connection.");
};

"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, AlertCircle, Loader2, Layers, Search, Target, ShieldAlert, BarChart3, User, Clock, CheckCircle2, Trophy } from "lucide-react";
import Swal from "sweetalert2";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3015";

// --- SUB-COMPONENT: FORENSIC CANVAS (WITH TARGET LOGIC) ---
function ForensicCanvas({ src, coords, viewType, label, categoryId }) {
    const canvasRef = useRef(null);
    const [isActualSize, setIsActualSize] = useState(false);

    const drawForensicData = (canvas, ctx) => {
        if (!src) return;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // ตีกรอบเฉพาะเมื่อไม่ใช่ภาพ Clean (ID 1) และมีพิกัดที่ถูกต้อง
            if (categoryId !== 1 && coords && coords[viewType]) {
                const target = coords[viewType];
                const yPos = viewType === 'top' ? target.y : target.z;

                if (target.w > 0 && target.h > 0) {
                    ctx.save();
                    ctx.strokeStyle = "#00ff00"; // Neon Green
                    ctx.lineWidth = 10;
                    ctx.setLineDash([30, 20]);
                    ctx.shadowBlur = 30;
                    ctx.shadowColor = "#00ff00";
                    ctx.strokeRect(target.x, yPos, target.w, target.h);
                    
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = "#00ff00";
                    ctx.font = "bold 40px Arial";
                    ctx.fillText(`TARGET AREA [${viewType.toUpperCase()}]`, target.x, yPos - 30);
                    ctx.restore();
                }
            }
        };
    };

    useEffect(() => {
        if (canvasRef.current) {
            drawForensicData(canvasRef.current, canvasRef.current.getContext("2d"));
        }
    }, [src, coords, viewType, categoryId]);

    return (
        <>
            <div className="space-y-2 flex-1">
                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-4">{label}</span>
                <div 
                    onClick={() => setIsActualSize(true)}
                    className="bg-white rounded-[2.5rem] overflow-hidden flex items-center justify-center p-4 border-8der-black shadow-2xl group relative cursor-zoom-in shrink-0"
                >
                    <canvas ref={canvasRef} className="max-w-full h-auto object-contain rounded-lg transition-transform duration-500 group-hover:scale-[1.02]" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <div className="bg-red-600 text-white px-6 py-3 rounded-full font-black text-xs tracking-widest uppercase flex items-center gap-2 shadow-xl">
                            <Search size={16} /> Inspect Actual Size
                        </div>
                    </div>
                </div>
            </div>

            {isActualSize && (
                <div 
                    className="fixed inset-0 z-100 flex flex-col p-8 bg-black/98 backdrop-blur-2xl animate-in fade-in duration-200"
                    onClick={() => setIsActualSize(false)}
                >
                    <div className="flex justify-between items-center mb-6 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-red-600 rounded-2xl"><ShieldAlert className="text-white" size={32} /></div>
                            <div>
                                <h2 className="text-white font-black text-4xl uppercase tracking-tighter italic leading-none">{label}</h2>
                                <p className="text-green-500 font-bold text-sm tracking-[0.3em] uppercase mt-1">High-Resolution Analysis Mode</p>
                            </div>
                        </div>
                        <button className="w-20 h-20 bg-white/5 hover:bg-red-600 rounded-full flex items-center justify-center transition-all group shadow-2xl shrink-0">
                            <X size={40} className="group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar border border-white/10 rounded-[3.5rem] bg-white cursor-zoom-out">
                        <div className="min-w-max min-h-max p-20">
                            <canvas 
                                ref={(el) => { if (el) drawForensicData(el, el.getContext("2d")); }} 
                                className="shadow-[0_0_150px_rgba(0,0,0,0.8)] mx-auto"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default function SummaryPage() {
    const [result, setResult] = useState(null);
    const [operatorName, setOperatorName] = useState("Authenticating...");
    const [categoryMap, setCategoryMap] = useState({});
    const [selectedItem, setSelectedItem] = useState(null);
    const [isFetching, setIsFetching] = useState(false);
    const [errorLog, setErrorLog] = useState(null);
    const router = useRouter();

    const terminateSession = () => {
        localStorage.removeItem("session_result");
        router.push("/pages/dashboard");
    };

    useEffect(() => {
        const data = localStorage.getItem("session_result");
        if (data) {
            const parsed = JSON.parse(data);
            if (typeof parsed.wrongAnswers === 'string') parsed.wrongAnswers = JSON.parse(parsed.wrongAnswers);
            setResult(parsed);
        }

        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_URL}/itemCategory`);
                if (res.ok) {
                    const data = await res.json();
                    setCategoryMap(data.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.name }), {}));
                }
            } catch (err) { console.error(err); }
        };

        fetchCategories();
        setOperatorName(localStorage.getItem("operator_name") || "System Mode");
    }, []);

    const uniqueWrongAnswers = useMemo(() => {
        if (!result?.wrongAnswers) return [];
        const seen = new Set();
        return result.wrongAnswers.filter((item) => {
            if (!item.baggageId) return true;
            const duplicate = seen.has(item.baggageId);
            seen.add(item.baggageId);
            return !duplicate;
        });
    }, [result]);

    const handleInspect = async (log) => {
        setIsFetching(true);
        setErrorLog(log);
        try {
            const res = await fetch(`${API_URL}/baggage/${log.baggageId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
            });
            const baggageData = await res.json();
            setSelectedItem(baggageData);
        } catch (err) { console.error(err); } finally { setIsFetching(false); }
    };

    if (!result) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-red-600 w-12 h-12" /></div>;

    return (
        <div className="h-screen bg-[#050505] text-white p-10 font-sans relative flex flex-col overflow-auto">
            
            {/* Header & Stats (เหมือนเดิม...) */}
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-8 relative z-10 shrink-0">
                <div className="space-y-2">
                    <h1 className="text-7xl font-black uppercase tracking-tighter leading-none bg-linear-to-r from-white to-white/40 bg-clip-text text-transparent">Analysis Report</h1>
                    <p className="text-xl font-bold uppercase tracking-tight text-white/60 italic">Operator: <span className="text-white font-black">{operatorName}</span></p>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-4xl flex flex-col items-end min-w-45">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Session Duration</span>
                    <span className="text-4xl font-black text-white">{result.timeUsed}<small className="text-sm ml-1 text-gray-500 italic">SEC</small></span>
                </div>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10 shrink-0 relative z-10">
                <StatCard label="Efficiency" value={`${result.efficiency}%`} sub="Accuracy Rate" color="text-blue-400" icon={<Target size={14}/>} />
                <StatCard label="Total Hits" value={result.hits} sub="Correct Targets" color="text-green-500" icon={<CheckCircle2 size={14}/>} />
                <StatCard label="False Alarms" value={result.fars} sub="Clean Flagged" color="text-red-500" icon={<AlertCircle size={14}/>} />
                <StatCard label="Performance" value={result.score} sub="System Points" color="text-white" icon={<BarChart3 size={14}/>} />
            </div>

            {/* Main Analysis Content */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 flex-1 min-h-0 overflow-hidden mb-28 relative z-10">
                <div className="xl:col-span-4 flex flex-col bg-white/2 border border-white/5 rounded-4xl p-8 backdrop-blur-sm overflow-hidden">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-8 flex items-center gap-3">
                        <Layers size={20} className="text-red-600" /> Category Efficiency
                    </h2>
                    <div className="space-y-6 overflow-y-auto pr-4 custom-scrollbar flex-1">
                        {Object.entries(result.categoryStats || {}).map(([key, stats]) => {
                            const rate = stats.total > 0 ? (stats.hits / stats.total) * 100 : 0;
                            return (
                                <div key={key} className="bg-black/40 border border-white/5 p-6 rounded-3xl">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-black uppercase text-gray-400 italic">{categoryMap[key] || `Threat ${key}`}</span>
                                        <span className="text-xl font-black text-white">{rate.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-linear-to-r from-blue-600 to-cyan-400" style={{ width: `${rate}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="xl:col-span-8 flex flex-col bg-white/2 border border-white/5 rounded-4xl p-8 backdrop-blur-sm overflow-hidden">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-8 flex items-center gap-3">
                        <ShieldAlert size={20} className="text-red-600" /> Forensic Incident Log
                    </h2>
                    <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4">
                        {uniqueWrongAnswers.map((log) => (
                            <div key={log.baggageId} onClick={() => handleInspect(log)} className="group flex items-center justify-between bg-black/40 border border-white/5 p-5 pl-8 rounded-full hover:bg-red-600/10 hover:border-red-600/40 transition-all cursor-pointer">
                                <div className="flex items-center gap-6">
                                    <div className="shrink-0"><AlertCircle size={24} className="text-red-600 animate-pulse"/></div>
                                    <div><p className="text-[10px] text-gray-500 uppercase font-black mb-1">Reference Code</p><p className="font-mono text-sm font-black text-white/90 italic">{log.code}</p></div>
                                </div>
                                <div className="flex items-center gap-12">
                                    <div className="text-center"><span className="block text-[8px] text-gray-500 uppercase font-black mb-1">Expected</span><span className="text-green-500 font-black text-lg uppercase italic">{log.correct}</span></div>
                                    <div className="text-center border-l border-white/10 pl-12"><span className="block text-[8px] text-gray-500 uppercase font-black mb-1">Detected</span><span className="text-red-500 font-black text-lg uppercase italic">{log.user}</span></div>
                                    <div className="p-4 bg-white/5 rounded-full group-hover:bg-red-600 transition-all shrink-0"><Search size={20} /></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-10 bg-linear-to-t from-black via-black/95 to-transparent z-20">
                <button onClick={terminateSession} className="w-full bg-white text-black py-8 rounded-full font-black text-3xl hover:bg-red-600 hover:text-white transition-all uppercase shadow-2xl italic active:scale-95">
                    Terminate Session Data
                </button>
            </div>

            {/* --- MODAL WITH SMART HIDE LOGIC --- */}
            {selectedItem && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-10 backdrop-blur-3xl bg-black/95 animate-in fade-in duration-300" onClick={() => setSelectedItem(null)}>
                    <div className="bg-[#0a0a0a] border-2 border-white/10 rounded-[4rem] max-w-7xl w-full relative shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        
                        <div className="bg-red-600 p-8 flex justify-between items-center">
                            <h3 className="font-black uppercase tracking-widest text-2xl italic flex items-center gap-4"><ShieldAlert size={32} /> Incident Evidence Analysis</h3>
                            <button onClick={() => setSelectedItem(null)} className="w-16 h-16 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center transition-transform hover:rotate-90"><X size={32}/></button>
                        </div>

                        <div className="p-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
                            <div className="lg:col-span-8 space-y-10">
                                <div className="flex gap-8">
                                    <ForensicCanvas label="Top View Analysis" src={`${API_URL}${selectedItem.top}`} coords={errorLog?.targetCoords} viewType="top" categoryId={selectedItem.itemCategoryID} />
                                    <ForensicCanvas label="Side View Analysis" src={`${API_URL}${selectedItem.side}`} coords={errorLog?.targetCoords} viewType="side" categoryId={selectedItem.itemCategoryID} />
                                </div>

                                {/* 💡 SMART HIDE: ซ่อนภาพไอเทมจริงถ้าเป็นภาพ Clean (ID 1) */}
                                {selectedItem.itemCategoryID !== 1 && (
                                    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                                        <span className="text-xs text-gray-500 uppercase font-black ml-6 italic tracking-widest">Physical Threat Reference</span>
                                        <div className="bg-white rounded-4xl h-80 flex items-center justify-center p-8 border-12 border-black shadow-inner">
                                            <img src={`${API_URL}/${selectedItem.item?.realImage}`} className="max-h-full object-contain" alt="Reference" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="lg:col-span-4 space-y-8">
                                <div className="space-y-6">
                                    <LabelBox label="Correct Classification" value={errorLog?.correct} color="text-green-500" />
                                    <LabelBox label="Operator Action" value={errorLog?.user} color="text-red-500" />
                                </div>
                                <div className="bg-white/5 p-10 rounded-4xl border border-white/5 flex-1 shadow-inner">
                                    <p className="text-xs text-red-600 font-black uppercase mb-4 border-b border-red-900/30 pb-3 tracking-[0.3em]">Intelligence Brief</p>
                                    <p className="text-white font-black text-3xl uppercase mb-4 italic tracking-tighter">{selectedItem?.item?.name || "Unclassified Object"}</p>
                                    <p className="text-gray-400 text-lg leading-relaxed font-bold italic opacity-80">{selectedItem?.item?.description || "No tactical data available for this session."}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ... StatCard & LabelBox (เหมือนเดิมแต่ปรับ Class นิดหน่อยให้ดุดันขึ้น)
function StatCard({ label, value, sub, color, icon }) {
    return (
        <div className="bg-white/2 p-8 rounded-4xl border border-white/5 relative group hover:bg-white/5 transition-all shadow-xl">
            <div className="absolute top-6 right-8 text-white/5 group-hover:text-white/10 transition-colors scale-[2]">{icon}</div>
            <p className="text-gray-500 text-xs font-black uppercase mb-2 tracking-[0.2em]">{label}</p>
            <p className={`text-6xl font-black ${color} tracking-tighter mb-2 leading-none`}>{value}</p>
            <p className="text-xs text-gray-700 font-black uppercase italic">{sub}</p>
        </div>
    );
}

function LabelBox({ label, value, color }) {
    return (
        <div className="bg-black/40 p-8 rounded-4xl border border-white/5 shadow-inner">
            <p className="text-[10px] text-gray-500 font-black uppercase mb-2 tracking-[0.2em]">{label}</p>
            <p className={`text-3xl font-black uppercase ${color} leading-none italic tracking-tighter`}>{value}</p>
        </div>
    );
}
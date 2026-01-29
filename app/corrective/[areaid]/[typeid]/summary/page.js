"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, AlertCircle, Loader2, Layers, Search, Target, ShieldAlert, BarChart3, User, Clock, CheckCircle2, Trophy } from "lucide-react";
import Swal from "sweetalert2";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3015";

export default function SummaryPage() {
    const [result, setResult] = useState(null);
    const [operatorName, setOperatorName] = useState("Authenticating...");
    const [categoryMap, setCategoryMap] = useState({}); // 🚀 Stores ID -> Name mapping
    const [selectedItem, setSelectedItem] = useState(null);
    const [isFetching, setIsFetching] = useState(false);
    const [errorLog, setErrorLog] = useState(null);
    const router = useRouter();

    const parseJwt = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(window.atob(base64));
        } catch (e) { return null; }
    };

    const terminateSession = () => {
        localStorage.removeItem("session_result");
        router.push("/pages/dashboard");
    };

    useEffect(() => {
        // 1. Load Session Result
        const data = localStorage.getItem("session_result");
        if (data) {
            const parsed = JSON.parse(data);
            if (typeof parsed.wrongAnswers === 'string') {
                parsed.wrongAnswers = JSON.parse(parsed.wrongAnswers);
            }
            setResult(parsed);
        }

        // 2. Fetch Category Names from API 🚀
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_URL}/itemCategory`);
                if (res.ok) {
                    const data = await res.json();
                    // Convert array to object: { 1: "Clear", 2: "IED", ... }
                    const mapping = data.reduce((acc, cat) => {
                        acc[cat.id] = cat.name;
                        return acc;
                    }, {});
                    setCategoryMap(mapping);
                }
            } catch (err) {
                console.error("Category Fetch Error:", err);
            }
        };

        // 3. Fetch Operator Info
        const fetchOperator = async () => {
            const token = localStorage.getItem("token");
            if (!token) return setOperatorName("No Session Found");
            const decoded = parseJwt(token);
            try {
                const res = await fetch(`${API_URL}/auth/users/${decoded.userID}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const userData = await res.json();
                    setOperatorName(`${userData.prefix || ""}${userData.firstName} ${userData.lastName}`);
                }
            } catch (err) { setOperatorName("Offline Mode"); }
        };

        fetchCategories();
        fetchOperator();
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

    const showCriteria = () => {
        const currentEff = parseFloat(result?.efficiency || 0);
        const getTierClass = (min, max) => currentEff >= min && (max ? currentEff <= max : true) ? 'bg-blue-600/30 border-blue-500 animate-pulse' : 'border-white/5';
        
        Swal.fire({
            title: '<span class="text-red-600 uppercase font-black tracking-widest">Time Credit Criteria</span>',
            html: `
            <div class="text-left font-sans text-xl space-y-4 p-6 text-gray-300 border border-white/20 rounded-[2rem] bg-black/80 backdrop-blur-md shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                <table class="w-full border-separate border-spacing-y-2">
                    <thead>
                        <tr class="text-gray-500 uppercase text-xs tracking-widest">
                            <th class="pb-4 text-left px-4">Accuracy</th>
                            <th class="pb-4 text-right px-4">Credit</th>
                        </tr>
                    </thead>
                    <tbody class="text-xl font-black">
                        <tr class="rounded-xl border ${getTierClass(81, 100)}"><td class="py-4 px-4 text-blue-400">&gt; 80%</td><td class="py-4 px-4 text-right">20 Min</td></tr>
                        <tr class="rounded-xl border ${getTierClass(71, 80)}"><td class="py-4 px-4 text-blue-400">71% - 80%</td><td class="py-4 px-4 text-right">16 Min</td></tr>
                        <tr class="rounded-xl border ${getTierClass(61, 70)}"><td class="py-4 px-4 text-blue-400">61% - 70%</td><td class="py-4 px-4 text-right">14 Min</td></tr>
                        <tr class="rounded-xl border ${getTierClass(50, 60)}"><td class="py-4 px-4 text-blue-400">50% - 60%</td><td class="py-4 px-4 text-right">12 Min</td></tr>
                        <tr class="rounded-xl border ${getTierClass(0, 49)}"><td class="py-4 px-4 text-red-600">&lt; 50%</td><td class="py-4 px-4 text-right text-gray-600">0 Min</td></tr>
                    </tbody>
                </table>
            </div>
            `,
            confirmButtonText: 'ACKNOWLEDGE',
            confirmButtonColor: '#dc2626',
            background: '#0a0a0a',
            color: '#fff',
            customClass: { popup: 'rounded-[3rem] border border-white/10 shadow-2xl' }
        });
    };

    if (!result) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-red-600 w-12 h-12" /></div>;

    return (
        <div className="h-screen bg-[#050505] text-white p-6 md:p-10 font-sans relative flex flex-col overflow-hidden selection:bg-red-600/30">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

            {/* --- HEADER --- */}
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-8 gap-6 shrink-0 relative z-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-red-600 mb-2">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
                        <span className="text-xs font-black uppercase tracking-[0.3em]">System Verified</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Analysis Report</h1>
                    <div className="flex items-center gap-4 pt-2">
                        <div className="p-2 bg-white/5 rounded-full border border-white/10"><User size={20} className="text-red-500" /></div>
                        <p className="text-xl font-bold uppercase tracking-tight text-white/80">Operator: <span className="text-white">{operatorName}</span></p>
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-3xl flex flex-col items-end min-w-[140px]">
                        <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Duration</span>
                        <span className="text-3xl font-black text-white">{result.timeUsed}<small className="text-sm ml-1 text-gray-500">S</small></span>
                    </div>
                    <button onClick={showCriteria} className="group bg-red-600 hover:bg-red-700 transition-all px-6 rounded-3xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-red-600/20 active:scale-[0.98]">
                        <Trophy size={20} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[14px] font-black uppercase ">Criteria</span>
                    </button>
                </div>
            </header>

            {/* --- GLOBAL STATS --- */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0 relative z-10">
                <StatCard label="Hits Rate" value={`${result.efficiency}%`} sub="Overall Accuracy" color="text-blue-400" icon={<Target size={14}/>} />
                <StatCard label="Total Hits" value={result.hits} sub="Threats Identified" color="text-green-500" icon={<CheckCircle2 size={14}/>} />
                <StatCard label="False Alarms" value={result.fars} sub="Clean Flagged" color="text-red-500" icon={<AlertCircle size={14}/>} />
                <StatCard label="Final Score" value={result.score} sub="Performance Points" color="text-white" icon={<BarChart3 size={14}/>} />
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden mb-28 relative z-10">
                
                {/* CATEGORY PERFORMANCE */}
                <div className="xl:col-span-4 flex flex-col min-h-0 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-6 shrink-0">
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                            <Layers size={16} className="text-red-600" /> Performance by Type
                        </h2>
                    </div>
                    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                        {Object.entries(result.categoryStats || {}).map(([key, stats]) => {
                            const hitRate = stats.total > 0 ? (stats.hits / stats.total) * 100 : 0;
                            // 🚀 Use the mapped Name instead of the ID
                            const categoryDisplayName = categoryMap[key] || `Threat Class ${key}`;
                            
                            return (
                                <div key={key} className="bg-black/40 border border-white/5 p-5 rounded-[1.8rem] group hover:border-red-600/30 transition-all">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs font-black uppercase text-gray-400 ">{categoryDisplayName}</span>
                                        <span className="text-lg font-black text-white">{hitRate.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                                        <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000" style={{ width: `${hitRate}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        <span>Detected: <span className="text-green-500">{stats.hits}</span></span>
                                        <span>Missed: <span className="text-red-500">{stats.total - stats.hits}</span></span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* FORENSIC LOGS */}
                <div className="xl:col-span-8 flex flex-col min-h-0 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-sm">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2 mb-6 shrink-0">
                        <ShieldAlert size={16} className="text-red-600" /> Forensic Logs
                        <span className="ml-auto bg-red-600 text-[10px] px-3 py-1 rounded-full text-white">{uniqueWrongAnswers.length} Entries</span>
                    </h2>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                        {uniqueWrongAnswers.length > 0 ? uniqueWrongAnswers.map((log) => (
                            <div key={log.baggageId} onClick={() => handleInspect(log)} className="group flex items-center justify-between bg-black/40 border border-white/5 p-4 pl-6 rounded-full hover:bg-red-600/10 hover:border-red-600/40 transition-all cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-red-600/10 rounded-full text-red-500"><AlertCircle size={16}/></div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-black leading-none mb-1">Reference ID</p>
                                        <p className="font-mono text-xs font-bold text-white/90">{log.code}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-center">
                                        <span className="block text-[8px] text-gray-500 uppercase font-black mb-1">Expected</span>
                                        <span className="text-green-500 font-black text-sm uppercase">{log.correct}</span>
                                    </div>
                                    <div className="text-center border-l border-white/10 pl-8">
                                        <span className="block text-[8px] text-gray-500 uppercase font-black mb-1">Result</span>
                                        <span className="text-red-500 font-black text-sm uppercase">{log.user}</span>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-full text-white/20 group-hover:text-white group-hover:bg-red-600 transition-all"><Search size={16} /></div>
                                </div>
                            </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-white/10 rounded-[2rem]">
                                <Target size={40} className="mb-2" />
                                <p className="text-xs uppercase font-black tracking-widest">Perfect Identification - No Errors</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- ACTION FOOTER --- */}
            <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black via-black/90 to-transparent z-20">
                <button
                    onClick={terminateSession}
                    className="group relative w-full bg-white text-black py-6 rounded-full font-black text-xl hover:bg-red-600 hover:text-white transition-all uppercase shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-[0.98] overflow-hidden"
                >
                    <span className="relative z-10">Terminate Session</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
            </div>

            {/* --- LIGHTBOX MODAL --- */}
            {(isFetching || selectedItem) && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setSelectedItem(null)}>
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-[3rem] max-w-5xl w-full relative shadow-2xl overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        {isFetching ? (
                            <div className="p-40 flex flex-col items-center gap-4">
                                <Loader2 className="animate-spin text-red-600 w-10 h-10" />
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600 animate-pulse">Retrieving Forensic Data...</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-red-600 p-6 flex justify-between items-center shadow-lg">
                                    <h3 className="font-black uppercase tracking-widest text-xl flex items-center gap-3 "><ShieldAlert /> Evidence Analysis</h3>
                                    <button onClick={() => setSelectedItem(null)} className="w-10 h-10 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center transition-all"><X size={20}/></button>
                                </div>
                                <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                                    <div className="lg:col-span-8 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <LightboxFrame label="X-Ray View A" src={`${API_URL}${selectedItem.top}`} />
                                            <LightboxFrame label="X-Ray View B" src={`${API_URL}${selectedItem.side}`} />
                                        </div>
                                        <LightboxFrame label="Reference Image" src={`${API_URL}/${selectedItem.item?.realImage}`} isLarge />
                                    </div>
                                    <div className="lg:col-span-4 space-y-6">
                                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-4">
                                            <LabelBox label="Correct Verdict" value={errorLog?.correct} color="text-green-500" />
                                            <LabelBox label="Operator Result" value={errorLog?.user} color="text-red-500" />
                                        </div>
                                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                                            <p className="text-[10px] text-gray-500 font-black uppercase mb-3 tracking-widest border-b border-white/10 pb-2">Analysis Report</p>
                                            <p className="text-white font-black text-lg leading-tight uppercase mb-2 ">{selectedItem?.item?.name}</p>
                                            <p className="text-gray-400 text-xs leading-relaxed ">{selectedItem?.item?.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #dc2626; }
            `}</style>
        </div>
    );
}

// --- SUB-COMPONENTS ---
function StatCard({ label, value, sub, color, icon }) {
    return (
        <div className="group bg-white/[0.02] p-6 rounded-[2.5rem] border border-white/5 hover:bg-white/[0.04] transition-all relative overflow-hidden">
            <div className="absolute top-4 right-6 text-white/5 group-hover:text-white/10 transition-colors scale-150">{icon}</div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className={`text-5xl font-black ${color} tracking-tighter mb-1`}>{value}</p>
            <p className="text-[10px] text-gray-700 font-bold uppercase ">{sub}</p>
        </div>
    );
}

function LightboxFrame({ label, src, isLarge }) {
    return (
        <div className="space-y-2">
            <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest ml-4">{label}</span>
            <div className={`bg-white rounded-[2.5rem] ${isLarge ? 'h-[280px]' : 'h-[200px]'} flex items-center justify-center p-6 border-[8px] border-black shadow-inner`}>
                <img src={src} className="max-w-full max-h-full object-contain" alt={label} />
            </div>
        </div>
    );
}

function LabelBox({ label, value, color }) {
    return (
        <div className="bg-black/40 p-5 rounded-3xl border border-white/5">
            <p className="text-[9px] text-gray-500 font-black uppercase mb-1 tracking-widest">{label}</p>
            <p className={`text-2xl font-black uppercase ${color} leading-none`}>{value}</p>
        </div>
    );
}
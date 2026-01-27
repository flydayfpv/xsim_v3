"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, AlertCircle, Loader2, Layers, Search } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3015";

export default function SummaryPage() {
    const [result, setResult] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isFetching, setIsFetching] = useState(false);
    const [errorLog, setErrorLog] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const data = localStorage.getItem("session_result");
        if (data) setResult(JSON.parse(data));
    }, []);

    // ✅ กรองข้อมูลให้เหลือแค่ 1 รายการต่อ 1 baggageId
    const uniqueWrongAnswers = useMemo(() => {
        if (!result?.wrongAnswers) return [];
        
        const seen = new Set();
        return result.wrongAnswers.filter((item) => {
            const duplicate = seen.has(item.baggageId);
            seen.add(item.baggageId);
            return !duplicate;
        });
    }, [result]);

    const handleInspect = async (log) => {
        setIsFetching(true);
        setErrorLog(log);
        try {
            const res = await fetch(`${API_URL}/baggage/${log.baggageId}`);
            if (!res.ok) throw new Error("Fetch failed");
            const baggageData = await res.json();
            setSelectedItem(baggageData);
        } catch (err) { 
            console.error(err); 
        } finally { 
            setIsFetching(false); 
        }
    };

    if (!result) return (
        <div className="h-screen bg-black flex items-center justify-center text-red-600 font-black italic uppercase animate-pulse">
            Initializing Report...
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020202] text-white p-6 md:p-10 font-sans italic tracking-tighter relative overflow-x-hidden">
            <header className="mb-12 border-l-4 border-red-600 pl-6">
                <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter">Performance Analysis</h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">
                    Operator: {result.userName || "Unknown"}
                </p>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
                <StatCard label="Accuracy" value={`${result.efficiency}%`} color="text-blue-400" />
                <StatCard label="Total Hits" value={result.hits} color="text-green-500" />
                <StatCard label="False Alarms" value={result.fars} color="text-red-500" />
                <StatCard label="Final Score" value={result.score} color="text-white" />
            </div>

            {/* Missed Identification Logs */}
            <div className="mb-10">
                <h2 className="text-2xl font-black mb-6 uppercase text-red-600 italic tracking-widest flex items-center gap-2">
                    <AlertCircle size={24} /> Identification Failures ({uniqueWrongAnswers.length})
                </h2>
                
                {/* ✅ Scrollable Container สำหรับรายการที่ผิด */}
                <div className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar border-t border-b border-white/5 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {uniqueWrongAnswers.map((log, i) => (
                            <div 
                                key={`${log.baggageId}-${i}`} 
                                onClick={() => handleInspect(log)}
                                className="group bg-white/[0.03] border border-white/10 p-5 rounded-[2rem] hover:bg-red-600/10 hover:border-red-600/50 transition-all cursor-pointer shadow-xl flex items-center justify-between"
                            >
                                <div className="flex-1 overflow-hidden mr-4">
                                    <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Archive ID</p>
                                    <h4 className="text-sm md:text-base font-bold text-white truncate italic">{log.code}</h4>
                                </div>
                                <div className="flex gap-4 bg-black/60 px-4 py-2 rounded-2xl border border-white/5 items-center shrink-0">
                                    <div className="text-center">
                                        <span className="block text-[8px] text-gray-500 font-black uppercase">Standard</span>
                                        <span className="text-green-500 font-black text-xs md:text-sm">{log.correct}</span>
                                    </div>
                                    <div className="w-[1px] h-6 bg-white/10"></div>
                                    <div className="text-center">
                                        <span className="block text-[8px] text-gray-500 font-black uppercase">User</span>
                                        <span className="text-red-500 font-black text-xs md:text-sm">{log.user}</span>
                                    </div>
                                    <Search size={16} className="text-gray-600 group-hover:text-white transition-colors ml-2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lightbox / Modal */}
            {(isFetching || selectedItem) && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300" 
                    onClick={() => {setSelectedItem(null); setErrorLog(null);}}
                >
                    <div 
                        className="relative max-w-7xl w-full max-h-[90vh] bg-[#080808] rounded-[3rem] overflow-hidden border border-white/10 flex flex-col shadow-2xl" 
                        onClick={e => e.stopPropagation()}
                    >
                        {isFetching ? (
                            <div className="h-[500px] flex flex-col items-center justify-center gap-6">
                                <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
                                <p className="font-black text-red-600 animate-pulse tracking-[0.3em] uppercase italic">Recovering Forensic Imagery...</p>
                            </div>
                        ) : (
                            <>
                                <div className="p-6 bg-red-600 flex justify-between items-center">
                                    <h3 className="font-black uppercase italic tracking-widest text-xl flex items-center gap-3">
                                        <Layers size={24} /> Visual Review // {selectedItem.code}
                                    </h3>
                                    <button 
                                        onClick={() => {setSelectedItem(null); setErrorLog(null);}} 
                                        className="bg-white text-black w-10 h-10 rounded-full font-black hover:scale-110 transition-transform flex items-center justify-center"
                                    >
                                        <X size={20} strokeWidth={3} />
                                    </button>
                                </div>
                                
                                <div className="flex flex-col lg:flex-row bg-black p-4 gap-4 overflow-y-auto">
                                    <div className="flex-[3] grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <ImageFrame label="Top View Scan" src={`${API_URL}${selectedItem.top}`} />
                                        <ImageFrame label="Side View Scan" src={`${API_URL}${selectedItem.side}`} />
                                        <div className="md:col-span-2">
                                            <ImageFrame label="Physical Object Reference" src={`${API_URL}/${selectedItem.item?.realImage}`} height="h-[300px]" />
                                        </div>
                                    </div>

                                    <div className="w-full lg:w-[320px] p-6 flex flex-col gap-4 bg-[#0a0a0a] rounded-[2rem] border border-white/5 italic">
                                        <div className="bg-white/5 p-4 rounded-2xl">
                                            <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Standard Conclusion</p>
                                            <p className="text-2xl text-green-500 font-black tracking-tighter uppercase">{errorLog?.correct}</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl">
                                            <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Operator Decision</p>
                                            <p className="text-2xl text-red-500 font-black tracking-tighter uppercase">{errorLog?.user}</p>
                                        </div>
                                        <div className="mt-auto p-4 bg-red-600/5 rounded-2xl border border-red-600/20">
                                            <p className="text-[10px] text-red-500 font-black uppercase mb-1 italic">Intelligence Report</p>
                                            <p className="text-xs text-gray-400 font-bold leading-relaxed">
                                                Object: {selectedItem.item?.name} <br/>
                                                {selectedItem.item?.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <button 
                onClick={() => router.push("/pages/dashboard")} 
                className="mt-12 w-full bg-white text-black p-8 rounded-[2.5rem] font-black text-2xl hover:bg-red-600 hover:text-white transition-all uppercase italic shadow-2xl active:scale-95"
            >
                End Review & Return to terminal
            </button>
        </div>
    );
}

// ✅ Stat Card Component
function StatCard({ label, value, color }) {
    return (
        <div className="bg-[#111] p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/10 text-center shadow-2xl">
            <p className="text-gray-500 text-[8px] md:text-[10px] font-black uppercase mb-2 tracking-[0.2em]">{label}</p>
            <p className={`text-3xl md:text-6xl font-black ${color} tracking-tighter`}>{value}</p>
        </div>
    );
}

// ✅ Image Frame Component
function ImageFrame({ label, src, height = "min-h-[300px]" }) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-[10px] text-gray-500 uppercase font-black ml-4 italic tracking-[0.2em]">{label}</span>
            <div className={`bg-white rounded-[2rem] overflow-hidden flex items-center justify-center p-4 ${height} shadow-inner border-2 border-white/5`}>
                <img 
                    src={src} 
                    className="max-w-full max-h-full object-contain rounded-lg hover:scale-105 transition-transform duration-500" 
                    alt={label} 
                />
            </div>
        </div>
    );
}
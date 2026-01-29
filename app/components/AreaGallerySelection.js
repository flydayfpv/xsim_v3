'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Briefcase, 
  Package, 
  Truck, 
  ChevronRight, 
  ImageIcon, 
  Loader2,
  LayoutGrid,
  DatabaseZap
} from "lucide-react";

export default function AreaGallerySelection() {
  const router = useRouter();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3015";

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await fetch(`${API_URL}/area`);
        const data = await res.json();
        setAreas(data || []);
      } catch (err) {
        console.error("Area Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAreas();
  }, [API_URL]);

  const areaConfigs = {
    1: { icon: Briefcase, color: "from-blue-500 to-cyan-400", shadow: "shadow-blue-500/30" },
    2: { icon: Package, color: "from-purple-600 to-pink-500", shadow: "shadow-purple-500/30" },
    3: { icon: Truck, color: "from-amber-500 to-orange-400", shadow: "shadow-amber-500/30" },
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#020202] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
        <p className="text-gray-500 text-xs font-bold tracking-[0.3em] uppercase animate-pulse">
            Accessing Secure Sectors...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#020202]/90 text-white p-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      {/* Dynamic Background Orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-125 h-125 bg-red-600/10 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-125 h-125 bg-blue-600/10 blur-[150px] rounded-full"></div>

      {/* Header */}
      <div className="relative z-10 text-center mb-20 animate-in fade-in slide-in-from-top-10 duration-1000">
        <div className="flex items-center justify-center gap-4 mb-6">
            <LayoutGrid className="text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" size={40} />
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">
                Gallery <span className="text-red-600">Archive</span>
            </h1>
        </div>
        <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gray-800"></div>
            <p className="text-gray-500 text-xs md:text-sm tracking-[0.5em] font-bold uppercase">
                Select Operational Sector
            </p>
            <div className="h-px w-12 bg-gray-800"></div>
        </div>
      </div>

      {/* Area Grid */}
      {areas.length > 0 ? (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl w-full">
            {areas.map((area, index) => {
            const config = areaConfigs[area.id] || areaConfigs[1];
            const Icon = config.icon;

            return (
                <div
                key={area.id}
                onClick={() => router.push(`/pages/baggagegallery?areaID=${area.id}`)}
                style={{ animationDelay: `${index * 150}ms` }}
                className={`group relative bg-white/3 backdrop-blur-3xl border border-white/5 p-12 rounded-[3.5rem] cursor-pointer transition-all duration-700 hover:-translate-y-3 hover:bg-white/[0.07] hover:border-white/20 animate-in fade-in zoom-in ${config.shadow} hover:shadow-2xl z-10 hover:z-20`}
                >
                {/* 2D Glass Reflection Effect */}
                <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent rounded-[3.5rem] pointer-events-none"></div>

                {/* Icon Container */}
                <div className={`mb-10 p-6 inline-block rounded-3xl bg-linear-to-br ${config.color} text-white shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                    <Icon size={44} />
                </div>

                {/* Title & Metadata */}
                <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-red-500 transition-colors tracking-tight">
                    {area.name}
                </h2>
                <div className="flex items-center gap-2 mb-10">
                    <ImageIcon size={14} className="text-red-500/60" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Secure Data Node</span>
                </div>

                {/* Styled Action Button */}
                <div className="flex items-center justify-between py-4 px-8 bg-white/5 border border-white/10 rounded-2xl text-white font-bold group-hover:bg-red-600 group-hover:border-red-600 group-hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all duration-300">
                    <span className="text-xs tracking-widest font-black uppercase">Initialize Access</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Vertical Decorative Accent */}
                <div className={`absolute top-1/2 -translate-y-1/2 left-0 h-24 w-1.5 bg-linear-to-b ${config.color} rounded-r-full opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-[0_0_15px_rgba(255,255,255,0.2)]`}></div>
                </div>
            );
            })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-20 opacity-40 animate-pulse">
            <DatabaseZap size={64} />
            <p className="text-sm font-bold tracking-[0.5em] uppercase text-center">No Operational Sectors Linked</p>
        </div>
      )}

      {/* Footer System Info */}
      <div className="mt-24 relative z-10 flex flex-col items-center gap-4">
        <div className="h-px32 bg-linear-to-r from-transparent via-gray-800 to-transparent"></div>
        <div className="flex gap-8 text-[10px] tracking-[0.4em] font-bold text-gray-500 uppercase">
            <span>Security Status: Optimal</span>
            <span className="text-red-900">•</span>
            <span>X-SIM V3 Core</span>
        </div>
      </div>
    </div>
  );
}
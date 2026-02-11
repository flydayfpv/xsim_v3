'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Package, Luggage, Truck, ChevronRight, LayoutGrid, X, 
  ArrowRight, Timer, AlertCircle, PauseCircle 
} from "lucide-react";
import CategorySelect from "@/app/components/CategorySelect";

export default function SelectionPage() {
  const router = useRouter();
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [allCategories, setAllCategories] = useState([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetch(`${API_URL}/itemCategory`)
      .then(res => res.json())
      .then(data => setAllCategories(data))
      .catch(err => console.error(err));
  }, [API_URL]);

  const areas = [
    {
      id: 1,
      title: "Cabin Baggage",
      thai: "สัมภาระพกพา",
      description: "ตรวจสอบกระเป๋าถือและสิ่งของที่จะนำขึ้นห้องโดยสาร",
      icon: <Luggage className="w-16 h-16" />,
      color: "from-blue-600 to-cyan-500",
      exclude: [1]
    },
    {
      id: 2,
      title: "Holding Baggage",
      thai: "สัมภาระลงทะเบียน",
      description: "ตรวจสอบกระเป๋าเดินทางขนาดใหญ่ที่โหลดใต้ท้องเครื่อง",
      icon: <Package className="w-16 h-16" />,
      color: "from-purple-600 to-pink-500",
      exclude: [1, 5]
    },
    {
      id: 3,
      title: "Cargo & Mail",
      thai: "สินค้าและไปรษณียภัณฑ์",
      description: "การตรวจความปลอดภัยสินค้าขนส่งทางอากาศและพัสดุ",
      icon: <Truck className="w-16 h-16" />,
      color: "from-amber-600 to-orange-500",
      exclude: [1, 5, 6]
    }
  ];

  const handleFinalNavigate = () => {
    if (selectedArea && selectedCatId) {
      router.push(`/cbt/${selectedArea.id}/${selectedCatId}`);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505]/95 flex flex-col items-center justify-center p-10 relative overflow-y-auto font-sans">
      
      {/* Background Glow - Canonical Height: h-125 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-125 bg-red-600/10 blur-[150px] pointer-events-none" />

      {/* Header Section */}
      <div className="text-center mb-16 relative z-10">
        <div className="flex items-center justify-center gap-6 mb-6">
          <LayoutGrid className="text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.6)] shrink-0" size={64} />
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic text-white leading-none">
            XSIM V3 <span className="text-red-600">Simulator</span>
          </h1>
        </div>
        <p className="text-gray-500 text-3xl font-black uppercase tracking-[0.3em] italic">Aviation Security Training Platform</p>
      </div>

      {/* 🛠️ Training Rules Panel - กฎการฝึกซ้อมแบบ XL */}
      <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 relative z-10">
        <div className="bg-white/5 border-2 border-white/10 p-8 rounded-4xl flex items-center gap-6 transition-all hover:bg-white/10">
          <div className="bg-emerald-500/20 p-5 rounded-xl text-emerald-500 shadow-lg shrink-0">
            <Timer size={40} />
          </div>
          <div>
            <h4 className="text-xl font-black text-white uppercase italic leading-none">20 Mins Session</h4>
            <p className="text-gray-400 text-lg font-bold mt-1">ต้องฝึกครบ 20 นาทีเพื่อบันทึกเวลา</p>
          </div>
        </div>
        
        <div className="bg-white/5 border-2 border-white/10 p-8 rounded-4xl flex items-center gap-6 transition-all hover:bg-white/10">
          <div className="bg-orange-500/20 p-5 rounded-xl text-orange-500 shadow-lg shrink-0">
            <AlertCircle size={40} />
          </div>
          <div>
            <h4 className="text-xl font-black text-white uppercase italic leading-none">HITS Calculation</h4>
            <p className="text-gray-400 text-lg font-bold mt-1">เกณฑ์การเก็บเวลาคำนวณจากค่า HITS</p>
          </div>
        </div>

        <div className="bg-white/5 border-2 border-white/10 p-8 rounded-4xl flex items-center gap-6 transition-all hover:bg-white/10">
          <div className="bg-blue-500/20 p-5 rounded-xl text-blue-500 shadow-lg shrink-0">
            <PauseCircle size={40} />
          </div>
          <div>
            <h4 className="text-xl font-black text-white uppercase italic leading-none">Freeze to Identify</h4>
            <p className="text-gray-400 text-lg font-bold mt-1">หยุดภาพก่อนระบุวัตถุ (คลิกได้ทั้ง 2 ฝั่ง)</p>
          </div>
        </div>
      </div>

      {/* Areas Grid - การเลือกพื้นที่แบบ 2XL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl w-full relative z-10 mb-16">
        {areas.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedArea(item)}
            className="group relative bg-white/5 border-2 border-white/10 p-10 rounded-[3rem] cursor-pointer overflow-hidden transition-all duration-500 hover:scale-105 hover:bg-white/8 hover:border-red-600/50 shadow-xl"
          >
            <div className={`mb-8 p-6 inline-block rounded-3xl bg-linear-to-br ${item.color} text-black shadow-xl shrink-0`}>
              {item.icon}
            </div>
            <h3 className="text-4xl font-black text-white mb-2 italic uppercase tracking-tighter leading-none">{item.title}</h3>
            <p className="text-red-600 font-black text-xl mb-6 uppercase leading-none">{item.thai}</p>
            <p className="text-gray-400 text-lg font-bold leading-relaxed mb-10 h-20">{item.description}</p>
            
            <div className="flex items-center text-white font-black text-lg tracking-widest uppercase italic">
              Configure Mission <ChevronRight className="ml-3 w-8 h-8 text-red-600 group-hover:translate-x-3 transition-transform" />
            </div>
            <div className={`absolute bottom-0 left-0 h-2 w-0 bg-linear-to-r ${item.color} group-hover:w-full transition-all duration-500`} />
          </div>
        ))}
      </div>

      {/* 🛠️ Category Selection Modal - แก้ไขเรื่องการปิดไม่ได้ */}
      {selectedArea && (
        <div 
          className="fixed inset-0 z-100 flex items-center justify-center p-8 backdrop-blur-3xl bg-black/90 animate-in fade-in duration-300"
          onClick={() => { setSelectedArea(null); setSelectedCatId(""); }} // คลิกข้างนอกเพื่อปิด
        >
          <div 
            className="bg-[#0f0f0f] border-2 border-white/10 p-14 rounded-[4rem] w-full max-w-xl shadow-xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()} // ป้องกันการคลิกข้างในแล้วปิด
          >
            
            <div className={`absolute -top-32 -left-32 w-80 h-80 bg-linear-to-br ${selectedArea.color} opacity-20 blur-[80px]`} />

            <button 
              onClick={() => { setSelectedArea(null); setSelectedCatId(""); }}
              className="absolute top-12 right-12 text-gray-500 hover:text-white transition-colors z-50 shrink-0"
            >
              <X size={48} />
            </button>

            <div className="mb-12 relative z-10">
              <span className={`text-lg font-black uppercase tracking-[0.3em] px-6 py-2 rounded-full bg-linear-to-r ${selectedArea.color} text-black italic`}>
                Sector: {selectedArea.title}
              </span>
              <h2 className="text-6xl font-black text-white mt-10 uppercase italic tracking-tighter leading-none">
                Set <span className="text-red-600">Category</span>
              </h2>
            </div>

            <CategorySelect 
              categories={allCategories}
              value={selectedCatId}
              onChange={setSelectedCatId}
              excludeIds={selectedArea.exclude}
              className="mb-12 text-xl"
            />

            <div className="bg-red-600/10 border-2 border-red-600/20 p-6 rounded-4xl mb-12 flex gap-5">
               <AlertCircle className="text-red-600 shrink-0" size={32} />
               <p className="text-lg text-gray-400 uppercase font-black leading-tight italic">
                 SOP Reminder: ต้องหยุดภาพ (Pause) ก่อนระบุตำแหน่งวัตถุ และฝึกครบ 20 นาทีเพื่อบันทึกเวลาเข้าระบบ
               </p>
            </div>

            <button
              disabled={!selectedCatId}
              onClick={handleFinalNavigate}
              className={`w-full py-8 rounded-[2rem] font-black text-3xl flex items-center justify-center gap-4 transition-all shadow-xl ${
                selectedCatId 
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-900/40 hover:-translate-y-2 active:scale-95' 
                : 'bg-white/5 text-gray-700 cursor-not-allowed opacity-40'
              }`}
            >
              INITIATE MISSION <ArrowRight size={36} />
            </button>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <footer className="mt-12 w-full max-w-6xl relative z-10 pb-16">
        <div className="flex justify-between items-center border-t-2 border-white/5 pt-10 text-gray-500 text-lg font-black uppercase tracking-[0.4em] italic">
          <div className="flex items-center gap-4">
            <span className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></span> 
            System Status: Online
          </div>
          <div>v3.0.1 Archive Mode</div>
          <div className="text-red-900/50 uppercase">Pansak Kaewsumran</div>
        </div>
      </footer>
    </div>
  );
}
'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Luggage, Truck, ChevronRight, LayoutGrid, X, ArrowRight } from "lucide-react";
import CategorySelect from "@/app/components/CategorySelect"; // ปรับ path ตามจริงของคุณ

export default function SelectionPage() {
  const router = useRouter();
  const [selectedArea, setSelectedArea] = useState(null); // เก็บพื้นที่ที่เลือก
  const [selectedCatId, setSelectedCatId] = useState(""); // เก็บหมวดหมู่ที่เลือก
  const [allCategories, setAllCategories] = useState([]); // ข้อมูลหมวดหมู่จาก API
  const API_URL = "http://localhost:3015";

  // ดึงข้อมูล Category มาเตรียมไว้
  useEffect(() => {
    fetch(`${API_URL}/itemCategory`)
      .then(res => res.json())
      .then(data => setAllCategories(data))
      .catch(err => console.error(err));
  }, []);

  const areas = [
    {
      id: 1,
      title: "Cabin Baggage",
      thai: "สัมภาระพกพา",
      description: "ตรวจสอบกระเป๋าถือและสิ่งของที่จะนำขึ้นห้องโดยสาร",
      icon: <Luggage className="w-12 h-12" />,
      color: "from-blue-500 to-cyan-400",
      exclude: [1] // Cabin ไม่ระบุยกเว้น
    },
    {
      id: 2,
      title: "Holding Baggage",
      thai: "สัมภาระลงทะเบียน",
      description: "ตรวจสอบกระเป๋าเดินทางขนาดใหญ่ที่โหลดใต้ท้องเครื่อง",
      icon: <Package className="w-12 h-12" />,
      color: "from-purple-600 to-pink-500",
      exclude: [1, 5] // ยกเว้น 1, 4 ตามโจทย์
    },
    {
      id: 3,
      title: "Cargo & Mail",
      thai: "สินค้าและไปรษณียภัณฑ์",
      description: "การตรวจความปลอดภัยสินค้าขนส่งทางอากาศและพัสดุ",
      icon: <Truck className="w-12 h-12" />,
      color: "from-amber-500 to-orange-400",
      exclude: [1, 5, 6] // ยกเว้น 1, 4, 6 ตามโจทย์
    }
  ];

  const handleFinalNavigate = () => {
    if (selectedArea && selectedCatId) {
      router.push(`/cbt/${selectedArea.id}/${selectedCatId}`);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Header Section */}
      <div className="text-center mb-12 relative z-10">
        <div className="flex items-center justify-center gap-4 mb-6">
          <LayoutGrid className="text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" size={40} />
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic text-white">
            XSIM V3 <span className="text-red-600">ARCHIVE</span>
          </h1>
        </div>
        <p className="text-gray-400 text-2xl font-light italic">Select area to start simulation</p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full relative z-10">
        {areas.map((item, index) => (
          <div
            key={item.id}
            onClick={() => setSelectedArea(item)}
            className="group relative bg-gray-900/40 border border-gray-800 p-8 rounded-[2rem] cursor-pointer overflow-hidden transition-all duration-500 hover:scale-105 hover:border-red-600/50"
          >
            <div className={`mb-6 p-4 inline-block rounded-2xl bg-gradient-to-br ${item.color} text-white`}>
              {item.icon}
            </div>
            <h3 className="text-3xl font-bold text-white mb-1 group-hover:text-red-500 transition-colors">{item.title}</h3>
            <p className="text-yellow-500 font-semibold text-xl mb-4">{item.thai}</p>
            <p className="text-gray-400 leading-relaxed mb-8">{item.description}</p>
            
            <div className="flex items-center text-white font-bold text-sm tracking-widest">
              SELECT SESSION <ChevronRight className="ml-2 w-5 h-5 text-red-600" />
            </div>
            <div className={`absolute bottom-0 left-0 h-1.5 w-0 bg-gradient-to-r ${item.color} group-hover:w-full transition-all duration-500`}></div>
          </div>
        ))}
      </div>

      {/* 🛠️ Category Selection Modal (Glassmorphism) */}
      {selectedArea && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/80 animate-in fade-in duration-300">
          <div className="bg-[#111] border border-white/10 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl relative">
            <button 
              onClick={() => { setSelectedArea(null); setSelectedCatId(""); }}
              className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
            >
              <X size={28} />
            </button>

            <div className="mb-8">
              <span className={`text-[16px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full bg-gradient-to-r ${selectedArea.color} text-balck`}>
                Target Sector: {selectedArea.title}
              </span>
              <h2 className="text-4xl font-black text-white mt-4 uppercase">Select <span className="text-red-600">Category</span></h2>
            </div>

            {/* ใช้ Component CategorySelect ที่คุณให้มา */}
            <CategorySelect 
              categories={allCategories}
              value={selectedCatId}
              onChange={setSelectedCatId}
              excludeIds={selectedArea.exclude} // กรองตามเงื่อนไขรายพื้นที่
              className="mb-10"
            />

            <button
              disabled={!selectedCatId}
              onClick={handleFinalNavigate}
              className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all ${
                selectedCatId 
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.4)]' 
                : 'bg-white/5 text-gray-600 cursor-not-allowed'
              }`}
            >
              GO TO GALLERY ARCHIVE <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-16 text-gray-600 text-sm flex gap-8 border-t border-gray-900/50 pt-8 w-full max-w-4xl justify-center relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span> System Ready
        </div>
        <div>v3.0.1 Archive Mode</div>
      </div>
    </div>
  );
}
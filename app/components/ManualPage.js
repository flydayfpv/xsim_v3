import React, { useState } from 'react';
import { BookOpen, Keyboard, Award, ChevronLeft, Move, ZoomIn, MousePointer2, Zap, Maximize2, X } from 'lucide-react';

const ManualPage = () => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // ฟังก์ชันช่วยเลื่อนไปยัง ID ที่กำหนด
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filterControls = [
    { key: 'Q', label: 'B&W', sub: 'Black & White', desc: 'ภาพขาว-ดำ ตัดสีออกเพื่อเน้นรูปทรงและขอบของวัตถุให้ชัดเจนขึ้น', icon: 'BW.png' },
    { key: 'W', label: 'NEG', sub: 'Negative', desc: 'กลับสีของวัตถุ ช่วยให้เห็นรายละเอียดในส่วนที่สว่างเกินไปได้ดีขึ้น', icon: 'NEG.png' },
    { key: 'E', label: 'SEN', sub: 'Super Enhance', desc: 'เน้นความหนาแน่นของวัตถุ และดึงรายละเอียดส่วนที่ซับซ้อนออกมา', icon: 'SEN.png' },
    { key: 'A', label: 'O2', sub: 'Organic Only', desc: 'ดูเฉพาะสารอินทรีย์ (สีส้ม) เช่น วัตถุระเบิด หรืออาหาร', icon: 'O2.png' },
    { key: 'S', label: 'OS', sub: 'Organic Stripping', desc: 'ดูเฉพาะสารอนินทรีย์ เพื่อดูเฉพาะสารอนินทรีย์ (สีฟ้า/เขียว) เช่น โลหะ', icon: 'OS.png' },
    { key: 'D', label: 'HI', sub: 'High Brightness', desc: 'เร่งความสว่างของภาพวัตถุขึ้น 50% สำหรับวิเคราะห์ส่วนที่มืด', icon: 'HI.png' },
  ];

  return (
    <div className="fixed inset-0 w-full bg-[#050505]/95 text-white font-sans selection:bg-red-600/30 overflow-y-auto scroll-smooth">
      
      {/* --- TOP FIXED NAV --- */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="hidden md:block">
            <span className="text-red-600 font-black italic tracking-tighter">X-SIM V.3</span>
          </div>

          <div className="flex gap-2 md:gap-6 mx-auto md:mr-0 ">
            {[
              { label: 'Overview', id: 'overview', icon: <BookOpen size={14} /> },
              { label: 'Controls', id: 'controls', icon: <MousePointer2 size={14} /> },
              { label: 'Filters', id: 'filters', icon: <Zap size={14} /> },
              { label: 'Rewards', id: 'rewards', icon: <Award size={14} /> },
            ].map((nav) => (
              <button
                key={nav.id}
                onClick={() => scrollToSection(nav.id)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/10 hover:border-red-600/50"
              >
                {nav.icon}
                {nav.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Back Button */}
      <button 
        onClick={() => window.history.back()}
        className="fixed top-24 left-6 z-50 p-3 bg-white/5 hover:bg-red-600 border border-white/10 rounded-full transition-all group shadow-2xl"
      >
        <ChevronLeft size={24} className="group-hover:text-black" />
      </button>

      {/* Header Section */}
      <header className="relative pt-32 pb-24 px-6 border-b border-white/5 bg-linear-to-b from-red-950/20 to-transparent">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-4 py-1 bg-red-600 text-black text-[14px] font-black uppercase tracking-[0.3em] mb-4 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.3)]">
            Security Training Module
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-red-600 mb-6 uppercase italic leading-none">
            X-Sim V.3<br/>User Manual
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto uppercase tracking-widest font-bold">
            คู่มือการใช้งานระบบจำลองการตรวจสัมภาระ
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-5xl mx-auto p-6 md:p-12 space-y-32 pb-40">
        
        {/* Section 1: Overview + Lightbox */}
        <section id="overview" className="grid md:grid-cols-2 gap-12 items-center scroll-mt-32">
          <div className="space-y-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 text-red-600">
              <BookOpen size={32} />
              <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white">Overview</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-400 text-lg leading-relaxed">
                <span className="text-white font-bold block mb-2 underline decoration-red-600 text-xl">บทนำสู่ระบบจำลอง:</span>
                X-Sim V.3 คือเครื่องมือฝึกฝนทักษะการวิเคราะห์ภาพ X-ray แบบ Dual-View 
                ที่ถูกพัฒนาขึ้นเพื่อให้นักเรียนได้ฝึกการตัดสินใจภายใต้สถานการณ์เสมือนจริง 
              </p>
              <div className="p-4 bg-red-600/10 border-l-4 border-red-600 rounded-r-xl">
                <p className="text-sm text-red-400 font-black italic">
                  "มุ่งเน้นการคัดกรองวัตถุอันตรายด้วยความแม่นยำและความรวดเร็ว"
                </p>
              </div>
            </div>
          </div>

          {/* Image with Lightbox Trigger */}
          <div className="group relative cursor-zoom-in" onClick={() => setIsLightboxOpen(true)}>
            <div className="bg-[#111] rounded-4xl border border-white/10 overflow-hidden shadow-2xl transition-all group-hover:border-red-600/50">
                <div className="aspect-video bg-gray-900 relative">
                    <img src="../images/cbtUI.png" alt="UI Overview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-red-600 p-3 rounded-full shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                            <Maximize2 size={24} />
                        </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black p-6">
                        <span className="text-xs font-black tracking-widest uppercase text-red-400">System Interface</span>
                        <h3 className="text-sm font-bold">Main Control Console v3.0</h3>
                    </div>
                </div>
            </div>
          </div>
        </section>

        {/* Lightbox Modal */}
        {isLightboxOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button className="absolute top-10 right-10 text-white/50 hover:text-red-600 transition-colors">
                <X size={48} />
            </button>
            <div className="relative max-w-7xl w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
                <img 
                    src="../images/cbtUI.png" 
                    className="w-full h-auto max-h-[85vh] object-contain rounded-xl shadow-[0_0_80px_rgba(220,38,38,0.2)] border border-white/10 animate-in zoom-in-95 duration-300" 
                    alt="Enlarged Console" 
                />
                <div className="mt-6 text-center">
                    <p className="text-red-600 font-black text-2xl uppercase italic tracking-tighter">Main Control Interface</p>
                    <p className="text-gray-500 uppercase tracking-widest text-sm font-bold">Dual-View X-Ray Inspection System // CBT Mode</p>
                </div>
            </div>
          </div>
        )}

        {/* Section 2: Interactive Controls */}
        <section id="controls" className="space-y-12 scroll-mt-32">
          <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
            <div className="flex items-center gap-3 justify-center md:justify-start text-blue-500">
              <MousePointer2 size={32} />
              <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white">Interaction Guide</h2>
            </div>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest text-right">การควบคุมมุมมองและการระบุตำแหน่ง</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-4xl space-y-4 hover:border-blue-500/50 transition-colors group">
              <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500 mb-4 mx-auto md:mx-0 group-hover:scale-110 transition-transform">
                <Keyboard size={28} />
              </div>
              <h3 className="text-2xl font-black uppercase text-blue-400 italic">1. Space to Inspect</h3>
              <p className="text-gray-400 leading-relaxed font-medium">
                <span className="text-white font-bold block mb-1">ต้องหยุดภาพก่อน:</span>
                กด <kbd className="px-2 py-1 bg-white/10 rounded text-yellow-500 font-mono text-lg">Spacebar</kbd> เพื่อหยุดสายพาน เมื่อสายพานหยุดสนิทจึงจะสามารถคลิกระบุตำแหน่งวัตถุต้องสงสัยได้
              </p>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-4xl space-y-4 hover:border-blue-500/50 transition-colors group">
              <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500 mb-4 mx-auto md:mx-0 group-hover:scale-110 transition-transform">
                <Move size={28} />
              </div>
              <h3 className="text-2xl font-black uppercase text-blue-400 italic">2. Left Click + Drag</h3>
              <p className="text-gray-400 leading-relaxed font-medium">
                <span className="text-white font-black block mb-1">การแพนภาพ (Pan):</span>
                คลิกเมาส์ซ้ายค้างไว้บนภาพ X-ray แล้วลากเพื่อสำรวจพื้นที่ต่างๆ ของสัมภาระทั้งในมุมมอง Top และ Side
              </p>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-4xl space-y-4 hover:border-blue-500/50 transition-colors group">
              <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500 mb-4 mx-auto md:mx-0 group-hover:scale-110 transition-transform">
                <ZoomIn size={28} />
              </div>
              <h3 className="text-2xl font-black uppercase text-blue-400 italic">3. Mouse Wheel</h3>
              <p className="text-gray-400 leading-relaxed font-medium">
                <span className="text-white font-bold block mb-1">การซูม (Zoom):</span>
                ใช้ลูกกลิ้งเมาส์เพื่อขยายจุดที่น่าสงสัยได้อย่างละเอียด ช่วยในการตัดสินใจระบุประเภทวัตถุอันตรายได้แม่นยำขึ้น
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Hotkeys & Filters */}
        <section id="filters" className="space-y-10 scroll-mt-32">
          <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
            <div className="flex items-center gap-3 justify-center md:justify-start text-red-500">
              <Zap size={32} />
              <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white">Imaging Filters</h2>
            </div>
            <p className="text-gray-300 text-sm font-bold uppercase tracking-widest text-right">เทคโนโลยีการวิเคราะห์ภาพ (Smith-Heimann Technology)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filterControls.map((item) => (
              <div key={item.key} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-4xl flex items-center gap-6 hover:bg-white/5 transition-all group border-l-4 border-l-red-600 shadow-xl">
                <div className="flex flex-col items-center gap-3 shrink-0">
                    <kbd className="px-5 py-2 bg-black rounded-xl font-mono text-3xl font-black text-red-600 border border-white/10 shadow-lg group-hover:scale-110 group-hover:text-white transition-all">
                        {item.key}
                    </kbd>
                    <div className="w-16 h-16 overflow-hidden rounded-xl bg-black flex items-center justify-center border border-white/10 group-hover:border-red-600/50 transition-colors shadow-inner">
                        <img src={`../images/${item.icon}`} alt={item.label} className="w-full h-full object-cover p-1 opacity-80 group-hover:opacity-100" />
                    </div>
                </div>
                
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black uppercase tracking-tighter text-white">{item.label}</span>
                        <span className="text-sm font-bold text-red-900 uppercase tracking-widest">{item.sub}</span>
                    </div>
                    <p className="text-gray-400 text-[15px] leading-snug font-medium">
                        {item.desc}
                    </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-red-950/20 border border-red-600/30 p-8 rounded-4xl flex items-center gap-8 group">
                <kbd className="px-8 py-3 bg-black rounded-2xl font-mono text-3xl font-black text-white border-b-4 border-red-600 italic shadow-2xl group-hover:scale-105 transition-transform text-center min-w-24 shrink-0">R</kbd>
                <div>
                    <span className="text-xl font-black uppercase block text-red-500 italic">RESET IMAGE</span>
                    <p className="text-gray-400 text-[15px] leading-tight font-medium mt-1">รีเซ็ตการตั้งค่าตัวกรองทั้งหมด รวมถึงระดับการซูมและตำแหน่งภาพกลับสู่ค่าเริ่มต้น</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-8 rounded-4xl flex items-center gap-8 group">
                <kbd className="px-6 py-3 bg-black rounded-2xl font-mono text-xl font-black text-white border-b-4 border-white/30 italic uppercase shadow-2xl group-hover:scale-105 transition-transform text-center min-w-24 shrink-0">Space</kbd>
                <div>
                    <span className="text-xl font-black uppercase block text-white italic">STOP / START</span>
                    <p className="text-gray-400 text-[15px] leading-tight font-medium mt-1">ควบคุมการหยุดหรือเริ่มเดินสายพานลำเลียงสัมภาระเข้าสู่เครื่อง X-Ray</p>
                </div>
              </div>
          </div>
        </section>

        {/* Section 4: Efficiency & Rewards */}
        <section id="rewards" className="space-y-10 scroll-mt-32">
          <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
            <div className="flex items-center gap-3 justify-center md:justify-start text-green-500">
              <Award size={32} />
              <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white">Efficiency Rewards</h2>
            </div>
            <p className="text-gray-300 text-sm font-bold uppercase tracking-widest text-right">เกณฑ์การได้รับแต้มเวลาสะสมจากความแม่นยำ</p>
          </div>

          <div className="overflow-x-auto rounded-4xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-gray-400">
                  <th className="p-8 text-sm font-black uppercase tracking-widest italic text-red-600">Accuracy Range</th>
                  <th className="p-8 text-sm font-black uppercase tracking-widest italic text-right">Time Credit (Mins)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { acc: '81% - 100%', credit: '20', color: 'text-green-400', label: 'ระดับยอดเยี่ยม' },
                  { acc: '71% - 80%', credit: '16', color: 'text-blue-400', label: 'ระดับดีมาก' },
                  { acc: '61% - 70%', credit: '14', color: 'text-yellow-400', label: 'ระดับดี' },
                  { acc: '50% - 60%', credit: '12', color: 'text-orange-400', label: 'ระดับผ่านเกณฑ์' },
                  { acc: 'Below 50%', credit: '0', color: 'text-red-500', label: 'ไม่ผ่านเกณฑ์' },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/2 transition-colors group">
                    <td className="p-8 font-black text-3xl tracking-tighter group-hover:translate-x-2 transition-transform">
                      {row.acc}
                      <span className="block text-sm text-gray-500 mt-1 uppercase font-bold">{row.label}</span>
                    </td>
                    <td className={`p-8 font-black text-5xl italic text-right ${row.color}`}>{row.credit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="text-center py-20 border-t border-white/5">
            <p className="text-gray-600 text-xs font-black uppercase tracking-[0.4em]">X-Sim V.3 // Flyday FPV System // Security Intelligence Division</p>
            <p className="text-[14px] text-gray-700 font-bold mt-2 uppercase italic tracking-widest">สงวนลิขสิทธิ์เนื้อหาและระบบการฝึกซ้อมเพื่อความปลอดภัยทางการบิน</p>
        </footer>
      </main>
    </div>
  );
};

export default ManualPage;
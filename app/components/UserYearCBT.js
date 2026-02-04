"use client";
import React, { useEffect, useState } from 'react';
import {
  Loader2,
  ShieldAlert,
  Target,
  AlertCircle,
  Zap,
  Activity,
  Clock,
  Award,
  User,
  MapPin,
  TrendingUp,
  CheckCircle2,
  AlertTriangle, // ✅ Added missing import
  ChevronRight   // ✅ Added missing import
} from 'lucide-react';
import { getOperatorProfile } from '../lib/auth';
  import OperatorRadarChart from './OperatorRadarChart';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3015";

const UserYearCBT = () => {
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState({ timeUsed: 0, avgHitsRate: 0 });
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const currentYear = new Date().getFullYear();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await getOperatorProfile();
        setUserProfile(profile);
        const userId = profile.userID;

        const [catRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/itemCategory`),
          fetch(`${API_URL}/training/stats/${userId}?year=${currentYear}`)
        ]);

        const cats = await catRes.json();
        const statsResponse = await statsRes.json();
        if (!statsResponse.success) throw new Error("API Failed");

        const catMap = cats.reduce((acc, c) => ({ ...acc, [c.id.toString()]: c.name }), {});

        // --- AGGREGATION LOGIC ---
        const aggregate = {};
        let totalTime = 0;
        let sumHitsRate = 0;
        const sessionCount = statsResponse.data.length;

        statsResponse.data.forEach(session => {
          totalTime += parseInt(session.time_used || 0);
          sumHitsRate += parseFloat(session.hitsRate || 0);

          let catStats = {};
          try {
            const firstPass = JSON.parse(session.category_stats);
            catStats = typeof firstPass === 'string' ? JSON.parse(firstPass) : firstPass;
          } catch (e) { catStats = {}; }

          Object.entries(catStats).forEach(([catId, stat]) => {
            if (!aggregate[catId]) aggregate[catId] = { hits: 0, total: 0 };
            aggregate[catId].hits += stat.hits;
            aggregate[catId].total += stat.total;
          });
        });

        const formattedData = Object.entries(aggregate).map(([catId, values]) => ({
          id: catId,
          name: catMap[catId] || `Unknown Class (${catId})`,
          accuracy: values.total > 0 ? (values.hits / values.total) * 100 : 0
        })).sort((a, b) => b.accuracy - a.accuracy);

        setData(formattedData);
        setTotals({
          timeUsed: totalTime,
          avgHitsRate: sessionCount > 0 ? parseFloat((sumHitsRate / sessionCount).toFixed(1)) : 0
        });

      } catch (err) {
        console.error("Stats Load Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentYear]);

  // --- LOGIC: RATING PER CATEGORY ---
  const getCategoryTheme = (acc) => {
    if (acc > 80) return { label: "ดีเยี่ยม", color: "text-blue-400", bar: "bg-blue-600", note: "รักษามาตรฐานไว้" };
    if (acc > 70) return { label: "ดีมาก", color: "text-green-400", bar: "bg-green-500", note: "ใกล้ระดับสูงสุด" };
    if (acc > 60) return { label: "ดี", color: "text-yellow-400", bar: "bg-yellow-500", note: "ควรฝึกฝนเพิ่ม" };
    if (acc > 50) return { label: "ปรับปรุง", color: "text-orange-500", bar: "bg-orange-600", note: "ต้องการการแก้ไข" };
    return { label: "แย่", color: "text-red-500", bar: "bg-red-700", note: "วิกฤต: ต้องฝึกใหม่" };
  };

  // --- LOGIC: OVERALL SYSTEM STATUS ---
  const getOverallGuide = () => {
    const rate = totals.avgHitsRate;
    if (rate > 80) return { status: "ELITE", color: "text-blue-400", bg: "bg-blue-600/10", tips: ["รักษามาตรฐานความแม่นยำ", "ศึกษาเคสระเบิดรูปแบบใหม่", "แนะนำเทคนิคให้ทีม"] };
    if (rate > 70) return { status: "EXCELLENT", color: "text-green-400", bg: "bg-green-600/10", tips: ["ใช้ Function ช่วยวิเคราะห์", "ลดเวลาตัดสินใจ", "ทบทวนภาพวัตถุซ้อนทับ"] };
    if (rate > 60) return { status: "GOOD", color: "text-yellow-400", bg: "bg-yellow-600/10", tips: ["ฝึกสแกนจุดอับสายตา", "ทบทวนสีของวัสดุ Organic", "เพิ่มความละเอียดในการสแกน"] };
    if (rate > 50) return { status: "IMPROVE", color: "text-orange-500", bg: "bg-orange-600/10", tips: ["ทำแบบทดสอบซ้ำหมวดที่พลาด", "ลดอัตรา False Alarm", "ทบทวนพื้นฐาน IED"] };
    return { status: "CRITICAL", color: "text-red-500", bg: "bg-red-600/10", tips: ["ระงับหน้าที่เพื่อฝึกอบรม", "เริ่มเรียนทฤษฎีใหม่", "ปรึกษา Supervisor ด่วน"] };
  };

  const guide = getOverallGuide();

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-red-600" size={40} />
      <span className="text-2xl font-black uppercase  text-red-600 animate-pulse">Establishing Secure Link...</span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in duration-700 overflow-auto">

      {/* --- LEFT: MAIN STATISTICS --- */}
      <div className="xl:col-span-8 space-y-6">

        {/* Profile Card */}
        <div className="bg-linear-to-r from-red-900/20 to-transparent border border-white/10 p-6 rounded-[2.5rem] backdrop-blur-md flex items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(220,38,38,0.4)]">
              <User size={32} className="text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-[#050505] rounded-full" />
          </div>
          <div>
            <p className="text-2xl text-red-500 font-black uppercase  mb-1">เจ้าหน้าที่ปฏิบัติการ (Active Duty)</p>
            <h2 className="text-2xl font-black text-white uppercase ">{userProfile?.prefix}{userProfile?.firstName} {userProfile?.lastName}</h2>
            <div className="flex items-center gap-2 text-gray-500 mt-1">
              <MapPin size={12} />
              <span className="text-2xl font-bold uppercase  leading-none">{userProfile?.division}</span>
            </div>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatBox label="เวลาสะสมทั้งหมด" value={totals.timeUsed} unit="นาที" icon={<Clock />} color="text-green-500" />
          <StatBox label="ความแม่นยำเฉลี่ยรายปี" value={totals.avgHitsRate} unit="%" icon={<Award />} color="text-blue-400" />
        </div>

        {/* Capability Profile Map */}
        <div className="bg-white/2 border border-white/5 rounded-[2.5rem] p-8">
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
            <h3 className="text-3xl font-black uppercase  text-white/60 flex items-center gap-2">
              <Activity size={14} className="text-red-600" /> แผนผังประเมินสมรรถนะรายหมวดหมู่
            </h3>
            <span className="text-2xl font-mono text-gray-600 uppercase">FY {currentYear}</span>
          </div>

          <div className="grid gap-8">
            {data.map((item, idx) => {
              const theme = getCategoryTheme(item.accuracy);
              return (
                <div key={idx} className="group relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="space-y-1">
                      <span className="text-2xl font-black uppercase text-white/90 group-hover:text-red-500 transition-colors">{item.name}</span>
                      <p className="text--2xl font-bold text-gray-600 uppercase ">ประเมิน: <span className={theme.color}>{theme.label} ({theme.note})</span></p>
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-black ${theme.color}`}>{item.accuracy.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="relative h-2.5 w-full bg-white/5 rounded-full border border-white/10 p-px overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${theme.bar} ${item.accuracy > 80 ? 'shadow-[0_0_15px_rgba(37,99,235,0.4)]' : ''}`}
                      style={{ width: `${item.accuracy}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- RIGHT: DYNAMIC SYSTEM NOTICE --- */}
      <div className="xl:col-span-4 space-y-6">
        <div className={`p-8 rounded-[3rem] shadow-2xl transition-all duration-500 ${guide.bg} border border-white/5 relative overflow-hidden`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${guide.bg} border border-white/10`}>
              <Activity className={`${guide.color} animate-pulse`} size={20} />
            </div>
            <h3 className={`text-2xl font-black uppercase  ${guide.color}`}>สถานะ: {guide.status}</h3>
          </div>
          <div className="space-y-6">
            <p className="text-white/80 text-2xl font-bold leading-relaxed">
              ภาพรวมประสิทธิภาพในปี {currentYear} ของคุณ <span className={guide.color}>{totals.avgHitsRate}%</span>
              จัดอยู่ในเกณฑ์ <span className="underline decoration-red-600 underline-offset-4">{guide.status}</span> ตามมาตรฐาน
            </p>
            <div className="space-y-4">
              <p className="text-2xl text-gray-500 uppercase font-black  border-l-2 border-red-600 pl-3">คำแนะนำ (Directives):</p>
              <div className="grid gap-3">
                {guide.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <CheckCircle2 size={14} className={`${guide.color} shrink-0 mt-0.5`} />
                    <span className="text-lg font-bold text-white/70 uppercase  leading-tight group-hover:text-white transition-colors">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Global Stats Summary */}
        <div className="bg-white/5 border border-white/5 p-8 rounded-[3rem] space-y-6 backdrop-blur-md">
          <h4 className="text-2xl text-gray-500 uppercase font-black  border-b border-white/10 pb-4 flex items-center gap-2">
            <TrendingUp size={14} /> Operational Summary
          </h4>
          <MetricItem label="ความแม่นยำเฉลี่ย" value={`${totals.avgHitsRate}%`} icon={<Target size={14} />} color={guide.color} />
          <MetricItem label="เวลาสะสม" value={`${totals.timeUsed} นาที`} icon={<Clock size={14} />} />
          <MetricItem label="ระดับความเสี่ยง" value={totals.avgHitsRate < 50 ? "สูงมาก" : "ปกติ"} icon={<AlertTriangle size={14} />} color={totals.avgHitsRate < 50 ? "text-red-500" : "text-green-500"} />
        </div>

        <div className="bg-[#111] p-8 rounded-[3rem] border border-white/10 shadow-2xl">
          <h3 className="text-2xl font-black text-red-600 uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
            360° Proficiency Analysis
          </h3>
          <div className="h-80">
            <OperatorRadarChart />
          </div>
        </div>

      </div>
    </div>
  );
};

// --- HELPER UI COMPONENTS ---
// --- HELPER UI COMPONENTS ---
const StatBox = ({ label, value, unit, icon, color }) => (
  <div className="group bg-white/3 border border-white/10 p-6 rounded-4xl flex items-center justify-between overflow-hidden relative transition-all hover:bg-white/5">
    <div className="relative z-10">
      <p className="text-2xl text-gray-500 uppercase font-black mb-1">{label}</p>
      <p className={`text-5xl font-black ${color}`}>
        {value}
        <small className="text-2xl ml-1 text-gray-500 font-bold uppercase">{unit}</small>
      </p>
    </div>
    <div className="text-white/2 absolute -right-3.5 -bottom-3.5 transition-all group-hover:scale-110 group-hover:text-white/5">
      {React.cloneElement(icon, { size: 100 })}
    </div>
  </div>
);

const MetricItem = ({ label, value, icon, color = "text-white" }) => (
  <div className="flex items-center justify-between group cursor-default">
    <div className="flex items-center gap-3">
      <div className="text-gray-600 group-hover:text-red-500 transition-colors">{icon}</div>
      <span className="text-[16px] font-bold text-gray-400 uppercase ">{label}</span>
    </div>
    <span className={`text-2xl font-black ${color}`}>{value}</span>
  </div>
);

export default UserYearCBT;
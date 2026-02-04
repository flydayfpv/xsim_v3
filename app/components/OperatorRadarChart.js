"use client";
import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import { getOperatorProfile } from "../lib/auth";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const categoryMap = {
  "1": "Clear",
  "2": "IED",
  "3": "Explosive",
  "4": "Gun / Ammunition",
  "5": "Sharp Object",
  "6": "Other"
};

export default function OperatorRadarChart() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actualUserId, setActualUserId] = useState(null); // เก็บ ID จริงๆ
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  const currentYear = new Date().getFullYear();

  // Step 1: ดึง User Profile ก่อน
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await getOperatorProfile();
        if (user && user.id) { // ตรวจสอบ key ให้ดีว่าเป็น .id หรือ .userID
          setActualUserId(user.id);
        }
      } catch (err) {
        console.error("Auth Error:", err);
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Step 2: เมื่อมี actualUserId แล้วค่อยดึง Stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!actualUserId) return;

      try {
        const res = await fetch(`${API_BASE}/training/stats/${actualUserId}?year=${currentYear}`);
        const result = await res.json();

        if (result.success && result.data) {
          const aggregator = {};

          result.data.forEach((session) => {
            let stats = session.category_stats;
            
            if (typeof stats === "string") {
              try {
                stats = JSON.parse(stats);
                if (typeof stats === "string") stats = JSON.parse(stats);
              } catch (e) { stats = {}; }
            }

            if (stats && typeof stats === 'object') {
              Object.entries(stats).forEach(([id, val]) => {
                if (!aggregator[id]) aggregator[id] = { hits: 0, total: 0 };
                aggregator[id].hits += (val.hits || 0);
                aggregator[id].total += (val.total || 0);
              });
            }
          });

          const sortedIds = ["1", "2", "3", "4", "5", "6"];
          const labels = sortedIds.map(id => categoryMap[id]);
          const values = sortedIds.map(id => {
            const item = aggregator[id];
            return item && item.total > 0 ? (item.hits / item.total) * 100 : 0;
          });

          setChartData({
            labels,
            datasets: [{
              label: "Efficiency %",
              data: values,
              backgroundColor: "rgba(220, 38, 38, 0.2)",
              borderColor: "#dc2626",
              borderWidth: 2,
              pointBackgroundColor: "#fff",
              pointBorderColor: "#dc2626",
            }]
          });
        }
      } catch (err) {
        console.error("Radar Stats Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [actualUserId, currentYear, API_BASE]);

  const options = {
    scales: {
      r: {
        min: 0, max: 100,
        beginAtZero: true,
        ticks: { display: false },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        angleLines: { color: "rgba(255, 255, 255, 0.1)" },
        pointLabels: {
          color: "#9ca3af",
          font: { size: 10, weight: "bold" }
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` Proficiency: ${ctx.raw.toFixed(1)}%`
        }
      }
    },
    maintainAspectRatio: false
  };

  if (loading) return (
    <div className="bg-[#111] p-6 rounded-[2.5rem] border border-white/10 h-80 flex items-center justify-center">
      <div className="text-center text-xs text-gray-500 animate-pulse uppercase tracking-widest">
        Loading Performance Data...
      </div>
    </div>
  );

  return (
    <div className="bg-[#111] p-6 rounded-[2.5rem] border border-white/10 w-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[10px] font-black text-red-600 uppercase tracking-widest">Performance Radar</h3>
        <div className="px-3 py-1 bg-white/5 rounded-full text-[9px] text-gray-400 font-bold border border-white/5">
          FY {currentYear}
        </div>
      </div>
      <div className="h-64">
        {chartData ? <Radar data={chartData} options={options} /> : <div className="text-center text-gray-600 text-xs">No data found</div>}
      </div>
    </div>
  );
}
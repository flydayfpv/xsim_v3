'use client'

import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, Clock, AlertCircle, Trash2, 
  Loader2, Calendar, MessageSquare, CheckCircle2,
  Activity, ShieldAlert, Target, TrendingUp
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3015";

const CorrectiveLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserRole(user.roleID);
      fetchLogs(user.id);
    }
  }, []);

  const fetchLogs = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/corrective/allbyid/${userId}`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch corrective logs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Confirm deletion of this corrective record?")) return;
    try {
      const res = await fetch(`${API_URL}/corrective/${id}`, { method: 'DELETE' });
      if (res.ok) setLogs(prev => prev.filter(log => log.id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
        <div className="min-h-screen bg-[#050505]/95 text-white p-6 md:p-10 font-sans relative overflow-auto">
      
      {/* --- HEADER PANEL (YearlyForensicLog Style) --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/1 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(220,38,38,0.4)] border border-red-500/50">
            <ClipboardCheck size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Corrective Action Logs</h2>
            <div className="flex items-center gap-2 mt-1">
              <Activity size={12} className="text-red-500" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Compliance Registry & Performance Recovery
              </p>
            </div>
          </div>
        </div>

        <div className="text-right px-6 py-2 bg-black/40 rounded-2xl border border-white/10">
          <p className="text-3xl font-black text-white leading-none tracking-tighter">{logs.length}</p>
          <p className="text-lg font-black text-red-500 uppercase tracking-[0.2em] mt-1">Total Directives</p>
        </div>
      </div>

      {/* --- TABLE CONTAINER --- */}
      <div className="bg-white/1 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-md shadow-2xl">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <Loader2 className="animate-spin text-red-600" size={48} />
              <div className="absolute inset-0 blur-lg bg-red-600/20 animate-pulse"></div>
            </div>
            <span className="text-xs font-black uppercase text-red-600 tracking-[0.3em] animate-pulse">Decrypting Registry...</span>
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/2">
                  <th className="p-6 pl-10 text-lg font-black text-gray-500 uppercase tracking-[0.2em]">Timestamp / ID</th>
                  <th className="p-6 text-lg font-black text-gray-500 uppercase tracking-[0.2em]">Classification</th>
                  <th className="p-6 text-lg font-black text-gray-500 uppercase tracking-[0.2em] text-center">Goal (Min)</th>
                  <th className="p-6 text-lg font-black text-gray-500 uppercase tracking-[0.2em] text-center">Actual (Min)</th>
                  <th className="p-6 text-lg font-black text-gray-500 uppercase tracking-[0.2em]">Remarks</th>
                  {userRole === 1 && <th className="p-6 pr-10 text-lg font-black text-gray-500 uppercase tracking-[0.2em] text-right">Admin Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => {
                  const isPassing = log.timeGet !== null && log.timeGet >= log.timeTarget;
                  return (
                    <tr 
                      key={log.id} 
                      className={`group transition-all duration-300 ${
                        isPassing 
                          ? 'bg-green-500/5 hover:bg-green-500/10' 
                          : 'hover:bg-white/2'
                      }`}
                    >
                      <td className="p-6 pl-10">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${isPassing ? 'bg-green-500' : 'bg-red-600'}`}></div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-red-500 transition-colors">
                              {new Date(log.createdAt).toLocaleDateString('th-TH')}
                            </p>
                            <p className="text-lg font-mono text-gray-600 uppercase tracking-tighter mt-0.5">#LOG-{log.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className={`text-lg font-black px-3 py-1 rounded-md border uppercase tracking-tighter ${
                          isPassing 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                            : 'bg-red-600/10 text-red-500 border-red-600/20'
                        }`}>
                          {log.type?.name}
                        </span>
                      </td>
                      <td className="p-6 text-center">
                        <span className="text-lg font-mono font-black text-gray-500">{log.timeTarget}</span>
                      </td>
                      <td className="p-6 text-center">
                        {log.timeGet !== null ? (
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-mono font-black ${isPassing ? 'text-green-400' : 'text-red-500'}`}>
                                {log.timeGet}
                              </span>
                              {isPassing && <CheckCircle2 size={14} className="text-green-400" />}
                            </div>
                            <div className="w-12 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                              <div 
                                className={`h-full ${isPassing ? 'bg-green-500' : 'bg-red-600'}`} 
                                style={{ width: `${Math.min((log.timeGet/log.timeTarget)*100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-lg font-black text-gray-700 uppercase italic">Pending Results</span>
                        )}
                      </td>
                      <td className="p-6">
                        <div className="flex items-start gap-2 max-w-50">
                          <MessageSquare size={14} className="text-gray-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-500 italic truncate group-hover:whitespace-normal transition-all">
                            {log.remark || "NO REMARKS"}
                          </p>
                        </div>
                      </td>
                      {userRole === 1 && (
                        <td className="p-6 pr-10 text-right">
                          <button 
                            onClick={() => handleDelete(log.id)}
                            className="p-3 bg-white/5 hover:bg-red-600 text-gray-500 hover:text-white rounded-xl transition-all duration-300 shadow-lg active:scale-95 group/btn"
                          >
                            <Trash2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center opacity-30">
            <ShieldAlert size={64} className="mb-6 text-red-600" />
            <p className="text-xs font-black uppercase tracking-[0.5em]">No Corrective Data Stream</p>
          </div>
        )}
      </div>

      {/* --- LEGEND FOOTER --- */}
      <div className="flex items-center gap-6 px-8 text-lg font-black uppercase tracking-widest text-gray-600">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-red-600" />
          <span>Operational Legend:</span>
        </div>
        <div className="flex items-center gap-2 bg-white/2 px-3 py-1 rounded-md border border-white/5">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          <span>Requirement Met</span>
        </div>
        <div className="flex items-center gap-2 bg-white/2 px-3 py-1 rounded-md border border-white/5">
          <div className="w-2 h-2 rounded-full bg-red-600" />
          <span>Correction Required</span>
        </div>
      </div>
    </div>
  );
};

export default CorrectiveLogs;
"use client";
import React from 'react';
import UserYearCBT from '../components/UserYearCBT';
import OperatorRadarChart from '../components/OperatorRadarChart';
import { ShieldCheck, Zap, LayoutGrid } from 'lucide-react';

const ProfessionalDashboard = () => {
  return (
    <div className="min-h-screen w-full bg-[#050505]/90 text-white overflow-y-auto">

      {/* Container - Large max-width for full page feel */}
      <div className="max-w-425 mx-auto p-10 lg:p-16 space-y-16">

        {/* 1. Header */}
        <header>
          <UserYearCBT showOnlyHeader={true} />
        </header>

       

        <footer className="pb-20 text-center opacity-20 text-sm font-mono tracking-[1em]">
          AOT AVSEC // SECURE DATA // 2026
        </footer>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;
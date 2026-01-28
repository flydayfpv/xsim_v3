"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    ChevronRight, ChevronLeft, Scan, LineChart,
    Users, BarChart3, Skull, Settings,
    LogOut, GraduationCap, WrenchIcon, PlusSquare, ChevronDown, ShieldCheck
} from "lucide-react";

const MENU_GROUPS = [
    {
        groupLabel: "Operations",
        id: "ops",
        roles: [1, 2, 3],
        icon: Scan,
        items: [
            { label: "X-Ray Simulator (CBT)", path: "/pages/selection", roles: [1, 2, 3], icon: Scan },
            { label: "Corrective (CBT)", path: "/pages/CorrectiveList", roles: [1, 2, 3], icon: ShieldCheck },

            { label: "My Training", path: "/training", roles: [1, 2], icon: GraduationCap },
            { label: "Gallery", path: "/pages/gallery", roles: [1, 2, 3], icon: PlusSquare },
        ]
    },
    {
        groupLabel: "Management",
        id: "mgt",
        roles: [1, 3],
        icon: Users,
        items: [
            { label: "Create Image", path: "/pages/createimage", roles: [1, 3], icon: PlusSquare },
            { label: "Class Management", path: "/instructor/classes", roles: [1, 3], icon: Users },
            { label: "Session Reports", path: "/instructor/reports", roles: [1, 3], icon: BarChart3 },
            { label: "Threat Library", path: "/instructor/library", roles: [1, 3], icon: Skull },
        ]
    },
    {
        groupLabel: "Support",
        id: "support",
        roles: [1, 2, 3],
        icon: WrenchIcon,
        items: [
            { label: "Corrective Action", path: "/profile", roles: [1, 2, 3], icon: WrenchIcon },
            { label: "Performance LineChart", path: "/stats", roles: [1, 2], icon: LineChart },
        ]
    },
    {
        groupLabel: "System",
        id: "sys",
        roles: [1],
        icon: Settings,
        items: [
            { label: "System Configuration", path: "/admin/config", roles: [1], icon: Settings },
            { label: "User Access Control", path: "/admin/users", roles: [1], icon: Skull },
        ]
    }
];

const Sidebar = ({ user, setUser }) => {
    const pathname = usePathname();
    const router = useRouter();

    // ✅ เริ่มต้นที่ true เพื่อให้ย่อไว้อัตโนมัติ
    const [isCollapsed, setIsCollapsed] = useState(true);

    // ควบคุมการเปิด-ปิดกลุ่มเมนู
    const [expandedGroups, setExpandedGroups] = useState({
        ops: true,
        mgt: false,
        support: false,
        sys: false
    });

    if (!user) return null;

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    const handleLogout = async () => {
        localStorage.clear();
        setUser(null);
        router.replace("/Login");
    };

    return (
        <aside
            // ✅ Hover Logic: ขยายเมื่อเมาส์เข้า หดเมื่อเมาส์ออก
            onMouseEnter={() => setIsCollapsed(false)}
            onMouseLeave={() => setIsCollapsed(true)}
            className={`flex flex-col min-h-screen bg-slate-950 text-slate-50 border-r border-slate-800 transition-all duration-500 ease-in-out sticky top-0 h-screen z-50 shadow-2xl ${isCollapsed ? "w-20" : "w-80"
                }`}
        >
            {/* 🚀 Logo Section: แสดง "X" เมื่อย่อ และ "X-SIM" เมื่อขยาย */}
            <div className="flex items-center h-24 border-b border-slate-800 overflow-hidden px-4">
                {isCollapsed ? (
                    <div className="w-full flex justify-center animate-in zoom-in duration-300">
                        {/* โลโก้ตัว X สีแดงเด่นๆ */}
                        <span className="text-red-600 font-bold text-4xl" >X</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 px-2 animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="p-2 bg-red-600 rounded-xl shadow-lg shadow-red-600/30">
                            <Scan size={26} className="text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-2xl tracking-tighter leading-none">X-SIM</span>
                            <span className="text-[10px] text-red-500 font-bold tracking-[0.3em] mt-1">VERSION 3</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {MENU_GROUPS.filter(group => group.roles.includes(user.roleID)).map((group) => {
                    const isExpanded = expandedGroups[group.id];
                    const GroupIcon = group.icon;

                    return (
                        <div key={group.id} className="space-y-1">
                            {/* Group Header */}
                            <button
                                onClick={() => toggleGroup(group.id)}
                                className={`flex items-center gap-4 w-full px-4 py-3 rounded-xl transition-all hover:bg-slate-800/50 ${isCollapsed ? "justify-center" : "justify-between"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <GroupIcon
                                        size={22}
                                        className={`transition-colors duration-300 ${isCollapsed ? "text-red-500" : "text-slate-500"}`}
                                    />
                                    {!isCollapsed && (
                                        <span className="font-bold text-slate-500 uppercase tracking-widest text-[16px]">
                                            {group.groupLabel}
                                        </span>
                                    )}
                                </div>
                                {!isCollapsed && (
                                    <ChevronDown
                                        size={14}
                                        className={`transition-transform duration-300 text-slate-600 ${isExpanded ? "rotate-180" : ""}`}
                                    />
                                )}
                            </button>

                            {/* Sub-Items (แสดงเฉพาะตอนขยาย Sidebar) */}
                            <div className={`overflow-hidden transition-all duration-300 ${isExpanded && !isCollapsed ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                }`}>
                                <div className="pl-6 space-y-1 mt-1">
                                    {group.items.filter(item => item.roles.includes(user.roleID)).map((item) => {
                                        const isActive = pathname === item.path;
                                        const Icon = item.icon;

                                        return (
                                            <Link
                                                key={item.path}
                                                href={item.path}
                                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive
                                                        ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                                    }`}
                                            >
                                                <Icon size={18} className="shrink-0" />
                                                <span className="font-medium whitespace-nowrap text-xl">{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Logout Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                <button
                    onClick={handleLogout}
                    className={`flex items-center gap-4 w-full px-4 py-4 rounded-xl text-slate-500 hover:bg-red-950/30 hover:text-red-500 transition-all ${isCollapsed ? "justify-center" : ""
                        }`}
                >
                    <LogOut size={22} className="shrink-0" />
                    {!isCollapsed && <span className="font-bold text-sm">Sign Out System</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
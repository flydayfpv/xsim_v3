"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    ChevronRight, ChevronLeft, Scan, History,
    Users, BarChart3, ShieldAlert, Settings,
    LogOut, Briefcase, User2Icon,
    WrenchIcon,ImageIcon
} from "lucide-react";

const MENU_CONFIG = [
    { label: "X-Ray Simulator (CBT)", path: "/sim", roles: [1, 2, 3], icon: Scan },
    { label: "My Training", path: "/training", roles: [1], icon: Briefcase },
    { label: "Corrective Action", path: "/profile", roles: [1, 2, 3], icon: WrenchIcon },
    { label: "Gallery", path: "/gallery", roles: [1, 2, 3], icon: ImageIcon },
    { label: "Performance", path: "/stats", roles: [1], icon: History },

    { label: "Class Management", path: "/instructor/classes", roles: [2, 3], icon: Users },
    { label: "Session Reports", path: "/instructor/reports", roles: [2, 3], icon: BarChart3 },
    { label: "Threat Library", path: "/instructor/library", roles: [2, 3], icon: ShieldAlert },

    { label: "System Config", path: "/admin/config", roles: [3], icon: Settings },
    { label: "User Access Control", path: "/admin/users", roles: [3], icon: ShieldAlert },
];

const Sidebar = ({ user, setUser }) => {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(true);

    if (!user) return null;

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    const getRoleTitle = (id) => {
        if (id === 3) return "Superadmin";
        if (id === 2) return "Instructor";
        return "Screener";
    };

    // ✅ LOGOUT HANDLER
    const handleLogout = async () => {
        try {
            const token = localStorage.getItem("token");

            if (token) {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            }
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            // 🔥 clear frontend state
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            setUser(null);
            router.replace("/Login");
        }
    };

    return (
        <aside
            className={`flex flex-col min-h-screen bg-slate-950 text-slate-50 border-r border-slate-800 transition-all duration-300 ${isCollapsed ? "w-20" : "w-72"
                }`}
        >
            {/* Header */}
            <div className="flex items-center h-16 px-4 border-b border-slate-800">
                {!isCollapsed && (
                    <div className="flex items-center gap-2 font-bold text-blue-500">
                        <Scan size={24} />
                        <span>X-RAY CBT</span>
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    className={`p-2 rounded-md hover:bg-slate-800 ${isCollapsed ? "mx-auto" : "ml-auto"
                        }`}
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/30">
                <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
                    <div className="w-10 h-10 rounded bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                        <User2Icon size={20} />
                    </div>
                    {!isCollapsed && (
                        <div>
                            <p className="font-semibold truncate">
                                {user.fname} {user.lname}
                            </p>
                            <p className="text-xs font-bold text-slate-500 uppercase">
                                {getRoleTitle(user.roleID)}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Menu */}
            <nav className="flex-1 p-3 space-y-1">
                {MENU_CONFIG.filter(i => i.roles.includes(user.roleID)).map(item => {
                    const isActive = pathname === item.path;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-3 px-3 py-3 rounded-md ${isActive
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                } ${isCollapsed ? "justify-center" : ""}`}
                        >
                            <Icon size={20} />
                            {!isCollapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    className={`flex items-center gap-3 w-full px-3 py-3 rounded-md text-slate-400 hover:bg-rose-950/30 hover:text-rose-400 ${isCollapsed ? "justify-center" : ""
                        }`}
                >
                    <LogOut size={20} />
                    {!isCollapsed && <span>System Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

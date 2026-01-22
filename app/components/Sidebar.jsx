"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    ChevronRight, ChevronLeft, Scan, History,
    Users, BarChart3, ShieldAlert, Settings,
    LogOut, Briefcase, User2Icon,
    WrenchIcon, ImageIcon, ChevronDown
} from "lucide-react";

// ✅ ROLE MAPPING: 1: Admin, 2: User (Screener), 3: Instructor
const MENU_GROUPS = [
    {
        groupLabel: "Operations",
        id: "ops",
        roles: [1, 2, 3],
        icon: Scan,
        items: [
            { label: "X-Ray Simulator (CBT)", path: "/sim", roles: [1, 2, 3], icon: Scan },
            { label: "My Training", path: "/training", roles: [1, 2], icon: Briefcase },
            { label: "Gallery", path: "/gallery", roles: [1, 2, 3], icon: ImageIcon },
        ]
    },
    {
        groupLabel: "Management",
        id: "mgt",
        roles: [1, 3],
        icon: Users,
        items: [
            { label: "Create Image", path: "/pages/createimage", roles: [1, 3], icon: ImageIcon },
            { label: "Class Management", path: "/instructor/classes", roles: [1, 3], icon: Users },
            { label: "Session Reports", path: "/instructor/reports", roles: [1, 3], icon: BarChart3 },
            { label: "Threat Library", path: "/instructor/library", roles: [1, 3], icon: ShieldAlert },
        ]
    },
    {
        groupLabel: "Support",
        id: "support",
        roles: [1, 2, 3],
        icon: WrenchIcon,
        items: [
            { label: "Corrective Action", path: "/profile", roles: [1, 2, 3], icon: WrenchIcon },
            { label: "Performance History", path: "/stats", roles: [1, 2], icon: History },
        ]
    },
    {
        groupLabel: "System",
        id: "sys",
        roles: [1],
        icon: Settings,
        items: [
            { label: "System Configuration", path: "/admin/config", roles: [1], icon: Settings },
            { label: "User Access Control", path: "/admin/users", roles: [1], icon: ShieldAlert },
        ]
    }
];

const Sidebar = ({ user, setUser }) => {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    // Track which groups are expanded
    const [expandedGroups, setExpandedGroups] = useState({
        ops: true, // Default open
        mgt: false,
        support: false,
        sys: false
    });

    if (!user) return null;

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    const toggleGroup = (groupId) => {
        if (isCollapsed) setIsCollapsed(false); // Auto-expand sidebar if a group is clicked
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    const getRoleTitle = (id) => {
        if (id === 1) return "Administrator";
        if (id === 3) return "Instructor";
        return "Screener / User";
    };

    const handleLogout = async () => {
        localStorage.clear();
        setUser(null);
        router.replace("/Login");
    };

    return (
        <aside
            className={`flex flex-col min-h-screen bg-slate-950 text-slate-50 border-r border-slate-800 transition-all duration-300 ${
                isCollapsed ? "w-20" : "w-80"
            }`}
        >
            {/* Logo Section */}
            <div className="flex items-center h-20 px-6 border-b border-slate-800">
                {!isCollapsed && (
                    <div className="flex items-center gap-3 font-bold text-blue-500">
                        <Scan size={28} />
                        <span className="whitespace-nowrap">X-RAY CBT</span>
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    className={`p-2 rounded-lg hover:bg-slate-800 transition-colors ${isCollapsed ? "mx-auto" : "ml-auto"}`}
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-4 overflow-y-auto overflow-x-hidden">
                {MENU_GROUPS.filter(group => group.roles.includes(user.roleID)).map((group) => {
                    const isExpanded = expandedGroups[group.id];
                    const GroupIcon = group.icon;
                    
                    return (
                        <div key={group.id} className="space-y-1">
                            {/* Group Header Toggle */}
                            <button
                                onClick={() => toggleGroup(group.id)}
                                className={`flex items-center gap-4 w-full px-4 py-3 rounded-xl transition-all hover:bg-slate-800/50 ${
                                    isCollapsed ? "justify-center" : "justify-between"
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <GroupIcon size={22} className="text-slate-500" />
                                    {!isCollapsed && (
                                        <span className="font-bold text-slate-400 uppercase tracking-widest text-base">
                                            {group.groupLabel}
                                        </span>
                                    )}
                                </div>
                                {!isCollapsed && (
                                    <ChevronDown 
                                        size={18} 
                                        className={`transition-transform duration-300 text-slate-500 ${isExpanded ? "rotate-180" : ""}`} 
                                    />
                                )}
                            </button>

                            {/* Sub-Items (Collapse Logic) */}
                            <div className={`overflow-hidden transition-all duration-300 ${
                                isExpanded && !isCollapsed ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                            }`}>
                                <div className="pl-6 space-y-1 mt-1">
                                    {group.items.filter(item => item.roles.includes(user.roleID)).map((item) => {
                                        const isActive = pathname === item.path;
                                        const Icon = item.icon;

                                        return (
                                            <Link
                                                key={item.path}
                                                href={item.path}
                                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                                                    isActive
                                                        ? "bg-blue-600 text-white shadow-lg"
                                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                                }`}
                                            >
                                                <Icon size={20} className="shrink-0" />
                                                <span className="font-medium whitespace-nowrap">{item.label}</span>
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
            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    className={`flex items-center gap-4 w-full px-4 py-4 rounded-xl text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 transition-all ${
                        isCollapsed ? "justify-center" : ""
                    }`}
                >
                    <LogOut size={22} className="shrink-0" />
                    {!isCollapsed && <span className="font-bold">System Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
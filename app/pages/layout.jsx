"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";

export default function PagesLayout({ children }) {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (!token || !userStr) {
            router.replace("/login");
            return;
        }

        setUser(JSON.parse(userStr));
        setLoading(false);
    }, [router]);

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div
            className="flex h-screen bg-cover bg-center overflow-hidden"
            style={{
                backgroundImage: "url('../images/pageBG.png')",
            }}
        >      <Sidebar user={user} setUser={setUser} />
            <main className="flex-1 p-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}

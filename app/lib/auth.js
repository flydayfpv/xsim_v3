// utils/auth.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3015";

/**
 * 1. ฟังก์ชันสำหรับ Decode JWT (Client-side)
 */
export const parseJwt = (token) => {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("JWT Parse Error:", e);
        return null;
    }
};

/**
 * 2. ฟังก์ชันหลักสำหรับดึงข้อมูล Operator โดยใช้ Token จาก LocalStorage
 */
export const getOperatorProfile = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    
    if (!token) throw new Error("NO_TOKEN");

    const decoded = parseJwt(token);
    if (!decoded || !decoded.userID) throw new Error("INVALID_TOKEN");

    try {
        const res = await fetch(`${API_URL}/auth/users/${decoded.userID}`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (res.status === 401) throw new Error("SESSION_EXPIRED");
        if (!res.ok) throw new Error("FETCH_FAILED");

        const userData = await res.json();
        
        // จัด Format ชื่อให้พร้อมใช้
        return {
            ...userData,
            fullName: `${userData.prefix || ""}${userData.firstName} ${userData.lastName}  : ${userData.division}`.trim(),
            userID: decoded.userID
        };
    } catch (err) {
        console.error("Auth Util Error:", err.message);
        throw err;
    }
};

export const clearGameSession = () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem("session_result");
    }
};
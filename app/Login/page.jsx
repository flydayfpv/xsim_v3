"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3020";
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      // 🔐 tokens
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      console.log("Login successful:", data.user);


      router.push("/pages/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('images/xsim-bg.png')" }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 w-full max-w-md rounded-xl bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl p-8">
        <div className="flex justify-center mb-6">
          <img
            src="images/aotavsec_logo.png"
            alt="AOT AVSEC"
            className="h-20 object-contain"
          />
        </div>

        <h1 className="text-xl font-bold text-center text-gray-200">
          Airport Security Training System
        </h1>
        <p className="text-center text-xl text-gray-200 mt-1">
          Authorized Personnel Login
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xl font-medium text-gray-200">
              Employee ID (EMID) / Citizen ID
            </label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xl font-medium text-gray-200">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          {error && (
            <p className="text-xl text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 rounded-md transition disabled:opacity-60"
          >
            {loading ? "Signing in..." : "SIGN IN"}
          </button>
        </form>

        <p className="mt-6 text-xs text-center text-gray-300 leading-relaxed">
          This system is restricted to authorized airport security personnel only.
          <br />
          Unauthorized access is prohibited and monitored.
        </p>
      </div>
    </div>
  );
}

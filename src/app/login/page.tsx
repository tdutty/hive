"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        role: "ADMIN",
        skipTwoFactor: "true",
        redirect: false,
      });

      if (res?.error) {
        if (res.error === "CredentialsSignin") {
          setError("Invalid email or password");
        } else {
          setError(res.error);
        }
      } else if (res?.ok) {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setError("Unable to connect — make sure SweetLease is running");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1e1e2d]">
      <div className="w-full max-w-md mx-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 flex items-center justify-center mb-4">
            <svg
              width="56"
              height="56"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16 2L28 8V16V24L16 30L4 24V16V8L16 2Z"
                fill="#D97706"
                stroke="#D97706"
                strokeWidth="1.5"
                strokeLinejoin="miter"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            HIVE
          </h1>
          <p className="text-sm text-[#a0a3b1] mt-1">
            SweetLease Admin Dashboard
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Sign in
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Use your SweetLease admin credentials
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="admin@urbanlease.com"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#6b7280] mt-6">
          Hive v1.0 — SweetLease Admin Panel
        </p>
      </div>
    </div>
  );
}

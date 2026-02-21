"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Department = {
  name: string;
  points: number;
};

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState<Record<string, string>>({});
  const [customDescription, setCustomDescription] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setDepartments(data.departments);
      setLoading(false);
    };
    load();
  }, []);

  // 🔐 Secure sync — sends password to server
  const sync = async (updated: Department[]) => {
    setDepartments(updated);

    await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        departments: updated,
        password: passwordInput,
      }),
    });
  };

  const applyChange = (
    index: number,
    amount: number,
    description: string
  ) => {
    const updated = [...departments];
    updated[index].points += amount;
    updated.sort((a, b) => b.points - a.points);
    sync(updated);
  };

  const handleCustom = (dept: string, index: number) => {
    const amount = Number(customAmount[dept]);
    const desc = customDescription[dept] || "Custom adjustment";

    if (isNaN(amount)) {
      alert("Enter a valid number");
      return;
    }

    applyChange(index, amount, desc);

    setCustomAmount((p) => ({ ...p, [dept]: "" }));
    setCustomDescription((p) => ({ ...p, [dept]: "" }));
  };

  // 🔐 Secure login — validated by server
  const handleLogin = async () => {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: passwordInput,
        test: true,
      }),
    });

    if (res.status === 401) {
      alert("Wrong password");
      return;
    }

    setIsAdmin(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-yellow-400 text-xl">
        Loading Safety System...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-black to-yellow-900 text-white p-6 sm:p-10 relative">

      {/* ---------- FIXED SIDEBAR (Right) ---------- */}
      <aside className="hidden lg:block fixed right-6 top-24 w-80 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl">
        <h3 className="text-xl font-semibold mb-4 text-yellow-400">
          Safety Infraction Key
        </h3>

        <ul className="space-y-3 text-sm">
          <li className="flex justify-between border-b border-white/10 pb-2">
            <span>No safety glasses</span>
            <span className="text-red-400 font-bold">-50</span>
          </li>

          <li className="flex justify-between border-b border-white/10 pb-2">
            <span>Horseplay / unsafe behavior</span>
            <span className="text-red-400 font-bold">-100</span>
          </li>

          <li className="flex justify-between border-b border-white/10 pb-2">
            <span>Improper tool use</span>
            <span className="text-red-400 font-bold">-75</span>
          </li>

          <li className="flex justify-between border-b border-white/10 pb-2">
            <span>Not cleaning workspace</span>
            <span className="text-red-400 font-bold">-25</span>
          </li>

          <li className="flex justify-between border-b border-white/10 pb-2">
            <span>Missing PPE</span>
            <span className="text-red-400 font-bold">-40</span>
          </li>

          <li className="flex justify-between border-b border-white/10 pb-2">
            <span>Unsafe robot operation</span>
            <span className="text-red-400 font-bold">-100</span>
          </li>

          <li className="flex justify-between">
            <span>Custom infraction</span>
            <span className="text-red-400 font-bold">Varies</span>
          </li>
        </ul>
      </aside>

      {/* ---------- MAIN CONTENT ---------- */}
      <div className="lg:mr-96"> {/* Leaves space for sidebar */}

        {/* Header */}
        <div className="flex flex-col items-center mb-14">
          <Image
            src="/RoboticsLogo.png"
            alt="Team 662 Robotics Logo"
            width={140}
            height={140}
            className="mb-4 drop-shadow-[0_0_25px_rgba(255,255,0,0.6)]"
            priority
          />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-center bg-gradient-to-r from-yellow-400 to-blue-400 bg-clip-text text-transparent">
            Safety Leaderboard
          </h1>
          <p className="text-zinc-400 mt-2">
            Rocky Mountain Robotics Safety Tracking System
          </p>
        </div>

        {/* Leaderboard */}
        <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6 text-yellow-400">
            Leaderboard
          </h2>

          <div className="space-y-4">
            {departments.map((d, i) => (
              <div
                key={d.name}
                className="flex items-center justify-between bg-white/5 hover:bg-white/10 transition p-4 rounded-xl border border-white/10 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-yellow-500 font-bold">
                    {i + 1}
                  </div>
                  <span className="text-lg font-medium">{d.name}</span>
                </div>

                <span className="text-yellow-300 text-xl font-bold">
                  {d.points}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Login */}
        {!isAdmin && (
          <div className="max-w-md mx-auto mt-14 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
            <h3 className="text-xl font-semibold mb-3 text-blue-400">
              Admin Login
            </h3>
            <input
              type="password"
              className="w-full p-2 rounded bg-black/50 border border-white/20"
              placeholder="Enter password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            <button
              onClick={handleLogin}
              className="mt-3 w-full bg-gradient-to-r from-blue-600 to-yellow-500 py-2 rounded font-semibold hover:opacity-90 transition"
            >
              Login
            </button>
          </div>
        )}

        {/* Admin Controls */}
        {isAdmin && (
          <div className="max-w-4xl mx-auto mt-14 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-semibold mb-6 text-blue-400">
              Admin Controls
            </h2>

            {departments.map((dept, i) => (
              <div
                key={dept.name}
                className="mb-6 border-b border-white/10 pb-6"
              >
                <h3 className="text-lg font-medium mb-3">
                  {dept.name} —{" "}
                  <span className="text-yellow-400">{dept.points} pts</span>
                </h3>

                <div className="flex gap-2 mb-3 flex-wrap">
                  <button
                    onClick={() => applyChange(i, -50, "Minor incident")}
                    className="bg-red-600 px-3 py-1 rounded text-sm"
                  >
                    -50
                  </button>
                  <button
                    onClick={() => applyChange(i, -100, "Major incident")}
                    className="bg-red-800 px-3 py-1 rounded text-sm"
                  >
                    -100
                  </button>
                  <button
                    onClick={() => applyChange(i, 10, "Correct answer")}
                    className="bg-green-600 px-3 py-1 rounded text-sm"
                  >
                    +10
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="number"
                    placeholder="Custom points"
                    className="p-2 rounded bg-black/50 border border-white/20 text-sm"
                    value={customAmount[dept.name] || ""}
                    onChange={(e) =>
                      setCustomAmount((p) => ({
                        ...p,
                        [dept.name]: e.target.value,
                      }))
                    }
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    className="p-2 rounded bg-black/50 border border-white/20 text-sm"
                    value={customDescription[dept.name] || ""}
                    onChange={(e) =>
                      setCustomDescription((p) => ({
                        ...p,
                        [dept.name]: e.target.value,
                      }))
                    }
                  />
                  <button
                    onClick={() => handleCustom(dept.name, i)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-yellow-500 rounded text-sm font-semibold"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Incident Log */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-yellow-400">
                Incident Log
              </h2>
              <span className="text-sm text-zinc-400">
                Live Google Sheets Feed
              </span>
            </div>

            <div className="rounded-xl overflow-hidden border border-yellow-500/30 shadow-inner">
              <iframe
                src="https://docs.google.com/spreadsheets/d/e/2PACX-1vR-yD4WEKawoutTLeDBKS9oFg5TJNyAdm9HmOhtVEqyWhnTNFCbGu-hFNEQxFDoCiGAZTZ8MliuIqjn/pubhtml?widget=true&headers=false"
                width="100%"
                height="500"
                className="bg-white"
              />
            </div>
          </div>
        </div>

        <footer className="text-center text-zinc-500 mt-16 text-sm">
          © {new Date().getFullYear()} Rocky Mountain Robotics. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
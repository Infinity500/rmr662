"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Department = {
  name: string;
  points: number;
};

type Infraction = {
  department: string;
  points: number;
  description: string;
  date: number;
};

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [infractions, setInfractions] = useState<Infraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState<Record<string, string>>({});
  const [customDescription, setCustomDescription] = useState<Record<string, string>>({});

  const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

  // Load leaderboard + infractions
  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();

      if (!data || !Array.isArray(data.departments)) {
        console.error("Invalid leaderboard data:", data);
        setDepartments([]);
      } else {
        setDepartments(data.departments);
      }

      const infra = await fetch("/api/infractions").then((r) => r.json());
      if (infra && Array.isArray(infra.infractions)) {
        setInfractions([...infra.infractions].reverse());
      }

      setLoading(false);
    };

    load();
  }, []);

  // Sync leaderboard
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

  // Apply change + log infraction
  const applyChange = async (index: number, amount: number, description: string) => {
  const deptName = departments[index].name;   // ⭐ Capture BEFORE sorting

  const updated = [...departments];
  updated[index].points += amount;
  updated.sort((a, b) => b.points - a.points);

  await sync(updated);

  await fetch("/api/infractions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      department: deptName,   // ⭐ Use original department
      points: amount,
      description,
      password: passwordInput,
    }),
  });

  await wait(150);

  const infra = await fetch("/api/infractions").then((r) => r.json());
  setInfractions([...infra.infractions].reverse());
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

  // Delete an incident
  const deleteInfraction = async (index: number) => {
    if (!confirm("Delete this incident?")) return;

    await fetch("/api/infractions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        index,
        password: passwordInput,
      }),
    });

    await wait(150);

    const infra = await fetch("/api/infractions").then((r) => r.json());
    if (infra && Array.isArray(infra.infractions)) {
      setInfractions([...infra.infractions].reverse());
    }
  };

  // Admin login
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

      {/* ---------- FIXED SIDEBAR ---------- */}
      <aside className="hidden lg:block fixed right-6 top-24 w-80 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl">
        <h3 className="text-xl font-semibold mb-4 text-yellow-400">Safety Infraction Key</h3>

        <ul className="space-y-3 text-sm">
          <li className="flex justify-between border-b border-white/10 pb-2">
            <span>No safety glasses</span><span className="text-red-400 font-bold">-50</span>
          </li>
          <li className="flex justify-between border-b border-white/10 pb-2">
            <span>Horseplay / unsafe behavior</span><span className="text-red-400 font-bold">-100</span>
          </li>
          <li className="flex justify-between border-b border-white/10 pb-2">
            <span>Improper tool use</span><span className="text-red-400 font-bold">-75</span>
          </li>
          <li className="flex justify-between border-b border-white/10 pb-2">
            <span>Not cleaning workspace</span><span className="text-red-400 font-bold">-25</span>
          </li>
          <li className="flex justify-between border-b border-white/10 pb-2">
            <span>Missing PPE</span><span className="text-red-400 font-bold">-40</span>
          </li>
          <li className="flex justify-between">
            <span>Custom infraction</span><span className="text-red-400 font-bold">Varies</span>
          </li>
        </ul>
      </aside>

      {/* ---------- MAIN CONTENT ---------- */}
      <div className="lg:mr-96">

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
          <p className="text-zinc-400 mt-2">Rocky Mountain Robotics Safety Tracking System</p>
        </div>

        {/* Leaderboard */}
        <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6 text-yellow-400">Leaderboard</h2>

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

                <span className="text-yellow-300 text-xl font-bold">{d.points}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Login */}
        {!isAdmin && (
          <div className="max-w-md mx-auto mt-14 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
            <h3 className="text-xl font-semibold mb-3 text-blue-400">Admin Login</h3>
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
            <h2 className="text-2xl font-semibold mb-6 text-blue-400">Admin Controls</h2>

            {departments.map((dept, i) => (
              <div key={dept.name} className="mb-6 border-b border-white/10 pb-6">
                <h3 className="text-lg font-medium mb-3">
                  {dept.name} — <span className="text-yellow-400">{dept.points} pts</span>
                </h3>

                <div className="flex gap-2 mb-3 flex-wrap">
                  <button onClick={() => applyChange(i, -50, "Minor incident")} className="bg-red-600 px-3 py-1 rounded text-sm">-50</button>
                  <button onClick={() => applyChange(i, -100, "Major incident")} className="bg-red-800 px-3 py-1 rounded text-sm">-100</button>
                  <button onClick={() => applyChange(i, 10, "Correct answer")} className="bg-green-600 px-3 py-1 rounded text-sm">+10</button>
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
              <h2 className="text-2xl font-semibold text-yellow-400">Incident Log</h2>
              <span className="text-sm text-zinc-400">Latest Safety Events</span>
            </div>

            <div className="space-y-4">
              {infractions.length === 0 && (
                <p className="text-zinc-400 text-center py-6">No incidents logged yet</p>
              )}

              {infractions.map((inf, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 border border-white/10 p-4 rounded-xl shadow-sm hover:bg-white/10 transition"
                >
                  <div className="flex justify-between">
                    <span className="font-semibold text-yellow-300">{inf.department}</span>
                    <span className={inf.points < 0 ? "text-red-400" : "text-green-400"}>
                      {inf.points > 0 ? "+" : ""}
                      {inf.points}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-300 mt-1">{inf.description}</p>

                  <p className="text-xs text-zinc-500 mt-2">
                    {new Date(inf.date).toLocaleString()}
                  </p>

                  {/* Admin-only delete button at bottom */}
                  {isAdmin && (
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={() => deleteInfraction(idx)}
                        className="text-red-400 hover:text-red-600 text-sm font-bold"
                      >
                        ✕ Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
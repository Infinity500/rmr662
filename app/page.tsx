"use client";

import { useEffect, useState } from "react";

type Department = {
  name: string;
  points: number;
};

const ADMIN_PASSWORD = "roboticsSafety123";

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [customAmount, setCustomAmount] = useState<Record<string, string>>({});
  const [customDescription, setCustomDescription] = useState<
    Record<string, string>
  >({});

  // Load leaderboard from backend
  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setDepartments(data.departments);
      setLoading(false);
    };
    load();
  }, []);

  const sync = async (updated: Department[]) => {
    setDepartments(updated);
    await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departments: updated }),
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-black text-black dark:text-white p-6 sm:p-10">
      <h1 className="text-4xl font-bold text-center mb-10">
        Robotics Safety Leaderboard
      </h1>

      {/* Leaderboard */}
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 p-6 rounded-xl shadow">
        <h2 className="text-2xl font-semibold mb-4">Leaderboard</h2>

        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-700">
              <th className="py-2">Rank</th>
              <th className="py-2">Department</th>
              <th className="py-2">Points</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d, i) => (
              <tr key={d.name} className="border-b border-zinc-800">
                <td className="py-2">{i + 1}</td>
                <td className="py-2">{d.name}</td>
                <td className="py-2 font-semibold">{d.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Admin Login */}
      {!isAdmin && (
        <div className="max-w-md mx-auto mt-10">
          <h3 className="text-xl font-semibold mb-2">Admin Login</h3>
          <input
            type="password"
            className="w-full p-2 rounded bg-zinc-200 dark:bg-zinc-800"
            placeholder="Enter password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
          />
          <button
            onClick={() =>
              passwordInput === ADMIN_PASSWORD
                ? setIsAdmin(true)
                : alert("Wrong password")
            }
            className="mt-3 w-full bg-blue-600 text-white py-2 rounded"
          >
            Login
          </button>
        </div>
      )}

      {/* Admin Controls */}
      {isAdmin && (
        <div className="max-w-3xl mx-auto mt-10 bg-white dark:bg-zinc-900 p-6 rounded-xl shadow">
          <h2 className="text-2xl font-semibold mb-4">Admin Controls</h2>

          {departments.map((dept, i) => (
            <div key={dept.name} className="mb-6 border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-medium mb-2">
                {dept.name} — {dept.points} pts
              </h3>

              <div className="flex gap-2 mb-3">
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
                  className="p-2 rounded bg-zinc-200 dark:bg-zinc-800 text-sm"
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
                  className="p-2 rounded bg-zinc-200 dark:bg-zinc-800 text-sm"
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
                  className="px-4 py-2 bg-blue-600 rounded text-sm text-white"
                >
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Google Sheets Embed */}
      <div className="max-w-3xl mx-auto mt-10 bg-white dark:bg-zinc-900 p-6 rounded-xl shadow">
        <h2 className="text-2xl font-semibold mb-4">Incident Log</h2>

        <iframe
          src="https://docs.google.com/spreadsheets/d/e/2PACX-1vR-yD4WEKawoutTLeDBKS9oFg5TJNyAdm9HmOhtVEqyWhnTNFCbGu-hFNEQxFDoCiGAZTZ8MliuIqjn/pubhtml?widget=true&headers=false"
          width="100%"
          height="600"
          className="rounded-lg border border-zinc-300 dark:border-zinc-700"
        />
      </div>
    </div>
  );
}

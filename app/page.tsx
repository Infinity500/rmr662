"use client";

import { useState } from "react";

type Department = {
  name: string;
  points: number;
};

export default function Home() {
  const ADMIN_PASSWORD = "roboticsSafety123"; // move to env later

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");

  const [departments, setDepartments] = useState<Department[]>([
    { name: "Mechanical", points: 500 },
    { name: "Electrical", points: 500 },
    { name: "Programming", points: 500 },
    { name: "CAD", points: 500 },
  ]);

  const [incidentLog, setIncidentLog] = useState<string[]>([]);
  const [incidentText, setIncidentText] = useState<string>("");

  const handleLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
    } else {
      alert("Incorrect password");
    }
  };

  const updatePoints = (
    index: number,
    amount: number,
    description: string
  ) => {
    const updated = [...departments];
    updated[index].points += amount;
    setDepartments(updated);

    setIncidentLog((prev) => [
      ...prev,
      `${updated[index].name}: ${description} (${amount > 0 ? "+" : ""}${amount})`,
    ]);
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-black text-black dark:text-white p-10">
      <h1 className="text-4xl font-bold mb-10 text-center">
        Robotics Safety Leaderboard
      </h1>

      {/* Leaderboard */}
      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 p-6 rounded-xl shadow">
        <h2 className="text-2xl font-semibold mb-4">Leaderboard</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-700">
              <th className="py-2">Department</th>
              <th className="py-2">Points</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept, i) => (
              <tr key={i} className="border-b border-zinc-800">
                <td className="py-2">{dept.name}</td>
                <td className="py-2 font-semibold">{dept.points}</td>
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
            placeholder="Enter password"
            className="w-full p-2 rounded bg-zinc-200 dark:bg-zinc-800"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
          />
          <button
            onClick={handleLogin}
            className="mt-3 w-full bg-blue-600 text-white py-2 rounded"
          >
            Login
          </button>
        </div>
      )}

      {/* Admin Controls */}
      {isAdmin && (
        <div className="max-w-2xl mx-auto mt-10 bg-white dark:bg-zinc-900 p-6 rounded-xl shadow">
          <h2 className="text-2xl font-semibold mb-4">Admin Controls</h2>

          {departments.map((dept, i) => (
            <div key={i} className="mb-4">
              <h3 className="text-lg font-medium">{dept.name}</h3>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => updatePoints(i, -50, "Minor incident")}
                  className="bg-red-600 px-3 py-1 rounded"
                >
                  -50
                </button>
                <button
                  onClick={() => updatePoints(i, -100, "Major incident")}
                  className="bg-red-800 px-3 py-1 rounded"
                >
                  -100
                </button>
                <button
                  onClick={() => updatePoints(i, 10, "Correct safety answer")}
                  className="bg-green-600 px-3 py-1 rounded"
                >
                  +10
                </button>
              </div>
            </div>
          ))}

          {/* Incident Notes */}
          <textarea
            className="w-full mt-4 p-2 rounded bg-zinc-200 dark:bg-zinc-800"
            placeholder="Add incident notes..."
            value={incidentText}
            onChange={(e) => setIncidentText(e.target.value)}
          />
          <button
            onClick={() => {
              if (incidentText.trim().length > 0) {
                setIncidentLog((prev) => [...prev, incidentText]);
                setIncidentText("");
              }
            }}
            className="mt-3 w-full bg-blue-600 text-white py-2 rounded"
          >
            Add Note
          </button>
        </div>
      )}

      {/* Incident Log */}
      <div className="max-w-2xl mx-auto mt-10 bg-white dark:bg-zinc-900 p-6 rounded-xl shadow">
        <h2 className="text-2xl font-semibold mb-4">Incident Log</h2>
        <ul className="space-y-2">
          {incidentLog.map((log, i) => (
            <li key={i} className="border-b border-zinc-800 pb-2">
              {log}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

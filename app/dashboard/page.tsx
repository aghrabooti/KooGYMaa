"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = document.cookie.split("; ").find(row => row.startsWith("token="))?.split("=")[1];
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      setUser({ name: "User", role: payload.role });
    } catch (err) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  };

  if (!user) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-2">Welcome!</h2>
        <p className="text-gray-600">Role: {user.role}</p>
      </div>

      {user.role === "ADMIN" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/admin/gyms" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg">
            <h3 className="text-lg font-semibold">Manage Gyms</h3>
            <p className="text-gray-600">Add, edit, delete gyms</p>
          </a>
          <a href="/admin/users" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg">
            <h3 className="text-lg font-semibold">Manage Users</h3>
            <p className="text-gray-600">View and manage users</p>
          </a>
          <a href="/admin/subscriptions" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg">
            <h3 className="text-lg font-semibold">Subscriptions</h3>
            <p className="text-gray-600">Manage gym subscriptions</p>
          </a>
        </div>
      )}

      {user.role === "TRAINER" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/trainer/students" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg">
            <h3 className="text-lg font-semibold">My Students</h3>
            <p className="text-gray-600">View your students</p>
          </a>
          <a href="/trainer/workouts" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg">
            <h3 className="text-lg font-semibold">Workout Plans</h3>
            <p className="text-gray-600">Create and manage plans</p>
          </a>
          <a href="/trainer/diets" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg">
            <h3 className="text-lg font-semibold">Diet Plans</h3>
            <p className="text-gray-600">Create and manage diets</p>
          </a>
        </div>
      )}

      {user.role === "USER" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/user/gyms" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg">
            <h3 className="text-lg font-semibold">Browse Gyms</h3>
            <p className="text-gray-600">Find and join gyms</p>
          </a>
          <a href="/user/trainers" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg">
            <h3 className="text-lg font-semibold">Browse Trainers</h3>
            <p className="text-gray-600">Find trainers</p>
          </a>
          <a href="/user/plans" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg">
            <h3 className="text-lg font-semibold">My Plans</h3>
            <p className="text-gray-600">View workout and diet plans</p>
          </a>
        </div>
      )}
    </div>
  );
}
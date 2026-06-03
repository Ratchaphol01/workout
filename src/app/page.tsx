"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dumbbell, User } from "lucide-react";
import { WorkoutEntry } from "@/lib/types";
import { calcCalories } from "@/lib/utils";
import Dashboard from "@/components/Dashboard";
import WeightUpdateModal from "@/components/WeightUpdateModal";

interface AuthUser {
  userId: string;
  email: string;
  name: string;
  weight?: number;
  height?: number;
  age?: number;
  gender?: string;
  profileComplete?: boolean;
  weightUpdatedAt?: string;
}

export default function Home() {
  const router = useRouter();
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWeightModal, setShowWeightModal] = useState(false);

  const fetchWorkouts = useCallback(async () => {
    try {
      const [workoutRes, sessionRes] = await Promise.all([
        fetch("/api/workouts"),
        fetch("/api/sessions?limit=30"),
      ]);
      if (!workoutRes.ok) return;
      const workoutData = await workoutRes.json();
      const sessionData = sessionRes.ok ? await sessionRes.json() : { sessions: [] };

      // Merge strength sessions as WorkoutEntry so the dashboard donut includes them
      const sessionEntries = (sessionData.sessions ?? [])
        .filter((s: { duration?: number }) => (s.duration ?? 0) > 0)
        .map((s: { _id: string; date: string; duration?: number; totalCalories?: number }) => ({
          id: s._id,
          date: s.date,
          type: "Weight Training" as const,
          duration: s.duration ?? 0,
          calories: s.totalCalories ?? calcCalories("Weight Training", s.duration ?? 0, authUser?.weight ?? 70),
        }));

      setEntries([...workoutData.workouts, ...sessionEntries]);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    const failsafe = setTimeout(() => {
      setLoading(false);
      router.push("/login");
    }, 8000);

    fetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) { router.push("/login"); return null; }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        if (!d.user) { router.push("/login"); return; }
        const u = d.user as AuthUser;
        setAuthUser(u);
        if (!u.profileComplete) { router.push("/profile/setup"); return; }
      })
      .catch(() => router.push("/login"))
      .finally(() => { clearTimeout(failsafe); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch on every mount (covers in-app navigation) + re-fetch on window focus / tab switch
  useEffect(() => {
    fetchWorkouts();

    const onFocus = () => fetchWorkouts();
    const onVisible = () => { if (document.visibilityState === "visible") fetchWorkouts(); };
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) fetchWorkouts(); };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [fetchWorkouts]);

  const handleUpdateWeight = useCallback(async (weight: number) => {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight }),
    });
    if (res.ok) {
      const data = await res.json();
      setAuthUser((prev) =>
        prev
          ? {
              ...prev,
              weight: data.profile.weight,
              weightUpdatedAt: data.profile.weightUpdatedAt,
            }
          : prev
      );
    }
  }, []);


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center animate-pulse">
            <Dumbbell size={20} className="text-white" />
          </div>
          <p className="text-sm text-slate-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
              <Dumbbell size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-800 text-lg">WorkoutLog</span>
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            {authUser && (
              <span className="hidden md:flex items-center gap-1.5 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                <span className="font-medium">{authUser.name}</span>
                {authUser.weight && (
                  <span className="text-slate-400">· {authUser.weight} kg</span>
                )}
              </span>
            )}
            <Link
              href="/profile"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
              title="โปรไฟล์ & ตั้งค่า"
            >
              <User size={19} />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <Dashboard
          entries={entries}
          weightKg={authUser?.weight}
          weightUpdatedAt={authUser?.weightUpdatedAt}
          onUpdateWeight={() => setShowWeightModal(true)}
        />
      </main>

      {showWeightModal && (
        <WeightUpdateModal
          currentWeight={authUser?.weight}
          onClose={() => setShowWeightModal(false)}
          onSave={handleUpdateWeight}
        />
      )}
    </div>
  );
}

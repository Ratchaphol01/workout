"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type Status = "unsupported" | "denied" | "subscribed" | "unsubscribed" | "loading";

export default function PushNotificationToggle({ showLabel = false }: { showLabel?: boolean }) {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "subscribed" : "unsubscribed"))
      .catch(() => setStatus("unsubscribed"));
  }, []);

  async function subscribe() {
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setStatus("denied"); return; }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setStatus("subscribed");
    } catch {
      setStatus("unsubscribed");
    }
  }

  async function unsubscribe() {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("unsubscribed");
    } catch {
      setStatus("unsubscribed");
    }
  }

  if (status === "unsupported") {
    if (showLabel) {
      return <span className="text-xs text-slate-400">ไม่รองรับในอุปกรณ์นี้</span>;
    }
    return null;
  }

  if (status === "denied") {
    if (showLabel) {
      return (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <BellOff size={16} />
          <span>ถูกบล็อกจาก browser</span>
        </div>
      );
    }
    return (
      <button title="การแจ้งเตือนถูกบล็อก" className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300">
        <BellOff size={17} />
      </button>
    );
  }

  const isSubscribed = status === "subscribed";
  const isLoading = status === "loading";

  // Label variant (used in Profile page)
  if (showLabel) {
    return (
      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
          isSubscribed
            ? "bg-violet-100 text-violet-700 hover:bg-violet-200"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        } disabled:opacity-50`}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isSubscribed ? (
          <Bell size={15} className="fill-violet-500 text-violet-500" />
        ) : (
          <Bell size={15} />
        )}
        {isLoading ? "..." : isSubscribed ? "เปิดอยู่" : "ปิดอยู่"}
      </button>
    );
  }

  // Icon-only variant (used in header)
  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      title={isSubscribed ? "ปิดการแจ้งเตือน" : "เปิดการแจ้งเตือน"}
      className={`relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
        isSubscribed ? "text-violet-600 hover:bg-violet-50" : "text-slate-400 hover:bg-slate-100"
      } disabled:opacity-50`}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isSubscribed ? (
        <>
          <Bell size={17} className="fill-violet-500 text-violet-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full" />
        </>
      ) : (
        <Bell size={17} />
      )}
    </button>
  );
}

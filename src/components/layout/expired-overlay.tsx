"use client";

import { Ban } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function ExpiredOverlay() {
  const { isExpired, isAgencyOwner } = useAuth();

  // Agency owners can still view expired accounts
  if (!isExpired || isAgencyOwner) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
      <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-xl p-8 text-center shadow-2xl">
        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
          <Ban className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Subscription Expired</h1>
        <p className="text-slate-400 mb-6">
          Your workspace's subscription has ended. Access to the CRM and messaging features has been locked.
        </p>
        <p className="text-sm text-slate-500">
          Please contact your agency provider to renew your subscription and restore access.
        </p>
      </div>
    </div>
  );
}

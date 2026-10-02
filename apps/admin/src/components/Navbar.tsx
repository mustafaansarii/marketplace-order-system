import React from 'react';
import { Store } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="bg-white border-b border-slate-200/60 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-xl shadow-sm shadow-blue-200">
          <Store className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">KitchenOS</h1>
      </div>
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        <div className="text-sm font-medium text-slate-500">Provider Simulator</div>
      </div>
    </header>
  );
}

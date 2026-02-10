"use client";

import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: SearchInputProps) {
  return (
    <div className="relative w-full max-w-md">
      <Search
        size={20}
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md bg-white text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
      />
    </div>
  );
}

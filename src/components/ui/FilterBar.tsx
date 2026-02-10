"use client";

interface FilterOption {
  key: string;
  label: string;
}

interface FilterBarProps {
  filters: FilterOption[];
  selected: string;
  onChange: (key: string) => void;
}

export function FilterBar({ filters, selected, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onChange(filter.key)}
          className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
            selected === filter.key
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

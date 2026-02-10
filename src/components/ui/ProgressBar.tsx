interface ProgressBarProps {
  value: number;
  color?: string;
  label?: string;
  showValue?: boolean;
}

export function ProgressBar({
  value,
  color = "bg-amber-600",
  label,
  showValue = false,
}: ProgressBarProps) {
  // Ensure value is between 0 and 100
  const normalizedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className="w-full">
      {/* Label and Value */}
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-slate-700">{label}</span>
          )}
          {showValue && (
            <span className="text-sm font-medium text-slate-700">
              {normalizedValue}%
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="h-2 bg-slate-100 rounded-full relative overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-200`}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  );
}

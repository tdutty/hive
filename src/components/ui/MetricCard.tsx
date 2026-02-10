import { ArrowUp, ArrowDown } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon: LucideIcon;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  className = "",
}: MetricCardProps) {
  const isPositive = trend && trend > 0;

  return (
    <div
      className={`relative bg-white border border-slate-200 rounded-lg shadow-sm p-6 transition-all duration-200 ${className}`}
    >
      {/* Icon - Top Right */}
      <div className="absolute top-6 right-6 bg-amber-50 rounded-lg p-2">
        <Icon size={24} className="text-amber-600" />
      </div>

      {/* Content */}
      <div className="pr-12">
        {/* Title */}
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          {title}
        </p>

        {/* Value */}
        <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>

        {/* Subtitle or Trend */}
        <div className="flex items-center gap-2">
          {trend !== undefined ? (
            <>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  isPositive
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {isPositive ? (
                  <ArrowUp size={16} />
                ) : (
                  <ArrowDown size={16} />
                )}
                {Math.abs(trend)}%
              </span>
              <span className="text-xs text-slate-500">vs last period</span>
            </>
          ) : subtitle ? (
            <p className="text-sm text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusColorMap: Record<string, { bg: string; text: string; border: string }> = {
  active: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  inactive: {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
  },
  pending: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  pending_review: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  approved: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  rejected: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  suspended: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  healthy: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  degraded: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  down: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  expired: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  info: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  default: {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
  },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const colors = statusColorMap[status.toLowerCase()] || statusColorMap.default;

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center border rounded-full font-medium transition-all duration-200 ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]}`}
    >
      {status}
    </span>
  );
}

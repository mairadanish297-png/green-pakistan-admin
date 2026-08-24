interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  delay?: number;
}

export default function StatsCard({
  title,
  value,
  icon,
  change,
  changeType = "neutral",
  delay = 0,
}: StatsCardProps) {
  const changeColor = {
    positive: "var(--emerald)",
    negative: "var(--danger)",
    neutral: "var(--text-secondary)",
  };

  return (
    <div
      className="rounded-xl p-5 border card-hover animate-fade-in"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border)",
        animationDelay: `${delay}s`,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
            {title}
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {value}
          </p>
          {change && (
            <p className="text-xs mt-2" style={{ color: changeColor[changeType] }}>
              {change}
            </p>
          )}
        </div>
        <div
          className="text-2xl w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(46,204,113,0.1)" }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
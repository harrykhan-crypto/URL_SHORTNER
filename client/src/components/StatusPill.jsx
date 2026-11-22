import React from "react";

const STATES = {
  checking: { label: "Connecting", dot: "bg-muted" },
  waking: { label: "Waking server", dot: "bg-amber-500 animate-pulse" },
  online: { label: "Online", dot: "bg-success" },
  offline: { label: "Offline", dot: "bg-danger" },
};

const StatusPill = ({ status }) => {
  const s = STATES[status] ?? STATES.checking;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border-2 border-line bg-surface px-3 py-1 text-xs font-semibold"
      role="status"
      aria-live="polite"
    >
      <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  );
};

export default StatusPill;

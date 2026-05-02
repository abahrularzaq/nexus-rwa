const items = [
  { sym: "ONDO-USDY", yield: "5.42%", chg: "+0.03%", up: true },
  { sym: "MAPLE-USDC", yield: "8.91%", chg: "-0.12%", up: false },
  { sym: "BACKED-BUIDL", yield: "4.88%", chg: "+0.01%", up: true },
  { sym: "CENTRIFUGE", yield: "9.34%", chg: "+0.21%", up: true },
  { sym: "OPENEDON", yield: "5.15%", chg: "-0.05%", up: false },
  { sym: "ONDO-OUSG", yield: "5.28%", chg: "+0.08%", up: true },
  { sym: "REALT", yield: "11.20%", chg: "+0.84%", up: true },
  { sym: "GOLDFINCH", yield: "12.40%", chg: "-0.31%", up: false },
];

export function Ticker() {
  const row = (
    <div className="flex items-center shrink-0">
      {items.map((it, i) => (
        <div key={i} className="flex items-center px-8 text-[13px] font-medium shrink-0">
          <span className="text-white">{it.sym}</span>
          <span className="mx-2 text-white tabular">{it.yield}</span>
          <span
            className="tabular"
            style={{ color: it.up ? "var(--accent-green)" : "var(--accent-red)" }}
          >
            {it.chg} {it.up ? "↑" : "↓"}
          </span>
          <span className="ml-8" style={{ color: "var(--text-muted)" }}>·</span>
        </div>
      ))}
    </div>
  );

  return (
    <div
      className="relative h-12 overflow-hidden flex items-center"
      style={{
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border-line)",
        borderBottom: "1px solid var(--border-line)",
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-6 gap-2"
        style={{
          background:
            "linear-gradient(90deg, var(--bg-secondary) 75%, transparent)",
        }}
      >
        <span
          className="w-2 h-2 rounded-full pulse-dot"
          style={{ background: "var(--accent-red)", boxShadow: "0 0 8px #FF4444" }}
        />
        <span className="text-[13px] font-bold" style={{ color: "var(--accent-red)" }}>
          LIVE
        </span>
      </div>
      <div className="ticker-track flex">
        {row}
        {row}
      </div>
    </div>
  );
}

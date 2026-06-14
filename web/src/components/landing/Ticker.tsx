const items: { sym: string; yield: string; chg: string; up: boolean | null }[] = [
  { sym: "ONDO-OUSG", yield: "5.20%", chg: "-1.31%", up: false },
  { sym: "BENJI", yield: "4.85%", chg: "+0.42%", up: true },
  { sym: "MAPLE-MUSDC", yield: "8.91%", chg: "-1.80%", up: false },
  { sym: "ONDO-USDY", yield: "5.10%", chg: "syncing", up: null },
  { sym: "SUPERSTATE-USTB", yield: "4.92%", chg: "syncing", up: null },
  { sym: "BACKED-BC3M", yield: "5.00%", chg: "syncing", up: null },
  { sym: "CENTRIFUGE-CFG", yield: "8.50%", chg: "syncing", up: null },
  { sym: "GOLDFINCH-GFI", yield: "10.20%", chg: "syncing", up: null },
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
            style={{
              color:
                it.up === null
                  ? "var(--text-secondary)"
                  : it.up
                    ? "var(--accent-green)"
                    : "var(--accent-red)",
            }}
          >
            {it.chg} {it.up === null ? "" : it.up ? "↑" : "↓"}
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
          className="w-2 h-2 rounded-full"
          style={{ background: "var(--accent-cyan)", boxShadow: "0 0 8px #00D4FF" }}
        />
        <span className="text-[13px] font-bold" style={{ color: "var(--accent-cyan)" }}>
          SEED PREVIEW
        </span>
      </div>
      <div className="ticker-track flex">
        {row}
        {row}
      </div>
    </div>
  );
}

export function PageHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-[26px] font-extrabold text-navy">{title}</h2>
      {sub && <p className="mt-1 text-slate">{sub}</p>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="p-9 text-center text-[14px] text-slate">{children}</div>;
}

export function Toggle({ on, onChange }: { on: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!on)}
      className={`relative h-6 w-[42px] flex-none rounded-full transition ${on ? "bg-cyan" : "bg-gray-300"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-0.5" : "right-0.5"}`} />
    </button>
  );
}

export function Stat({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div className="card border-t-[3px] p-5" style={{ borderTopColor: color }}>
      <div className="text-[30px] font-extrabold leading-none" style={{ color }}>{value}</div>
      <div className="mt-1.5 text-[12.5px] font-bold text-slate">{label}</div>
    </div>
  );
}

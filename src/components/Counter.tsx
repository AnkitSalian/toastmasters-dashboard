export default function Counter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="flex h-5 w-5 items-center justify-center rounded border border-slate-300 text-xs text-slate-500 hover:bg-slate-100"
      >
        −
      </button>
      <span className="w-4 text-center text-sm tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="flex h-5 w-5 items-center justify-center rounded border border-slate-300 text-xs text-slate-500 hover:bg-slate-100"
      >
        +
      </button>
    </div>
  );
}

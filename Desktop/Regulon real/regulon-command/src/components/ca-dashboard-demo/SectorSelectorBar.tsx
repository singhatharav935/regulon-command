/**
 * SectorSelectorBar — DEMO version
 * src/components/ca-dashboard-demo/SectorSelectorBar.tsx
 *
 * Horizontal bar of professional text-only sector pills for CADashboard (demo).
 * EXCLUSIVELY for the demo dashboard — real dashboard has its own separate copy.
 */

import { type ClientSector, SECTOR_CONFIGS } from "@/lib/client-sector";

interface DemoSectorSelectorBarProps {
  globalSector: ClientSector | null;
  onSectorChange: (sector: ClientSector | null) => void;
}

const DEMO_SECTOR_PILLS: { id: ClientSector | null; label: string }[] = [
  { id: null,          label: "All Sectors" },
  { id: "msme",        label: "MSME" },
  { id: "corporate",   label: "Corporate" },
  { id: "banking",     label: "Banking / NBFC" },
  { id: "individual",  label: "Individual / HUF" },
  { id: "startup",     label: "Startup" },
  { id: "ngo",         label: "NGO / Trust" },
];

export function DemoSectorSelectorBar({
  globalSector,
  onSectorChange,
}: DemoSectorSelectorBarProps) {
  return (
    <div className="flex items-center gap-2 mt-4 mb-2 overflow-x-auto pb-1 scrollbar-none">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap flex-shrink-0 pr-1">
        Practice Area
      </span>
      <div className="w-px h-5 bg-border/60 flex-shrink-0" />

      {DEMO_SECTOR_PILLS.map(({ id, label }) => {
        const isActive = globalSector === id;
        const cfg = id ? SECTOR_CONFIGS[id] : null;

        const activeCls = isActive
          ? cfg
            ? `${cfg.bgColor} ${cfg.borderColor} ${cfg.color} font-semibold`
            : "bg-teal-500/15 border-teal-500/40 text-teal-400 font-semibold"
          : "bg-transparent border-border/40 text-muted-foreground hover:border-border hover:text-foreground";

        return (
          <button
            key={id ?? "all"}
            type="button"
            onClick={() => onSectorChange(id)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg border text-xs transition-all duration-200 whitespace-nowrap ${activeCls}`}
            aria-pressed={isActive}
            aria-label={`Filter dashboard by ${label}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

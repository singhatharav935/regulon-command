/**
 * ClientSectorBadge (DEMO dashboard version)
 * Identical UI to the real version but saves sector to 'demo_client_meta' in localStorage.
 * Used inside demo ClientPortfolioSection.tsx ONLY. Never import in real dashboard.
 */
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  type ClientSector, SELECTABLE_SECTORS, getSectorConfig,
} from '@/lib/client-sector';
import { toast } from 'sonner';

interface DemoClientSectorBadgeProps {
  clientId: string;
  currentSector: ClientSector;
  onSectorChange?: (sector: ClientSector) => void;
  readonly?: boolean;
}

export function DemoClientSectorBadge({
  clientId,
  currentSector,
  onSectorChange,
  readonly = false,
}: DemoClientSectorBadgeProps) {
  const [sector, setSector] = useState<ClientSector>(currentSector || 'general');
  const config = getSectorConfig(sector);

  const handleChange = (newSector: ClientSector) => {
    setSector(newSector);
    // Persist to DEMO-specific localStorage key — never touches real ca_client_meta
    const meta = JSON.parse(localStorage.getItem('demo_client_meta') || '{}');
    meta[clientId] = { ...(meta[clientId] || {}), sector: newSector };
    localStorage.setItem('demo_client_meta', JSON.stringify(meta));
    onSectorChange?.(newSector);
    const newConfig = getSectorConfig(newSector);
    toast.success(`[Demo] Sector set to ${newConfig.label}`, {
      description: `${newConfig.emoji} ${newConfig.description}`,
    });
  };

  if (readonly) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${config.badgeCls}`}>
        {config.emoji} {config.shortLabel}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 text-[10px] px-2 py-0.5 rounded-full border gap-1 font-medium ${config.badgeCls} hover:opacity-80 transition-opacity`}
        >
          {config.emoji} {config.shortLabel}
          <ChevronDown className="w-2.5 h-2.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="bg-card border-border/60 min-w-[200px]"
      >
        <p className="text-[10px] text-muted-foreground px-2 py-1 font-medium uppercase tracking-wide">
          Set Demo Client Sector
        </p>
        {SELECTABLE_SECTORS.map((s) => {
          const sc = getSectorConfig(s);
          return (
            <DropdownMenuItem
              key={s}
              onClick={() => handleChange(s)}
              className={`text-xs gap-2 cursor-pointer ${sector === s ? 'font-bold' : ''}`}
            >
              <span>{sc.emoji}</span>
              <span className={sc.color}>{sc.label}</span>
              {sector === s && <span className="ml-auto text-[9px] opacity-60">✓ active</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

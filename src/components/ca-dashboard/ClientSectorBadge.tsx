/**
 * ClientSectorBadge (REAL dashboard version)
 * Dropdown to assign/view sector on a client card.
 * Saves sector to localStorage ca_client_meta (backward compatible with Supabase industry column).
 * Used inside real ClientPortfolioSection.tsx only.
 */
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  type ClientSector, SELECTABLE_SECTORS, getSectorConfig,
} from '@/lib/client-sector';
import { toast } from 'sonner';

interface ClientSectorBadgeProps {
  clientId: string;
  currentSector: ClientSector;
  onSectorChange?: (sector: ClientSector) => void;
  readonly?: boolean;
}

export function ClientSectorBadge({
  clientId,
  currentSector,
  onSectorChange,
  readonly = false,
}: ClientSectorBadgeProps) {
  const [sector, setSector] = useState<ClientSector>(currentSector || 'general');
  const config = getSectorConfig(sector);

  const handleChange = (newSector: ClientSector) => {
    setSector(newSector);
    // Persist to localStorage meta (real dashboard uses this + derives Supabase industry)
    const meta = JSON.parse(localStorage.getItem('ca_client_meta') || '{}');
    meta[clientId] = { ...(meta[clientId] || {}), sector: newSector };
    localStorage.setItem('ca_client_meta', JSON.stringify(meta));
    onSectorChange?.(newSector);
    const newConfig = getSectorConfig(newSector);
    toast.success(`Client sector updated to ${newConfig.label}`, {
      description: `${newConfig.emoji} ${newConfig.description}`,
    });
  };

  if (readonly) {
    return (
      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border ${config.badgeCls}`}>
        {config.emoji} {config.shortLabel}
      </Badge>
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
          Set Client Sector
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

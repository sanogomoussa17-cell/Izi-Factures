'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Check, RotateCcw, Filter, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type PresetPeriod =
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'LAST_30_DAYS'
  | 'THIS_QUARTER'
  | 'THIS_YEAR'
  | 'ALL_TIME'
  | 'CUSTOM';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  preset: PresetPeriod;
  label: string;
}

interface DateRangeFilterProps {
  onRangeChange: (range: DateRange) => void;
  activeRange: DateRange;
}

export function getDateRangeFromPreset(preset: PresetPeriod): { startDate: string; endDate: string; label: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  const format = (d: Date) => d.toISOString().split('T')[0];

  switch (preset) {
    case 'THIS_MONTH': {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      return {
        startDate: format(firstDay),
        endDate: format(lastDay),
        label: 'Ce mois-ci',
      };
    }
    case 'LAST_MONTH': {
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      return {
        startDate: format(firstDay),
        endDate: format(lastDay),
        label: 'Le mois dernier',
      };
    }
    case 'LAST_30_DAYS': {
      const start = new Date();
      start.setDate(now.getDate() - 30);
      return {
        startDate: format(start),
        endDate: format(now),
        label: 'Les 30 derniers jours',
      };
    }
    case 'THIS_QUARTER': {
      const quarter = Math.floor(month / 3);
      const firstDay = new Date(year, quarter * 3, 1);
      const lastDay = new Date(year, (quarter + 1) * 3, 0);
      return {
        startDate: format(firstDay),
        endDate: format(lastDay),
        label: `Ce trimestre (T${quarter + 1} ${year})`,
      };
    }
    case 'THIS_YEAR': {
      const firstDay = new Date(year, 0, 1);
      const lastDay = new Date(year, 11, 31);
      return {
        startDate: format(firstDay),
        endDate: format(lastDay),
        label: `Cette année (${year})`,
      };
    }
    case 'ALL_TIME':
    default: {
      return {
        startDate: '2020-01-01',
        endDate: '2030-12-31',
        label: "Tout l'historique",
      };
    }
  }
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  onRangeChange,
  activeRange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(activeRange.startDate);
  const [customEnd, setCustomEnd] = useState(activeRange.endDate);
  const popoverRef = useRef<HTMLDivElement>(null);

  const presets: { key: PresetPeriod; label: string }[] = [
    { key: 'THIS_MONTH', label: 'Ce mois-ci' },
    { key: 'LAST_MONTH', label: 'Le mois dernier' },
    { key: 'LAST_30_DAYS', label: '30 derniers jours' },
    { key: 'THIS_QUARTER', label: 'Ce trimestre' },
    { key: 'THIS_YEAR', label: 'Cette année' },
    { key: 'ALL_TIME', label: "Tout l'historique" },
  ];

  // Fermer le popover au clic en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPreset = (preset: PresetPeriod) => {
    const range = getDateRangeFromPreset(preset);
    onRangeChange({
      startDate: range.startDate,
      endDate: range.endDate,
      preset,
      label: range.label,
    });
    setCustomStart(range.startDate);
    setCustomEnd(range.endDate);
    setIsOpen(false);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;

    onRangeChange({
      startDate: customStart,
      endDate: customEnd,
      preset: 'CUSTOM',
      label: `Du ${new Date(customStart).toLocaleDateString('fr-FR')} au ${new Date(customEnd).toLocaleDateString('fr-FR')}`,
    });
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      {/* Bouton Calendrier Interactif */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-card border border-border hover:border-[#FF6B00]/50 hover:bg-orange-500/5 text-foreground text-xs font-bold shadow-xs transition-all cursor-pointer"
      >
        <div className="p-1 rounded-md bg-orange-500/10 text-[#FF6B00]">
          <CalendarDays className="w-4 h-4" />
        </div>
        <span>{activeRange.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#FF6B00]' : ''}`} />
      </button>

      {/* Popover Sélecteur de Calendrier & Plage de Dates */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-card border border-border shadow-2xl p-4 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#FF6B00]" />
              <span className="text-xs font-bold text-foreground font-display">Filtrer par Période</span>
            </div>
            {activeRange.preset !== 'THIS_MONTH' && (
              <button
                type="button"
                onClick={() => handleSelectPreset('THIS_MONTH')}
                className="text-[11px] font-bold text-[#0E7A55] hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Réinitialiser
              </button>
            )}
          </div>

          {/* Raccourcis Rapides */}
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {presets.map((p) => {
              const isSelected = activeRange.preset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleSelectPreset(p.key)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-orange-500/10 text-[#FF6B00] font-bold border border-orange-500/30'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{p.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#FF6B00]" />}
                </button>
              );
            })}
          </div>

          {/* Sélection Personnalisée de Dates */}
          <div className="mt-4 pt-3 border-t border-border">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
              Plage de dates personnalisée
            </span>
            <form onSubmit={handleApplyCustom} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    required
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6B00] font-mono shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    required
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6B00] font-mono shadow-2xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="sm"
                className="w-full text-xs font-bold bg-[#FF6B00] hover:bg-[#EA580C] text-white shadow-xs"
              >
                Appliquer la Période
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

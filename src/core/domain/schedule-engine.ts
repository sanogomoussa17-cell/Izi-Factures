import { PaymentSchedule } from './types';

export interface SchedulePreset {
  id: string;
  name: string;
  description: string;
  splits: { label: string; percentage: number; daysOffset: number }[];
}

export const SCHEDULE_PRESETS: SchedulePreset[] = [
  {
    id: 'single_100',
    name: '100% Comptant',
    description: 'Règlement total à l’échéance',
    splits: [{ label: 'Règlement intégral', percentage: 100, daysOffset: 30 }],
  },
  {
    id: 'split_30_70',
    name: 'Acompte 30% / Solde 70%',
    description: '30% à la commande, 70% à la livraison',
    splits: [
      { label: 'Acompte à la signature / commande', percentage: 30, daysOffset: 0 },
      { label: 'Solde à la livraison / réception', percentage: 70, daysOffset: 30 },
    ],
  },
  {
    id: 'split_50_50',
    name: '50% / 50%',
    description: '50% à la commande, 50% à 30 jours',
    splits: [
      { label: 'Acompte 50%', percentage: 50, daysOffset: 0 },
      { label: 'Solde 50%', percentage: 50, daysOffset: 30 },
    ],
  },
  {
    id: 'split_30_40_30',
    name: '30% / 40% / 30% (BTP & Grands Projets)',
    description: '30% démarrage, 40% mi-parcours, 30% réception',
    splits: [
      { label: 'Acompte de démarrage (30%)', percentage: 30, daysOffset: 0 },
      { label: 'Échéance intermédiaire (40%)', percentage: 40, daysOffset: 30 },
      { label: 'Solde de clôture (30%)', percentage: 30, daysOffset: 60 },
    ],
  },
];

/**
 * Génère une liste de tranches d'échéancier pour un montant total donné
 */
export function generatePaymentSchedules(params: {
  invoiceId: string;
  totalAmount: number;
  startDate: string; // YYYY-MM-DD
  presetId?: string;
  customSplits?: { label: string; percentage: number; daysOffset: number }[];
}): PaymentSchedule[] {
  const { invoiceId, totalAmount, startDate, presetId = 'split_30_70', customSplits } = params;
  
  const splits = customSplits || SCHEDULE_PRESETS.find((p) => p.id === presetId)?.splits || SCHEDULE_PRESETS[1].splits;
  
  const baseDate = new Date(startDate || new Date().toISOString().slice(0, 10));
  let allocatedSum = 0;

  return splits.map((split, index) => {
    const isLast = index === splits.length - 1;
    // Pour la dernière tranche, on prend exactement le reliquat pour éviter tout écart d'arrondi
    const expectedAmount = isLast 
      ? totalAmount - allocatedSum 
      : Math.round((totalAmount * split.percentage) / 100);

    allocatedSum += expectedAmount;

    const dueDateObj = new Date(baseDate);
    dueDateObj.setDate(dueDateObj.getDate() + split.daysOffset);
    const dueDate = dueDateObj.toISOString().slice(0, 10);

    return {
      id: `sched_${Date.now()}_${index + 1}`,
      invoiceId,
      installmentNumber: index + 1,
      label: split.label,
      percentage: split.percentage,
      expectedAmount,
      dueDate,
      status: 'PENDING',
      paidAmount: 0,
    };
  });
}

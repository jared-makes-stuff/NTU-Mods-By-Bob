import type { PlannerModule, ModuleIndex } from "@/shared/types/planner";

// Helper function to format weeks array
export function formatWeeks(weeks?: number[] | null): string {
  if (!weeks || weeks.length === 0) return "";
  if (weeks.length === 13) return 'All weeks'; // Assuming full semester is 13 weeks
  
  // Check for consecutive ranges
  const ranges: string[] = [];
  let start = weeks[0]!;
  let end = weeks[0]!;
  
  for (let i = 1; i < weeks.length; i++) {
    if (weeks[i]! === end + 1) {
      end = weeks[i]!;
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = weeks[i]!;
      end = weeks[i]!;
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  
  return `Wk ${ranges.join(',')}`;
}

export const getUniqueIndexNumbers = (indexes?: ModuleIndex[] | null): string[] => {
  if (!indexes || indexes.length === 0) return [];
  return Array.from(new Set(indexes.map((idx) => idx.indexNumber))).sort((a, b) => a.localeCompare(b));
};

export const formatExamDuration = (duration?: number | null): string => {
  if (!duration || duration <= 0) return '2h';
  return `${duration / 60}h`;
};

export const formatExamDateTime = (value?: string | null): string => {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString('en-SG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return value;
  }
};

export const getExamStatusTone = (status: 'clash' | 'tight' | 'normal'): string => {
  if (status === 'clash') return 'text-red-600 font-semibold';
  if (status === 'tight') return 'text-orange-500 font-medium';
  return 'text-muted-foreground';
};

// Helper to check exam clashes
export const getExamStatus = (currentMod: PlannerModule, allMods: PlannerModule[]) => {
  if (!currentMod.examDateTime) return { status: 'normal' as const, message: '' };

  const currentStart = new Date(currentMod.examDateTime);
  if (isNaN(currentStart.getTime())) return { status: 'normal' as const, message: '' };
  
  // Use module duration or default to 2 hours (120 mins)
  const currentDurationMs = (currentMod.examDuration || 120) * 60 * 1000;
  const currentEnd = new Date(currentStart.getTime() + currentDurationMs);

  let status: 'clash' | 'tight' | 'normal' = 'normal';
  let message = '';

  for (const otherMod of allMods) {
    if (otherMod.code === currentMod.code) continue;
    if (!otherMod.examDateTime) continue;

    const otherStart = new Date(otherMod.examDateTime);
    if (isNaN(otherStart.getTime())) continue;
    
    const otherDurationMs = (otherMod.examDuration || 120) * 60 * 1000;
    const otherEnd = new Date(otherStart.getTime() + otherDurationMs);

    // Determine order
    let firstEnd, secondStart;
    if (currentStart < otherStart) {
      firstEnd = currentEnd;
      secondStart = otherStart;
    } else {
      firstEnd = otherEnd;
      secondStart = currentStart;
    }

    const gapMs = secondStart.getTime() - firstEnd.getTime();
    const gapMinutes = gapMs / (1000 * 60);

    // Check for Clash or < 1 hour gap (Red)
    if (gapMinutes < 60) {
      return {
        status: 'clash',
        message: gapMinutes < 0
          ? `Clash with ${otherMod.code}`
          : `< 1h gap with ${otherMod.code}`
      };
    }
    
    // Check for "Back to back" (Orange) -> Gap >= 60 mins but small (e.g., <= 120 mins)
    // And must be on the same day
    if (currentStart.toDateString() === otherStart.toDateString()) {
      if (gapMinutes >= 60 && gapMinutes <= 120) {
        // Only set to 'tight' if no clash has been found yet
        if (status === 'normal') { // Changed from status !== 'clash'
          status = 'tight';
          message = `Tight schedule with ${otherMod.code} (Gap: ${Math.round(gapMinutes/60)}h)`;
        }
      }
    }
  }

  return { status, message };
};

// Format semester display
export const formatSemester = (sem: string): string => {
  const [year, term] = sem.split('_');
  const ay1 = year?.substring(2); 
  const ay2 = year ? String(parseInt(year) + 1).substring(2) : ""; 
  
  if (term === 'S') {
    return `AY${ay1}/${ay2} Special Term`;
  } else {
    return `AY${ay1}/${ay2} Semester ${term}`;
  }
};

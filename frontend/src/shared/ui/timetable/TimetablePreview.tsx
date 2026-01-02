'use client';

import React from 'react';
import { calculateSpan, DAY_NAME_MAP, detectClashes, parseWeeks, timeToSlot } from '@/shared/lib/timetable-utils';
import type { IndexData } from '@/shared/types/timetable';
import { TimetableHeader } from './components/TimetableHeader';
import { TimetableHoverTooltip } from './components/TimetableHoverTooltip';
import { TimetablePreviewGridContent } from './components/TimetablePreviewGridContent';

interface TimetablePreviewProps {
  indexes: IndexData[];
  moduleCode: string; // The active module context
  previewIndexes?: IndexData[]; // All indexes for the active module (faded unless hovered)
  hideOverlay?: boolean;
  hoveredPreviewIndex?: string | null; // Index being hovered in dropdown menu
  colorBy?: 'module' | 'index'; // Strategy for coloring blocks
  onIndexClick?: (indexNumber: string, moduleCode?: string, isPreview?: boolean) => void;
  onDeleteCustomEvent?: (id: string) => void;
  selectedWeek?: number; // 0 = All, 1-13 = Specific Week
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_LABELS = [
  { time: '0800', label: '08:00', rowSpan: 2 },
  { time: '0830', label: '', rowSpan: 0 },
  { time: '0900', label: '09:00', rowSpan: 2 },
  { time: '0930', label: '', rowSpan: 0 },
  { time: '1000', label: '10:00', rowSpan: 2 },
  { time: '1030', label: '', rowSpan: 0 },
  { time: '1100', label: '11:00', rowSpan: 2 },
  { time: '1130', label: '', rowSpan: 0 },
  { time: '1200', label: '12:00', rowSpan: 2 },
  { time: '1230', label: '', rowSpan: 0 },
  { time: '1300', label: '13:00', rowSpan: 2 },
  { time: '1330', label: '', rowSpan: 0 },
  { time: '1400', label: '14:00', rowSpan: 2 },
  { time: '1430', label: '', rowSpan: 0 },
  { time: '1500', label: '15:00', rowSpan: 2 },
  { time: '1530', label: '', rowSpan: 0 },
  { time: '1600', label: '16:00', rowSpan: 2 },
  { time: '1630', label: '', rowSpan: 0 },
  { time: '1700', label: '17:00', rowSpan: 2 },
  { time: '1730', label: '', rowSpan: 0 },
  { time: '1800', label: '18:00', rowSpan: 2 },
  { time: '1830', label: '', rowSpan: 0 },
  { time: '1900', label: '19:00', rowSpan: 2 },
  { time: '1930', label: '', rowSpan: 0 },
  { time: '2000', label: '20:00', rowSpan: 2 },
  { time: '2030', label: '', rowSpan: 0 },
  { time: '2100', label: '21:00', rowSpan: 2 },
  { time: '2130', label: '', rowSpan: 0 },
  { time: '2200', label: '22:00', rowSpan: 2 },
  { time: '2230', label: '', rowSpan: 0 },
  { time: '2300', label: '23:00', rowSpan: 2 },
  { time: '2330', label: '', rowSpan: 0 }
];


export function TimetablePreview({ 
  indexes, 
  moduleCode, 
  previewIndexes = [], 
  hideOverlay = false,
  hoveredPreviewIndex,
  selectedWeek = 0,
  colorBy = 'index',
  onIndexClick,
  onDeleteCustomEvent
}: TimetablePreviewProps) {
  // Filter indexes based on selected week
  const filteredIndexes = React.useMemo(() => {
    if (!selectedWeek || selectedWeek === 0) return indexes;
    return indexes.filter(idx => {
      const weeks = parseWeeks(idx.weeks);
      return weeks.includes(selectedWeek);
    });
  }, [indexes, selectedWeek]);

  const filteredPreviewIndexes = React.useMemo(() => {
    if (!selectedWeek || selectedWeek === 0) return previewIndexes;
    return previewIndexes.filter(idx => {
      const weeks = parseWeeks(idx.weeks);
      return weeks.includes(selectedWeek);
    });
  }, [previewIndexes, selectedWeek]);

  const [hoveredIndex, setHoveredIndex] = React.useState<string | null>(null);
  const [tooltipData, setTooltipData] = React.useState<{
    x: number;
    y: number;
    classes: IndexData[];
  } | null>(null);
  
  // Merge internal hover state with external hover from dropdown
  const effectiveHoveredIndex = hoveredPreviewIndex || hoveredIndex;

  // Detect clashes between all indexes (active + preview)
  const clashingIndexes = React.useMemo(() => {
    return detectClashes([...filteredIndexes, ...filteredPreviewIndexes]);
  }, [filteredIndexes, filteredPreviewIndexes]);

  // Effect to clear tooltip if the hovered index is removed
  React.useEffect(() => {
    if (tooltipData && tooltipData.classes.length > 0) {
      const currentHoveredIndex = tooltipData.classes[0].indexNumber;
      // Check if this index still exists in the active indexes
      const stillExists = indexes.some(idx => idx.indexNumber === currentHoveredIndex);
      
      // Also check preview indexes if applicable
      const existsInPreview = previewIndexes.some(idx => idx.indexNumber === currentHoveredIndex);
      
      if (!stillExists && !existsInPreview) {
        setTooltipData(null);
        setHoveredIndex(null);
      }
    }
  }, [indexes, previewIndexes, tooltipData]);

  const hasIndexes = filteredIndexes.length > 0 || filteredPreviewIndexes.length > 0;

  // Create a map of day -> timeSlot -> array of index data (to handle overlaps)
  const timetableData: { [day: string]: { [slot: number]: Array<IndexData & { isStart: boolean; isPreview?: boolean }> } } = {};
  
  const addToTimetable = (items: IndexData[], isPreview: boolean) => {
    items.forEach(index => {
      const dayUpper = index.day.toUpperCase();
      const normalizedDay = DAY_NAME_MAP[dayUpper] || index.day.charAt(0).toUpperCase() + index.day.slice(1).toLowerCase();
      const startSlot = timeToSlot(index.startTime);
      const span = calculateSpan(index.startTime, index.endTime);
      
      if (!timetableData[normalizedDay]) {
        timetableData[normalizedDay] = {};
      }
      
      for (let i = 0; i < span; i++) {
        const slotNum = startSlot + i;
        if (!timetableData[normalizedDay][slotNum]) {
          timetableData[normalizedDay][slotNum] = [];
        }
        
        const exists = timetableData[normalizedDay][slotNum].some(
          existing => existing.indexNumber === index.indexNumber && 
                     existing.moduleCode === index.moduleCode && 
                     existing.startTime === index.startTime && 
                     existing.day === index.day &&
                     existing.type === index.type &&
                     existing.weeks === index.weeks &&
                     existing.venue === index.venue
        );

        if (!exists) {
            timetableData[normalizedDay][slotNum].push({
                ...index,
                isStart: i === 0,
                isPreview
            });
        }
      }
    });
  };

  addToTimetable(filteredIndexes, false);
  addToTimetable(filteredPreviewIndexes, true);


  return (
    <div className="relative h-full flex flex-col">
      <div className="w-full h-full flex flex-col overflow-auto">
        <div className="flex flex-col flex-1 rounded-xl border shadow-sm overflow-hidden">
          <TimetableHeader days={DAYS} />

          <TimetablePreviewGridContent 
            timetableData={timetableData}
            days={DAYS}
            timeLabels={TIME_LABELS}
            moduleCode={moduleCode}
            colorBy={colorBy}
            filteredIndexes={filteredIndexes}
            filteredPreviewIndexes={filteredPreviewIndexes}
            effectiveHoveredIndex={effectiveHoveredIndex}
            onIndexClick={onIndexClick}
            onDeleteCustomEvent={onDeleteCustomEvent}
            setHoveredIndex={setHoveredIndex}
            setTooltipData={setTooltipData}
            clashingIndexes={clashingIndexes}
            previewIndexes={previewIndexes}
          />
        </div>
      </div>
      
      {!hasIndexes && !hideOverlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm px-6 py-4 rounded-lg border shadow-sm">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground text-sm font-medium">No indexes selected</p>
              <p className="text-xs text-muted-foreground/70">Click on an index to preview it here</p>
            </div>
          </div>
        </div>
      )}
      
      <TimetableHoverTooltip tooltipData={tooltipData} />
    </div>
  );
}

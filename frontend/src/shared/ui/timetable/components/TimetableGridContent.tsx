"use client";

import React from 'react';
import { calculateSpan, DAY_NAME_MAP, getIndexColor, precalculateDayLayout } from '@/shared/lib/timetable-utils';
import type { IndexData } from '@/shared/types/timetable';

interface TimetableGridContentProps {
  timetableData: { [day: string]: { [slot: number]: Array<IndexData & { isStart: boolean }> } };
  days: string[];
  timeLabels: Array<{ time: string; label: string; rowSpan: number }>;
  moduleCode: string;
  colorBy: 'module' | 'index';
  setHoveredIndex: React.Dispatch<React.SetStateAction<string | null>>;
  setTooltipData: React.Dispatch<React.SetStateAction<{ x: number; y: number; classes: IndexData[]; } | null>>;
  allIndexes: IndexData[]; // For tooltip
  onIndexClick?: (indexNumber: string, moduleCode?: string) => void;
}

export function TimetableGridContent({
  timetableData, days, timeLabels, moduleCode, colorBy,
  setHoveredIndex, setTooltipData, allIndexes, onIndexClick
}: TimetableGridContentProps) {
  const layoutMap = React.useMemo(() => {
    const map = new Map<string, { width: number; left: number }>();
    
    const itemsByDay = new Map<string, IndexData[]>();
    for (const item of allIndexes) {
      const dayUpper = item.day.toUpperCase();
      const normalizedDay = DAY_NAME_MAP[dayUpper] || item.day.charAt(0).toUpperCase() + item.day.slice(1).toLowerCase();
      if (!itemsByDay.has(normalizedDay)) {
        itemsByDay.set(normalizedDay, []);
      }
      itemsByDay.get(normalizedDay)?.push(item);
    }
    
    for (const [, dayItems] of itemsByDay) {
      const dayLayout = precalculateDayLayout(dayItems);
      dayLayout.forEach((layout, key) => map.set(key, layout));
    }
    
    return map;
  }, [allIndexes]);

  return (
    <div className="grid grid-cols-[70px_repeat(6,1fr)] gap-px bg-border flex-grow overflow-hidden" style={{ gridTemplateRows: 'repeat(32, minmax(0, 1fr))' }}>
      {timeLabels.map((timeItem, slotIndex) => {
        const rowStart = slotIndex + 1;
        
        if (timeItem.rowSpan === 0) {
          return (
            <React.Fragment key={timeItem.time}>
              {days.map((day, dayIndex) => {
                const cellDataArray = timetableData[day]?.[slotIndex] || [];
                const startingItems = cellDataArray.filter(item => item.isStart);
                
                if (startingItems.length === 0) {
                  return (
                    <div
                      key={`${day}-${slotIndex}`}
                      className="bg-background h-full"
                      style={{ gridColumn: dayIndex + 2, gridRow: rowStart }}
                    />
                  );
                }
                
                return (
                  <div
                    key={`${day}-${slotIndex}`}
                    className="relative h-full"
                    style={{ gridColumn: dayIndex + 2, gridRow: rowStart }}
                  >
                    {startingItems.map((item) => {
                      const span = calculateSpan(item.startTime, item.endTime);
                      const colorKey = colorBy === 'index' ? item.indexNumber : (item.moduleCode || item.indexNumber);
                      const colors = getIndexColor(colorKey);
                      
                      const key = `${item.moduleCode || ''}-${item.indexNumber}-${item.day}-${item.startTime}-${item.endTime}-${item.type}-${item.weeks || ''}-${item.venue || ''}`;
                      const layout = layoutMap.get(key) || { width: 100, left: 0 };
                      const { width: widthPercent, left: leftPercent } = layout;

                      return (
                        <div
                          key={key}
                          className={`absolute ${colors.bg} border-2 ${colors.border} rounded-lg overflow-hidden cursor-pointer transition-opacity duration-200 opacity-100`}
                          style={{ 
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            top: 0,
                            height: `calc(${span * 100}% + ${span - 1}px)`,
                            zIndex: 10
                          }}
                          onMouseEnter={(e) => {
                            setHoveredIndex(item.indexNumber);
                            const indexClasses = allIndexes.filter(d => d.indexNumber === item.indexNumber);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltipData({
                              x: rect.right + 10,
                              y: rect.top,
                              classes: indexClasses
                            });
                          }}
                          onMouseLeave={() => {
                            setHoveredIndex(null);
                            setTooltipData(null);
                          }}
                        >
                          <div className="p-1.5 h-full flex flex-col">
                            <div className="flex justify-between items-start gap-1 mb-0.5">
                              <span className="text-[13px] font-bold leading-tight truncate" style={{ color: '#000' }}>
                                {item.moduleCode || moduleCode}
                              </span>
                              <span className="text-[12px] font-semibold leading-tight flex-shrink-0" style={{ color: '#000' }}>
                                {item.indexNumber}
                              </span>
                            </div>
                            
                            <div className="text-[12px] leading-tight mb-0.5" style={{ color: '#000' }}>
                              {item.type} {item.startTime.substring(0, 2)}:{item.startTime.substring(2)}
                            </div>
                            
                            {span > 2 && (
                              <>
                                {item.weeks && (
                                  <div className="text-[11px] leading-tight mb-0.5" style={{ color: '#000' }}>
                                    {item.weeks}
                                  </div>
                                )}
                                {item.venue && (
                                  <div className="text-[11px] leading-tight truncate" style={{ color: '#000' }}>
                                    {item.venue}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          );
        }
        
        return (
          <React.Fragment key={timeItem.time}>
            <div 
              className="bg-background p-1 text-xs text-muted-foreground flex items-start justify-end pr-2 pt-1 min-h-[30px]"
              style={{ 
                gridColumn: 1, 
                gridRow: timeItem.rowSpan > 1 ? `${rowStart} / span ${timeItem.rowSpan}` : rowStart
              }}
            >
              {timeItem.label}
            </div>
            
            {days.map((day, dayIndex) => {
              const cellDataArray = timetableData[day]?.[slotIndex] || [];
              const startingItems = cellDataArray.filter(item => item.isStart);
              
              if (startingItems.length === 0) {
                return (
                  <div
                    key={`${day}-${slotIndex}`}
                    className="bg-background hover:bg-muted/30 transition-colors h-full"
                    style={{ 
                      gridColumn: dayIndex + 2,
                      gridRow: rowStart
                    }}
                  />
                );
              }
              
              return (
                <div
                  key={`${day}-${slotIndex}`}
                  className="relative h-full"
                  style={{ gridColumn: dayIndex + 2, gridRow: rowStart }}
                >
                  {startingItems.map((item) => {
                    const span = calculateSpan(item.startTime, item.endTime);
                    const colorKey = colorBy === 'index' ? item.indexNumber : (item.moduleCode || item.indexNumber);
                    const colors = getIndexColor(colorKey);
                    
                    const key = `${item.moduleCode || ''}-${item.indexNumber}-${item.day}-${item.startTime}-${item.endTime}-${item.type}-${item.weeks || ''}-${item.venue || ''}`;
                    const layout = layoutMap.get(key) || { width: 100, left: 0 };
                    const { width: widthPercent, left: leftPercent } = layout;

                                          return (
                                            <div
                                              key={key}
                                              className={`absolute ${colors.bg} border-2 ${colors.border} rounded-lg overflow-hidden cursor-pointer transition-opacity duration-200 opacity-100 shadow-sm hover:brightness-95`}
                                              style={{ 
                                                left: `${leftPercent}%`,
                                                width: `${widthPercent}%`,
                                                top: 0,
                                                zIndex: 10,
                                                height: `calc(${span * 100}% + ${span - 1}px)`
                                              }}
                                              onMouseEnter={(e) => {
                                                setHoveredIndex(item.indexNumber);
                                                const indexClasses = allIndexes.filter(d => d.indexNumber === item.indexNumber);
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setTooltipData({
                                                  x: rect.right + 10,
                                                  y: rect.top,
                                                  classes: indexClasses
                                                });
                                              }}
                                              onMouseLeave={() => {
                                                setHoveredIndex(null);
                                                setTooltipData(null);
                                              }}
                                              onClick={() => onIndexClick?.(item.indexNumber, item.moduleCode)}
                                            >
                                              <div className="p-1.5 h-full flex flex-col relative">
                                                {/* Vacancy/Waitlist Overlay for Planner Mode */}
                                                {(item.vacancy !== undefined || item.waitlist !== undefined) && (
                                                  <div className="absolute bottom-1 right-1 flex flex-col items-end gap-0.5 pointer-events-none opacity-80">
                                                    {item.vacancy !== undefined && (
                                                      <span className={`text-[8px] font-bold px-1 rounded-sm border ${item.vacancy > 0 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                                                        {item.vacancy}
                                                      </span>
                                                    )}
                                                    {item.waitlist !== undefined && item.waitlist > 0 && (
                                                      <span className="text-[8px] font-bold px-1 rounded-sm border bg-amber-100 text-amber-800 border-amber-200">
                                                        W:{item.waitlist}
                                                      </span>
                                                    )}
                                                  </div>
                                                )}
                    
                                                <div className="flex justify-between items-start gap-1 mb-0.5">
                                                  <span className="text-[13px] font-bold leading-tight truncate" style={{ color: '#000' }}>
                                                    {item.moduleCode || moduleCode}
                                                  </span>
                                                  <span className="text-[12px] font-semibold leading-tight flex-shrink-0" style={{ color: '#000' }}>
                                                    {item.indexNumber}
                                                  </span>
                                                </div>                          
                          <div className="text-[12px] leading-tight mb-0.5" style={{ color: '#000' }}>
                            {item.type} {item.startTime.substring(0, 2)}:{item.startTime.substring(2)}
                          </div>
                          
                          {span > 2 && (
                            <>
                              {item.weeks && (
                                <div className="text-[11px] leading-tight mb-0.5" style={{ color: '#000' }}>
                                  {item.weeks}
                                </div>
                              )}
                              {item.venue && (
                                <div className="text-[11px] leading-tight truncate" style={{ color: '#000' }}>
                                  {item.venue}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}

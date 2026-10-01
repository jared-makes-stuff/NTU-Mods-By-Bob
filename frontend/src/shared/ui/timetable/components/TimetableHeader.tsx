"use client";

import React from 'react';

interface TimetableHeaderProps {
  days: string[];
}

export function TimetableHeader({ days }: TimetableHeaderProps) {
  return (
    <div className="grid grid-cols-[52px_repeat(6,minmax(56px,1fr))] gap-px bg-border mb-px flex-shrink-0 sm:grid-cols-[60px_repeat(6,minmax(72px,1fr))] lg:grid-cols-[70px_repeat(6,minmax(84px,1fr))]">
      <div className="bg-background p-2 text-xs font-semibold text-center whitespace-nowrap">Time</div>
      {days.map(day => (
        <div key={day} className="bg-background p-2 text-xs font-semibold text-center whitespace-nowrap">
          {day.substring(0, 3)}
        </div>
      ))}
    </div>
  );
}

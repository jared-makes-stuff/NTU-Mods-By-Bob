"use client";

import React from 'react';

interface TimetableHeaderProps {
  days: string[];
}

export function TimetableHeader({ days }: TimetableHeaderProps) {
  return (
    <div className="grid grid-cols-[70px_repeat(6,1fr)] gap-px bg-border mb-px flex-shrink-0">
      <div className="bg-background p-2 text-xs font-semibold text-center w-[70px]">Time</div>
      {days.map(day => (
        <div key={day} className="bg-background p-2 text-xs font-semibold text-center min-w-[100px]">
          {day.substring(0, 3)}
        </div>
      ))}
    </div>
  );
}

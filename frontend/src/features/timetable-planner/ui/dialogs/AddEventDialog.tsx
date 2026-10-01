"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import type { CustomEvent } from "@/features/planner";
import { v4 as uuidv4 } from "uuid";
import { ChevronUp, ChevronDown } from "lucide-react";

interface AddEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (event: CustomEvent) => void;
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export function AddEventDialog({ isOpen, onClose, onAdd }: AddEventDialogProps) {
  const [title, setTitle] = useState("");
  const [day, setDay] = useState("MON");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [weeks, setWeeks] = useState("1-13");
  const [weeksError, setWeeksError] = useState("");

  const roundTime = (value: string, mode: 'down' | 'up'): string => {
    if (!value) return value;
    
    let h = 0, m = 0;
    const clean = value.replace(/[^0-9]/g, '');
    
    if (value.includes(':') || value.includes('.')) {
       const parts = value.split(/[:.]/);
       h = parseInt(parts[0]) || 0;
       m = parseInt(parts[1]) || 0;
    } else {
       if (clean.length >= 3) {
         h = parseInt(clean.slice(0, -2));
         m = parseInt(clean.slice(-2));
       } else if (clean.length > 0) {
         h = parseInt(clean);
         m = 0;
       } else {
         return value;
       }
    }
    
    if (isNaN(h)) return value;
    h = Math.max(0, Math.min(24, h));
    m = Math.max(0, Math.min(59, m));

    let totalMinutes = h * 60 + m;
    
    if (totalMinutes < 480) totalMinutes = 480;
    if (totalMinutes > 1440) totalMinutes = 1440;

    if (mode === 'down') {
      totalMinutes = Math.floor(totalMinutes / 30) * 30;
    } else {
      totalMinutes = Math.ceil(totalMinutes / 30) * 30;
    }
    
    if (totalMinutes > 1440) totalMinutes = 1440; 
    
    const newH = Math.floor(totalMinutes / 60);
    const newM = totalMinutes % 60;
    
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  };

  const adjustTime = (timeStr: string, deltaMinutes: number) => {
    let validTime = roundTime(timeStr, 'down');
    if (!validTime.includes(':')) validTime = "09:00"; 

    const [hStr, mStr] = validTime.split(':');
    const h = parseInt(hStr);
    const m = parseInt(mStr);
    
    let totalMinutes = h * 60 + m + deltaMinutes;
    
    if (totalMinutes < 480) totalMinutes = 480;
    if (totalMinutes > 1440) totalMinutes = 1440;
    
    const newH = Math.floor(totalMinutes / 60);
    const newM = totalMinutes % 60;
    
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  };

  const handleWheel = (e: React.WheelEvent, setter: (val: string) => void, currentVal: string) => {
    const delta = e.deltaY < 0 ? 30 : -30;
    const newVal = adjustTime(currentVal, delta);
    setter(newVal);
  };

  const handleBlurStart = () => {
    const rounded = roundTime(startTime, 'down');
    setStartTime(rounded);
  };

  const handleBlurEnd = () => {
    const rounded = roundTime(endTime, 'up');
    setEndTime(rounded);
  };

  const handleWeeksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const cleanVal = val.replace(/\s/g, '');
    setWeeks(cleanVal);
    
    if (!/^[0-9,-]*$/.test(cleanVal)) {
      setWeeksError("Invalid characters. Use numbers, commas, and dashes only.");
    } else {
      setWeeksError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalStart = roundTime(startTime, 'down');
    const finalEnd = roundTime(endTime, 'up');
    
    if (!title || !day || !finalStart || !finalEnd || !weeks || weeksError) return;

    const formatTime = (t: string) => t.replace(':', '');

    const newEvent: CustomEvent = {
      id: uuidv4(),
      title,
      day,
      startTime: formatTime(finalStart),
      endTime: formatTime(finalEnd),
      weeks: "Wk " + weeks,
    };

    onAdd(newEvent);
    onClose();
    setTitle("");
    setDay("MON");
    setStartTime("09:00");
    setEndTime("10:00");
    setWeeks("1-13");
    setWeeksError("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Custom Event</DialogTitle>
          <DialogDescription>
            Block out time for personal activities. Scroll on time inputs or use arrows to adjust in 30-min intervals.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Gym, Part-time Job"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Day</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weeks">Weeks</Label>
              <Input
                id="weeks"
                value={weeks}
                onChange={handleWeeksChange}
                placeholder="e.g. 1-13 or 1,3,5"
                required
              />
              {weeksError && <p className="text-xs text-red-500">{weeksError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Start Time</Label>
              <div className="flex items-center gap-1">
                <Input
                  id="start"
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  onBlur={handleBlurStart}
                  onWheel={(e) => handleWheel(e, setStartTime, startTime)}
                  placeholder="09:00"
                  required
                  className="flex-1"
                />
                <div className="flex flex-col">
                  <Button type="button" variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => setStartTime(adjustTime(startTime, 30))}>
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => setStartTime(adjustTime(startTime, -30))}>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End Time</Label>
              <div className="flex items-center gap-1">
                <Input
                  id="end"
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  onBlur={handleBlurEnd}
                  onWheel={(e) => handleWheel(e, setEndTime, endTime)}
                  placeholder="10:00"
                  required
                  className="flex-1"
                />
                <div className="flex flex-col">
                  <Button type="button" variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => setEndTime(adjustTime(endTime, 30))}>
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => setEndTime(adjustTime(endTime, -30))}>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!!weeksError}>Add Custom Event</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Loader2 } from "lucide-react";
import { createTimetable } from "@/shared/api/timetables";
import { useToast } from "@/shared/hooks/use-toast";
import type { PlannerModule } from "@/shared/types/planner";
import type { CreateTimetableRequest, CustomEvent } from "@/shared/api/types";
import { getErrorMessage } from "@/shared/api/client";
import { getErrorStatus } from "@/shared/api/errors";

interface SavePresetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentModules: PlannerModule[]; // Use proper type
  customEvents: CustomEvent[];
  semester: string;
  onSaveSuccess: (name: string) => void;
}

export function SavePresetDialog({ isOpen, onClose, currentModules, customEvents, semester, onSaveSuccess }: SavePresetDialogProps) {
  const [presetName, setPresetName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!presetName.trim()) return;

    setIsSaving(true);
    try {
      const moduleSelections = currentModules.map(m => ({
        moduleCode: m.code,
        indexNumber: m.selectedIndex || ""
      })).filter(s => s.indexNumber !== "");

      const eventSelections = customEvents.map(e => ({
        moduleCode: "CUSTOM",
        indexNumber: "0",
        isCustomEvent: true,
        customEvent: e
      }));

      await createTimetable({
        semester,
        year: parseInt(semester.split('_')[0]),
        name: presetName,
        selections: [...moduleSelections, ...eventSelections] as CreateTimetableRequest['selections']
      });
      
      toast({
        title: "Success",
        description: "Timetable preset saved successfully.",
      });
      onSaveSuccess(presetName);
      onClose();
      setPresetName("");
    } catch (error: unknown) {
      const status = getErrorStatus(error);

      if (status === 409) {
         toast({
          title: "Duplicate Name",
          description: "A plan with this name already exists. Please choose another name.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Preset</DialogTitle>
          <DialogDescription>
            Give your current timetable configuration a name to save it.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Preset Name</Label>
            <Input
              id="name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="e.g., Plan A (Morning Classes)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!presetName.trim() || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

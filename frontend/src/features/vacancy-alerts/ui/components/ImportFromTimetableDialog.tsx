"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Badge } from "@/shared/ui/badge";
import { Loader2, Calendar, Check } from "lucide-react";
import { getUserTimetables } from "@/shared/api/timetables";
import type { Timetable } from "@/shared/api/types";
import { getErrorMessage } from "@/shared/api/client";
import { useToast } from "@/shared/hooks/use-toast";

interface ImportFromTimetableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (timetable: Timetable) => Promise<void>;
  isImporting: boolean;
}

export function ImportFromTimetableDialog({
  open,
  onOpenChange,
  onConfirm,
  isImporting,
}: ImportFromTimetableDialogProps) {
  const { toast } = useToast();
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState<Timetable | null>(null);

  const loadTimetables = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getUserTimetables();
      setTimetables(data);
      
      if (data.length === 0) {
        toast({
          title: "No Timetables Found",
          description: "You haven't saved any timetables yet. Save a timetable from the Timetable page first.",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Load Failed",
        description: getErrorMessage(error) || "Could not load timetables.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (open) {
      loadTimetables();
    } else {
      setSelectedTimetable(null);
    }
  }, [open, loadTimetables]);

  const handleConfirm = async () => {
    if (!selectedTimetable) return;
    
    await onConfirm(selectedTimetable);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import from Timetable</DialogTitle>
          <DialogDescription>
            Select a saved timetable plan. Vacancy alerts will be created for all modules with selected indexes.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : timetables.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No saved timetables found</p>
              <p className="text-sm mt-1">Save a timetable from the Timetable page first</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {timetables.map((timetable) => {
                  const moduleCount = timetable.selections?.filter(s => s.indexNumber).length || 0;
                  const isSelected = selectedTimetable?.id === timetable.id;

                  return (
                    <button
                      key={timetable.id}
                      onClick={() => setSelectedTimetable(timetable)}
                      disabled={moduleCount === 0}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : moduleCount === 0
                          ? "border-muted bg-muted/30 cursor-not-allowed opacity-60"
                          : "border-border hover:border-primary/50 hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold truncate">{timetable.name}</h4>
                            {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                          </div>
                          
                          {timetable.semester && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {timetable.semester}
                            </p>
                          )}

                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={moduleCount > 0 ? "default" : "secondary"}>
                              {moduleCount} module{moduleCount !== 1 ? "s" : ""} with indexes
                            </Badge>
                            
                            {timetable.selections && timetable.selections.length > moduleCount && (
                              <Badge variant="outline" className="text-xs">
                                {timetable.selections.length - moduleCount} without indexes
                              </Badge>
                            )}
                          </div>

                          {moduleCount === 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              No modules with selected indexes
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedTimetable || isImporting}
          >
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import Alerts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

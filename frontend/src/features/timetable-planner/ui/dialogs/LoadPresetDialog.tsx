"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Loader2, Trash2, Calendar } from "lucide-react";
import { getUserTimetables, deleteTimetable } from "@/shared/api/timetables";
import { useToast } from "@/shared/hooks/use-toast";
import { Badge } from "@/shared/ui/badge";
import { ScrollArea } from "@/shared/ui/scroll-area";
import type { Timetable } from "@/shared/api/types";

interface LoadPresetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (preset: Timetable) => void;
}

export function LoadPresetDialog({ isOpen, onClose, onLoad }: LoadPresetDialogProps) {
  const [presets, setPresets] = useState<Timetable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPresets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getUserTimetables();
      setPresets(response || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load saved presets.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      fetchPresets();
    }
  }, [fetchPresets, isOpen]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this preset?")) return;

    setIsDeleting(id);
    try {
      await deleteTimetable(id);
      setPresets((prev) => prev.filter(p => p.id !== id));
      toast({
        title: "Success",
        description: "Preset deleted.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete preset.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Load Preset</DialogTitle>
          <DialogDescription>
            Select a saved timetable to load.
          </DialogDescription>
        </DialogHeader>
        
        <div className="h-[300px] mt-2">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : presets.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Calendar className="h-10 w-10 mb-2 opacity-20" />
              <p>No saved presets found.</p>
            </div>
          ) : (
            <ScrollArea className="h-full w-full">
              <div className="space-y-2 w-full px-4">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="w-full flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors group"
                    onClick={() => {
                      onLoad(preset);
                      onClose();
                    }}
                  >
                    <div className="space-y-1">
                      <div className="font-medium leading-none">{preset.name || "Untitled"}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-5">
                          {preset.selections?.length || 0} Modules
                        </Badge>
                        <span>{new Date(preset.updatedAt || preset.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDelete(preset.id, e)}
                      disabled={isDeleting === preset.id}
                    >
                      {isDeleting === preset.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

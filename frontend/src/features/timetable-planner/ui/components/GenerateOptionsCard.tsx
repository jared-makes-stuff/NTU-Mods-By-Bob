"use client";

import { Button } from "@/shared/ui/button";
import { Loader2, Clock } from "lucide-react";

interface GenerateOptionsCardProps {
  selectedModulesLength: number;
  isGenerating: boolean;
  onGenerate: () => void;
}

export function GenerateOptionsCard({
  selectedModulesLength,
  isGenerating,
  onGenerate
}: GenerateOptionsCardProps) {
  return (
    <Button
      className="w-full mt-2"
      disabled={selectedModulesLength === 0 || isGenerating}
      onClick={onGenerate}
    >
      {isGenerating ? (
        <Loader2 className="size-4 animate-spin mr-2" />
      ) : (
        <Clock className="size-4 mr-2" />
      )}
      Generate Timetables
    </Button>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";

interface AddCustomModuleDialogProps {
  onAdd: (code: string, title: string, au: number) => void;
  className?: string;
}

export function AddCustomModuleDialog({ onAdd, className }: AddCustomModuleDialogProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("MOOC");
  const [title, setTitle] = useState("");
  const [au, setAu] = useState<number | "">("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code && title && au !== "") {
      onAdd(code, title, Number(au));
      setOpen(false);
      // Reset form (optional, keeping code as MOOC is probably desired)
      setTitle("");
      setAu("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={className}
        >
          MOOC
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add MOOC / Custom Module</DialogTitle>
          <DialogDescription>
            Add a module that is not in the standard catalogue, such as a MOOC or exchange module.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Module Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. MOOC"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Module Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Coursera: Introduction to Python"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="au">Academic Units (AU)</Label>
            <Input
              id="au"
              type="number"
              min="0"
              step="0.5"
              value={au}
              onChange={(e) => setAu(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g. 3"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Module</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

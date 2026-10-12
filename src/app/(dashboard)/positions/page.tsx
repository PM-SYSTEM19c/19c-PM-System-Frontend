"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreatePosition,
  useDeletePosition,
  usePositions,
  useUpdatePosition,
} from "@/lib/queries";
import { toast } from "@/store/toast.store";
import type { Position } from "@/types";

const positionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});
type PositionFormData = z.infer<typeof positionSchema>;

export default function PositionsPage() {
  const { data: positions = [], isLoading: loading } = usePositions();
  const createMutation = useCreatePosition();
  const updateMutation = useUpdatePosition();
  const deleteMutation = useDeletePosition();

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PositionFormData>({
    resolver: zodResolver(positionSchema),
  });

  function openCreate() {
    setIsEdit(false);
    setEditId("");
    reset({ name: "", description: "" });
    setShowForm(true);
  }

  function openEdit(pos: Position) {
    setIsEdit(true);
    setEditId(pos.id);
    reset({ name: pos.name, description: pos.description || "" });
    setShowForm(true);
  }

  async function onSubmit(data: PositionFormData) {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: editId, data });
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          description: data.description || null,
        });
      }
      setShowForm(false);
      reset();
      toast.success(isEdit ? "Position updated" : "Position created");
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to save position");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this position?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Position deleted");
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to delete position");
    }
  }

  if (loading) {
    return (
      <div>
        <Skeleton className="mb-6 h-8 w-[200px]" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <PageHeader
          title="Positions"
          description="Standardized organizational role designations and functional titles"
          badge={
            <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-bold text-primary">
              {positions.length} TITLES
            </span>
          }
          actions={
            <Button
              onClick={openCreate}
              className="bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary-2"
            >
              <Plus className="size-4" /> New Position
            </Button>
          }
        />

        {/* Positions as a vertical list */}
        <Card className="divide-y divide-border/40 overflow-hidden border border-border/50 bg-surface-1/70">
          {positions.length === 0 ? (
            <div className="p-10 text-center text-[13px] text-muted-foreground">
              No positions found. Create your first position to get started.
            </div>
          ) : (
            positions.map((pos) => (
              <div
                key={pos.id}
                className="group flex items-center justify-between gap-4 px-5 py-4 hover:bg-surface-1/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                    <Briefcase className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-semibold text-foreground truncate">
                      {pos.name}
                    </h3>
                    {pos.description && (
                      <p className="text-[12px] text-muted-foreground truncate mt-0.5">
                        {pos.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 rounded-full"
                    onClick={() => openEdit(pos)}
                    title="Edit"
                  >
                    <Pencil className="size-3.5 text-primary" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(pos.id)}
                    title="Delete"
                  >
                    <Trash2 className="size-3.5 text-destructive/70" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DialogHeader>
              <DialogTitle>
                {isEdit ? "Edit Position" : "Create Position"}
              </DialogTitle>
            </DialogHeader>
            <DialogBody className="space-y-4">
              <div>
                <Label htmlFor="pos-name">Name</Label>
                <Input
                  id="pos-name"
                  placeholder="e.g. Frontend Developer"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                <FieldError message={errors.name?.message} />
              </div>
              <div>
                <Label htmlFor="pos-description">Description (Optional)</Label>
                <Textarea
                  id="pos-description"
                  placeholder="Role description..."
                  rows={3}
                  {...register("description")}
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

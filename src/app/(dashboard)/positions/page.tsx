"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader } from "@/components/page";
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
      <div className="animate-fade-in">
        <PageHeader
          title="Positions"
          description="Manage user job titles"
          actions={
            <Button onClick={openCreate}>
              <Plus /> New Position
            </Button>
          }
        />

        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {positions.map((pos) => (
            <Card key={pos.id} interactive className="flex flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="flex items-center gap-2 text-base font-bold">
                  <Briefcase className="size-4 text-primary" /> {pos.name}
                </h3>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => openEdit(pos)}
                    title="Edit"
                  >
                    <Pencil className="text-primary" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 hover:bg-destructive/10"
                    onClick={() => handleDelete(pos.id)}
                    title="Delete"
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              </div>
              {pos.description && (
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  {pos.description}
                </p>
              )}
            </Card>
          ))}
          {positions.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-border bg-card p-10 text-center text-subtle">
              No positions found
            </div>
          )}
        </div>
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

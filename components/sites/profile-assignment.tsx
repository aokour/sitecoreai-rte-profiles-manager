"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DndContext,
  SortableContainer,
  arrayMove,
  type DragEndEvent,
} from "@/components/ui/dnd-context";
import { SortableItem, SortableHandle } from "@/components/ui/sortable";
import type { EditorProfile } from "@/types";
import { GripVertical, Plus, Settings2, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProfileAssignmentProps {
  siteId: string;
  assignedProfileIds: string[];
  allProfiles: EditorProfile[];
  onUpdate: (profileIds: string[]) => Promise<void>;
  disabled?: boolean;
}

export function ProfileAssignment({
  siteId,
  assignedProfileIds,
  allProfiles,
  onUpdate,
  disabled = false,
}: ProfileAssignmentProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [localProfileIds, setLocalProfileIds] = useState<string[]>([]);

  // Get profile data for assigned IDs
  const assignedProfiles = assignedProfileIds
    .map((id) => allProfiles.find((p) => p.id === id))
    .filter((p): p is EditorProfile => p !== undefined);

  // Sync local state when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setLocalProfileIds([...assignedProfileIds]);
    }
    setIsDialogOpen(open);
  };

  const isDisabled = disabled || isUpdating;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Static display of assigned profiles */}
      {assignedProfiles.length === 0 ? (
        <Badge colorScheme="neutral">No profile</Badge>
      ) : (
        assignedProfiles.map((profile, index) => (
          <Link key={profile.id} href={`/profiles/${profile.id}`}>
            <Badge colorScheme="primary" className="gap-1 cursor-pointer">
              {index === 0 && <Star className="h-3 w-3 fill-current" />}
              {profile.name}
            </Badge>
          </Link>
        ))
      )}

      {/* Assign button that opens dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5"
            disabled={isDisabled}
          >
            <Settings2 className="h-3.5 w-3.5" />
            Assign
          </Button>
        </DialogTrigger>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Manage Editor Profiles</DialogTitle>
          </DialogHeader>

          <ProfileAssignmentDialogContent
            allProfiles={allProfiles}
            localProfileIds={localProfileIds}
            setLocalProfileIds={setLocalProfileIds}
            onUpdate={onUpdate}
            isUpdating={isUpdating}
            setIsUpdating={setIsUpdating}
            onClose={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ProfileAssignmentDialogContentProps {
  allProfiles: EditorProfile[];
  localProfileIds: string[];
  setLocalProfileIds: React.Dispatch<React.SetStateAction<string[]>>;
  onUpdate: (profileIds: string[]) => Promise<void>;
  isUpdating: boolean;
  setIsUpdating: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
}

function ProfileAssignmentDialogContent({
  allProfiles,
  localProfileIds,
  setLocalProfileIds,
  onUpdate,
  isUpdating,
  setIsUpdating,
  onClose,
}: ProfileAssignmentDialogContentProps) {
  // Get profile data for local IDs
  const assignedProfiles = localProfileIds
    .map((id) => allProfiles.find((p) => p.id === id))
    .filter((p): p is EditorProfile => p !== undefined);

  // Get unassigned profiles
  const unassignedProfiles = allProfiles.filter(
    (p) => !localProfileIds.includes(p.id)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localProfileIds.indexOf(active.id as string);
    const newIndex = localProfileIds.indexOf(over.id as string);

    if (oldIndex === -1 || newIndex === -1) return;

    setLocalProfileIds(arrayMove(localProfileIds, oldIndex, newIndex));
  };

  const handleAddProfile = (profileId: string) => {
    setLocalProfileIds((prev) => [...prev, profileId]);
  };

  const handleRemoveProfile = (profileId: string) => {
    setLocalProfileIds((prev) => prev.filter((id) => id !== profileId));
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await onUpdate(localProfileIds);
      onClose();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Alert variant="primary" className="mb-4">
        <AlertDescription>
          Drag profiles to reorder. The first profile becomes the default.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {/* Assigned Profiles Section */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Assigned Profiles
          </h4>
          {assignedProfiles.length === 0 ? (
            <div className="text-sm text-muted-foreground py-3 text-center border border-dashed rounded-md">
              No profiles assigned
            </div>
          ) : (
            <DndContext onDragEnd={handleDragEnd}>
              <SortableContainer items={localProfileIds} strategy="vertical">
                <div className="space-y-1">
                  {assignedProfiles.map((profile, index) => (
                    <SortableItem
                      key={profile.id}
                      id={profile.id}
                      disabled={isUpdating}
                      withHandle
                      className="block"
                    >
                      <div
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md border bg-background",
                          "hover:bg-accent/50 transition-colors"
                        )}
                      >
                        <SortableHandle className="flex items-center text-muted-foreground hover:text-foreground cursor-grab">
                          <GripVertical className="h-4 w-4" />
                        </SortableHandle>
                        <span className="flex-1 text-sm font-medium">
                          {profile.name}
                        </span>
                        {index === 0 && (
                          <Badge colorScheme="primary" size="sm">
                            Default
                          </Badge>
                        )}
                        <button
                          onClick={() => handleRemoveProfile(profile.id)}
                          disabled={isUpdating}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove {profile.name}</span>
                        </button>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContainer>
            </DndContext>
          )}
        </div>

        {/* Available Profiles Section */}
        {unassignedProfiles.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Available Profiles
            </h4>
            <div className="space-y-1">
              {unassignedProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md border bg-background",
                    "hover:bg-accent/50 transition-colors"
                  )}
                >
                  <span className="flex-1 text-sm">{profile.name}</span>
                  <button
                    onClick={() => handleAddProfile(profile.id)}
                    disabled={isUpdating}
                    className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add {profile.name}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" disabled={isUpdating}>
            Cancel
          </Button>
        </DialogClose>
        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </>
  );
}

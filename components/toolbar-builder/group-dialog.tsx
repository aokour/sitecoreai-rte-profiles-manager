"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GripVertical, X, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOOLBAR_ITEMS, type ToolbarGroup } from "@/types";
import { getToolbarIcon } from "@/lib/ckeditor-icons";

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (group: ToolbarGroup) => void;
  initialGroup?: ToolbarGroup;
}

const ICON_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "plus", label: "Plus" },
];

// Internal item type with unique ID
type SelectedItem = {
  id: string; // Unique ID for drag/drop
  value: string; // Actual value (item ID or "|" for separator)
  isSeparator: boolean;
};

// CKEditor SVG Icon component
function CKIcon({ svg, className }: { svg: string; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center justify-center [&>svg]:w-full [&>svg]:h-full", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

// Sortable item for the selected items list
function SortableSelectedItem({
  item,
  onRemove,
}: {
  item: SelectedItem;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Handle separator
  if (item.isSeparator) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "flex items-center gap-2 p-2 border rounded-lg bg-muted/50",
          isDragging && "opacity-50 shadow-lg"
        )}
      >
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab hover:bg-muted rounded p-0.5"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <Minus className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm flex-1 text-muted-foreground italic">Separator</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={() => onRemove(item.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  const toolbarItem = TOOLBAR_ITEMS.find((i) => i.id === item.value);
  const iconSvg = getToolbarIcon(item.value);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 border rounded-lg bg-background",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab hover:bg-muted rounded p-0.5"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      {iconSvg ? (
        <CKIcon svg={iconSvg} className="h-4 w-4 flex-shrink-0" />
      ) : (
        <span className="h-4 w-4 flex items-center justify-center text-xs font-medium flex-shrink-0">
          {item.value.slice(0, 2).toUpperCase()}
        </span>
      )}
      <span className="text-sm flex-1 truncate">{toolbarItem?.label || item.value}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 flex-shrink-0"
        onClick={() => onRemove(item.id)}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Counter for generating unique IDs
let idCounter = 0;
const generateUniqueId = () => `item-${++idCounter}`;

export function GroupDialog({
  open,
  onOpenChange,
  onSave,
  initialGroup,
}: GroupDialogProps) {
  const [group, setGroup] = useState<string>("");
  const [label, setLabel] = useState<string>("");
  const [icon, setIcon] = useState<string>("text");
  const [withText, setWithText] = useState<boolean>(true);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Convert string array to SelectedItem array
  const parseItems = useCallback((items: string[]): SelectedItem[] => {
    return items.map((value) => ({
      id: generateUniqueId(),
      value,
      isSeparator: value === "|",
    }));
  }, []);

  // Convert SelectedItem array back to string array
  const serializeItems = useCallback((items: SelectedItem[]): string[] => {
    return items.map((item) => item.value);
  }, []);

  useEffect(() => {
    if (open) {
      if (initialGroup) {
        setGroup(initialGroup.group);
        setLabel(initialGroup.label);
        setIcon(initialGroup.icon || "text");
        setWithText(initialGroup.withText !== false);
        setSelectedItems(parseItems(initialGroup.items));
      } else {
        setGroup("");
        setLabel("");
        setIcon("text");
        setWithText(true);
        setSelectedItems([]);
      }
    }
  }, [initialGroup, open, parseItems]);

  const handleSave = () => {
    if (!group || !label || selectedItems.length === 0) return;

    onSave({
      group,
      label,
      icon,
      items: serializeItems(selectedItems),
      withText,
    });
    onOpenChange(false);
  };

  const addItem = (itemId: string) => {
    // Check if item (non-separator) is already selected
    const alreadySelected = selectedItems.some(
      (item) => !item.isSeparator && item.value === itemId
    );
    if (!alreadySelected) {
      setSelectedItems((prev) => [
        ...prev,
        { id: generateUniqueId(), value: itemId, isSeparator: false },
      ]);
    }
  };

  const addSeparator = () => {
    setSelectedItems((prev) => [
      ...prev,
      { id: generateUniqueId(), value: "|", isSeparator: true },
    ]);
  };

  const removeItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Available items (not yet selected, excluding separators)
  const selectedItemValues = selectedItems
    .filter((item) => !item.isSeparator)
    .map((item) => item.value);
  const availableItems = TOOLBAR_ITEMS.filter(
    (item) => !selectedItemValues.includes(item.id)
  );

  // Count actual items (not separators) for validation
  const actualItemCount = selectedItems.filter((item) => !item.isSeparator).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {initialGroup ? "Edit Group" : "Create Group"}
          </DialogTitle>
          <DialogDescription>
            Create a dropdown group for related toolbar items. Drag to reorder selected items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Group settings row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="group-id">Group ID</Label>
              <Input
                id="group-id"
                value={group}
                onChange={(e) =>
                  setGroup(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                }
                placeholder="e.g., formatting"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-label">Display Label</Label>
              <Input
                id="group-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Formatting"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="group-icon">Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="with-text"
                checked={withText}
                onCheckedChange={(checked) => setWithText(checked === true)}
              />
              <Label htmlFor="with-text" className="text-sm">
                Show label text alongside icon
              </Label>
            </div>
          </div>

          {/* Two-panel item selection */}
          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
            {/* Available items panel */}
            <div className="space-y-2 flex flex-col min-h-0">
              <Label>Available Items</Label>
              <p className="text-xs text-muted-foreground">
                Click to add to group
              </p>
              <div className="flex-1 overflow-y-auto border rounded-lg p-2 space-y-1 min-h-[200px] max-h-[250px]">
                {availableItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    All items selected
                  </p>
                ) : (
                  availableItems.map((item) => {
                    const iconSvg = getToolbarIcon(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => addItem(item.id)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        {iconSvg ? (
                          <CKIcon svg={iconSvg} className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <span className="h-4 w-4 flex items-center justify-center text-xs font-medium flex-shrink-0">
                            {item.id.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{item.label}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected items panel */}
            <div className="space-y-2 flex flex-col min-h-0">
              <div className="flex items-center justify-between">
                <Label>Selected Items ({actualItemCount})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSeparator}
                  className="h-7 text-xs"
                >
                  <Minus className="h-3 w-3 mr-1" />
                  Add Separator
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Drag to reorder, click X to remove
              </p>
              <div className="flex-1 overflow-y-auto border rounded-lg p-2 space-y-1 min-h-[200px] max-h-[250px]">
                {selectedItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No items selected
                  </p>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={selectedItems.map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-1">
                        {selectedItems.map((item) => (
                          <SortableSelectedItem
                            key={item.id}
                            item={item}
                            onRemove={removeItem}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!group || !label || actualItemCount === 0}
          >
            {initialGroup ? "Update Group" : "Create Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CKEditorIcons, getToolbarIcon, getGroupIcon } from "@/lib/ckeditor-icons";
import { X, GripVertical, Settings2 } from "lucide-react";
import { TOOLBAR_ITEMS, type ToolbarGroup } from "@/types";

// Helper to get item definition by ID
function getItemDefinition(itemId: string) {
  return TOOLBAR_ITEMS.find((item) => item.id === itemId);
}

// CKEditor SVG Icon component
function CKIcon({ svg, className }: { svg: string; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center justify-center [&>svg]:w-full [&>svg]:h-full", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

// Toolbar item representation for the builder
export type ToolbarConfigItem = {
  id: string; // Unique ID for sorting
  type: "item" | "separator" | "group";
  itemId?: string; // For regular items
  group?: ToolbarGroup; // For groups
};

interface SortableItemProps {
  item: ToolbarConfigItem;
  onRemove: (id: string) => void;
  onEditGroup?: (id: string) => void;
}

function SortableToolbarItem({ item, onRemove, onEditGroup }: SortableItemProps) {
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

  if (item.type === "separator") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
              "relative group flex items-center justify-center px-1 cursor-grab",
              isDragging && "opacity-50"
            )}
          >
            <div className="w-px h-8 bg-border" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="font-medium">Separator</p>
          <p className="text-xs opacity-80">Visual divider between items</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (item.type === "group" && item.group) {
    const groupIconSvg = getGroupIcon(item.group.icon || "");
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
              "relative group flex items-center gap-1 px-2 py-1.5 rounded bg-muted border cursor-grab",
              isDragging && "opacity-50"
            )}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
            <CKIcon svg={groupIconSvg} className="h-4 w-4" />
            <span className="text-sm">{item.group.label}</span>
            <CKIcon svg={CKEditorIcons.chevronDown} className="h-3 w-3" />
            {/* Edit button on top-left */}
            {onEditGroup && (
              <Button
                variant="outline"
                size="icon"
                className="absolute -top-2 -left-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditGroup(item.id);
                }}
              >
                <Settings2 className="h-3 w-3" />
              </Button>
            )}
            {/* Remove button on top-right */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[250px]">
          <p className="font-medium">{item.group.label} (Dropdown Group)</p>
          <p className="text-xs opacity-80">
            Contains: {item.group.items.join(", ")}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Regular item
  const iconSvg = getToolbarIcon(item.itemId || "");
  const itemDef = getItemDefinition(item.itemId || "");
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className={cn(
            "relative group flex items-center gap-1 p-1.5 rounded bg-background border cursor-grab hover:bg-muted transition-colors",
            isDragging && "opacity-50"
          )}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
          {iconSvg ? (
            <CKIcon svg={iconSvg} className="h-4 w-4" />
          ) : (
            <span className="h-4 w-4 flex items-center justify-center text-xs font-medium">
              {(item.itemId || "").slice(0, 2).toUpperCase()}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[200px]">
        <p className="font-medium">{itemDef?.label || item.itemId}</p>
        {itemDef?.description && (
          <p className="text-xs opacity-80">{itemDef.description}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

interface ToolbarConfigProps {
  items: ToolbarConfigItem[];
  onRemove: (id: string) => void;
  onEditGroup?: (id: string) => void;
}

export function ToolbarConfig({ items, onRemove, onEditGroup }: ToolbarConfigProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "toolbar-config",
  });

  return (
    <TooltipProvider delayDuration={300}>
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[100px] p-4 border-2 border-dashed rounded-lg transition-colors",
          isOver && "border-primary bg-primary/5",
          items.length === 0 && "flex items-center justify-center"
        )}
      >
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Drop toolbar items here or drag from the palette below
          </p>
        ) : (
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <SortableToolbarItem
                  key={item.id}
                  item={item}
                  onRemove={onRemove}
                  onEditGroup={onEditGroup}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </TooltipProvider>
  );
}

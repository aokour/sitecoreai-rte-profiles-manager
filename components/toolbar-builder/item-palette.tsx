"use client";

import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getToolbarIcon } from "@/lib/ckeditor-icons";
import { ChevronDown, ChevronUp, GripVertical, Minus, FolderPlus } from "lucide-react";
import { CATEGORY_LABELS, getItemsByCategory, type ToolbarCategory } from "@/types";

// CKEditor SVG Icon component
function CKIcon({ svg, className }: { svg: string; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center justify-center [&>svg]:w-full [&>svg]:h-full", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

interface DraggableItemProps {
  id: string;
  label: string;
  description: string;
}

function DraggableItem({ id, label, description }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${id}`,
    data: { type: "toolbar-item", itemId: id },
  });

  const iconSvg = getToolbarIcon(id);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex flex-col items-center gap-1 p-3 rounded-lg border bg-background cursor-grab hover:bg-muted hover:border-primary/50 transition-all group",
        isDragging && "opacity-50 shadow-lg"
      )}
      title={description}
    >
      <div className="flex items-center justify-center h-8 w-8">
        {iconSvg ? (
          <CKIcon svg={iconSvg} className="h-6 w-6" />
        ) : (
          <span className="h-6 w-6 flex items-center justify-center text-sm font-medium bg-muted rounded">
            {id.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <span className="text-xs font-medium text-center truncate w-full">{label}</span>
      <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

interface ItemPaletteDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  onAddSeparator: () => void;
  onAddGroup: () => void;
}

export function ItemPaletteDrawer({ 
  isOpen, 
  onToggle, 
  onAddSeparator, 
  onAddGroup 
}: ItemPaletteDrawerProps) {
  const categories: { id: ToolbarCategory; label: string }[] = [
    { id: "text-formatting", label: "Formatting" },
    { id: "color-controls", label: "Colors" },
    { id: "structure", label: "Structure" },
    { id: "lists-indentation", label: "Lists" },
    { id: "links", label: "Links" },
    { id: "media-tables", label: "Media" },
    { id: "advanced", label: "Advanced" },
  ];

  return (
    <Card className="rounded-t-none border-t">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-sm font-medium">Items Palette</CardTitle>
            <span className="text-xs text-muted-foreground">
              Drag items to add to toolbar
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Special items buttons - always visible */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onAddSeparator}
              className="h-8 text-xs"
            >
              <Minus className="h-3 w-3 mr-1" />
              Separator
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onAddGroup}
              className="h-8 text-xs"
            >
              <FolderPlus className="h-3 w-3 mr-1" />
              Group
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="pt-0 pb-4">
          <Tabs defaultValue="text-formatting" className="w-full">
            <TabsList className="w-full justify-start h-auto flex-wrap gap-1.5 bg-transparent p-0 mb-4">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="text-xs border border-border rounded-full px-3 py-1 data-[state=active]:bg-neutral-900 data-[state=active]:text-white data-[state=active]:border-neutral-900 dark:data-[state=active]:bg-white dark:data-[state=active]:text-neutral-900 dark:data-[state=active]:border-white"
                >
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => {
              const items = getItemsByCategory(category.id);
              return (
                <TabsContent key={category.id} value={category.id} className="mt-0">
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                    {items.map((item) => (
                      <DraggableItem
                        key={item.id}
                        id={item.id}
                        label={item.label}
                        description={item.description}
                      />
                    ))}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}

// Keep the old export for backwards compatibility if needed elsewhere
export function ItemPalette({ onAddSeparator, onAddGroup }: { onAddSeparator: () => void; onAddGroup: () => void }) {
  return (
    <ItemPaletteDrawer
      isOpen={true}
      onToggle={() => {}}
      onAddSeparator={onAddSeparator}
      onAddGroup={onAddGroup}
    />
  );
}

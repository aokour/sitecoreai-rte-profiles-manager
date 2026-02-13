"use client";

import { cn } from "@/lib/utils";
import { CKEditorIcons, getToolbarIcon, getGroupIcon } from "@/lib/ckeditor-icons";
import { parseProfileValue, TOOLBAR_ITEMS, type ToolbarGroup } from "@/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// CKEditor SVG Icon component
function CKIcon({ svg, className }: { svg: string; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center justify-center [&>svg]:w-full [&>svg]:h-full", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

// Get item label from TOOLBAR_ITEMS
function getItemLabel(itemId: string): string {
  const item = TOOLBAR_ITEMS.find((i) => i.id === itemId);
  return item?.label || itemId;
}

interface ToolbarPreviewProps {
  value: string;
  compact?: boolean;
  className?: string;
}

export function ToolbarPreview({ value, compact = false, className }: ToolbarPreviewProps) {
  const config = parseProfileValue(value);

  if (!config || !config.toolbar?.items) {
    return (
      <div className={cn("text-xs text-muted-foreground", className)}>
        Invalid configuration
      </div>
    );
  }

  const items = config.toolbar.items;
  const displayItems = compact ? items.slice(0, 8) : items;
  const hasMore = compact && items.length > 8;

  return (
    <div className={cn("flex items-center gap-0.5 flex-wrap", className)}>
      {displayItems.map((item, index) => {
        // Handle separator
        if (item === "|") {
          return (
            <div
              key={`sep-${index}`}
              className="w-px h-5 bg-border mx-1"
            />
          );
        }

        // Handle group
        if (typeof item === "object" && item !== null) {
          const group = item as ToolbarGroup;
          const groupIconSvg = getGroupIcon(group.icon || "");
          return (
            <Popover key={`group-${group.group}-${index}`}>
              <PopoverTrigger asChild>
                <button
                  className="flex items-center gap-0.5 px-1.5 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                  title={`${group.label} (click to view items)`}
                >
                  <CKIcon svg={groupIconSvg} className="h-3 w-3" />
                  {!compact && group.withText !== false && (
                    <span className="text-xs">{group.label}</span>
                  )}
                  <CKIcon svg={CKEditorIcons.chevronDown} className="h-2.5 w-2.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1.5" align="start">
                <div className="flex items-center gap-0.5">
                  {group.items.map((groupItem, i) => {
                    // Handle separator within group
                    if (groupItem === "|") {
                      return (
                        <div
                          key={`sep-${i}`}
                          className="w-px h-5 bg-border mx-0.5"
                        />
                      );
                    }
                    const itemIconSvg = getToolbarIcon(groupItem);
                    return (
                      <div
                        key={`${groupItem}-${i}`}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground cursor-pointer"
                        title={getItemLabel(groupItem)}
                      >
                        {itemIconSvg ? (
                          <CKIcon svg={itemIconSvg} className="h-4 w-4" />
                        ) : (
                          <span className="h-4 w-4 flex items-center justify-center text-xs font-medium">
                            {groupItem.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          );
        }

        // Handle regular item
        const iconSvg = getToolbarIcon(item as string);
        if (!iconSvg) {
          return (
            <div
              key={`${item}-${index}`}
              className="px-1.5 py-1 rounded bg-muted text-muted-foreground text-xs"
              title={item as string}
            >
              {(item as string).slice(0, 2).toUpperCase()}
            </div>
          );
        }

        return (
          <div
            key={`${item}-${index}`}
            className="p-1 rounded hover:bg-muted text-muted-foreground"
            title={item as string}
          >
            <CKIcon svg={iconSvg} className="h-3.5 w-3.5" />
          </div>
        );
      })}
      {hasMore && (
        <span className="text-xs text-muted-foreground ml-1">
          +{items.length - 8} more
        </span>
      )}
    </div>
  );
}

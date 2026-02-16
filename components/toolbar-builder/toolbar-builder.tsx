"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { ItemPaletteDrawer } from "./item-palette";
import { ToolbarConfig, type ToolbarConfigItem } from "./toolbar-config";
import { GroupDialog } from "./group-dialog";
import { StyleEditor } from "./style-editor";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToolbarPreview } from "@/components/profiles/toolbar-preview";
import {
  Eye,
  Code,
  Layers,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Paintbrush,
  Settings,
  AlertCircle as InfoIcon,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  validateProfileConfig,
  type EditorProfileConfig,
  type ToolbarGroup,
  type ValidationResult,
  type StyleDefinition,
} from "@/types";

// Generate unique ID for builder items
let itemIdCounter = 0;
const generateId = () => `builder-item-${++itemIdCounter}`;

interface ToolbarBuilderProps {
  profileName: string;
  onProfileNameChange: (name: string) => void;
  initialConfig?: EditorProfileConfig;
  onConfigChange: (config: EditorProfileConfig) => void;
  showValidation?: boolean;
}

export function ToolbarBuilder({
  profileName,
  onProfileNameChange,
  initialConfig,
  onConfigChange,
  showValidation = false,
}: ToolbarBuilderProps) {
  // Convert initial config to builder items
  const parseConfigToItems = useCallback(
    (config: EditorProfileConfig | undefined): ToolbarConfigItem[] => {
      if (!config?.toolbar?.items) return [];

      return config.toolbar.items.map((item) => {
        if (item === "|") {
          return { id: generateId(), type: "separator" as const };
        }
        if (typeof item === "object" && item !== null) {
          return {
            id: generateId(),
            type: "group" as const,
            group: item as ToolbarGroup,
          };
        }
        return {
          id: generateId(),
          type: "item" as const,
          itemId: item as string,
        };
      });
    },
    [],
  );

  const [items, setItems] = useState<ToolbarConfigItem[]>(() =>
    parseConfigToItems(initialConfig),
  );
  const [styles, setStyles] = useState<StyleDefinition[]>(
    () => initialConfig?.style?.definitions || [],
  );
  const [disableContentWrap, setDisableContentWrap] = useState<boolean>(
    () => initialConfig?.disableContentWrap || false,
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [jsonValidation, setJsonValidation] = useState<ValidationResult>({
    valid: true,
    errors: [],
    warnings: [],
  });
  const [rawJsonInput, setRawJsonInput] = useState<string>("");
  const [activeTab, setActiveTab] = useState("visual");
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [stylesModalOpen, setStylesModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [profileNameTouched, setProfileNameTouched] = useState(false);

  // Profile name validation - show error if touched OR if parent requested validation
  const profileNameError = (profileNameTouched || showValidation) && !profileName.trim() 
    ? "Profile name is required" 
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Convert items back to config
  const itemsToConfig = useCallback(
    (
      builderItems: ToolbarConfigItem[],
      currentStyles: StyleDefinition[],
      contentWrapDisabled: boolean,
    ): EditorProfileConfig => {
      const toolbarItems = builderItems
        .map((item) => {
          if (item.type === "separator") return "|";
          if (item.type === "group" && item.group) return item.group;
          return item.itemId || "";
        })
        .filter(Boolean);

      const config: EditorProfileConfig = {
        toolbar: { items: toolbarItems },
      };

      // Only include style property if there are styles defined
      if (currentStyles.length > 0) {
        config.style = { definitions: currentStyles };
      }

      // Only include disableContentWrap if true
      if (contentWrapDisabled) {
        config.disableContentWrap = true;
      }

      return config;
    },
    [],
  );

  // Update parent when items change
  const updateConfig = useCallback(
    (
      newItems: ToolbarConfigItem[],
      newStyles?: StyleDefinition[],
      newDisableContentWrap?: boolean,
    ) => {
      setItems(newItems);
      const currentStyles = newStyles !== undefined ? newStyles : styles;
      const currentDisableContentWrap =
        newDisableContentWrap !== undefined
          ? newDisableContentWrap
          : disableContentWrap;
      onConfigChange(
        itemsToConfig(newItems, currentStyles, currentDisableContentWrap),
      );
    },
    [onConfigChange, itemsToConfig, styles, disableContentWrap],
  );

  // Update styles
  const handleStylesChange = useCallback(
    (newStyles: StyleDefinition[]) => {
      setStyles(newStyles);
      onConfigChange(itemsToConfig(items, newStyles, disableContentWrap));
    },
    [onConfigChange, itemsToConfig, items, disableContentWrap],
  );

  // Update disableContentWrap
  const handleDisableContentWrapChange = useCallback(
    (value: boolean) => {
      setDisableContentWrap(value);
      onConfigChange(itemsToConfig(items, styles, value));
    },
    [onConfigChange, itemsToConfig, items, styles],
  );

  // Check if "style" toolbar item is in the config
  const hasStyleToolbarItem = useMemo(() => {
    return items.some((item) => item.itemId === "style");
  }, [items]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Check if dragging from palette
    if (String(active.id).startsWith("palette-")) {
      const itemId = active.data.current?.itemId;
      if (itemId) {
        const newItem: ToolbarConfigItem = {
          id: generateId(),
          type: "item",
          itemId,
        };
        updateConfig([...items, newItem]);
      }
      return;
    }

    // Reordering within the toolbar
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        updateConfig(arrayMove(items, oldIndex, newIndex));
      }
    }
  };

  const handleRemove = (id: string) => {
    updateConfig(items.filter((item) => item.id !== id));
  };

  const handleAddSeparator = () => {
    const newItem: ToolbarConfigItem = {
      id: generateId(),
      type: "separator",
    };
    updateConfig([...items, newItem]);
  };

  const handleAddGroup = () => {
    setEditingGroupId(null);
    setGroupDialogOpen(true);
  };

  const handleEditGroup = (id: string) => {
    setEditingGroupId(id);
    setGroupDialogOpen(true);
  };

  const handleSaveGroup = (group: ToolbarGroup) => {
    if (editingGroupId) {
      // Update existing group
      updateConfig(
        items.map((item) =>
          item.id === editingGroupId ? { ...item, group } : item,
        ),
      );
    } else {
      // Add new group
      const newItem: ToolbarConfigItem = {
        id: generateId(),
        type: "group",
        group,
      };
      updateConfig([...items, newItem]);
    }
    setEditingGroupId(null);
  };

  const editingGroup = editingGroupId
    ? items.find((i) => i.id === editingGroupId)?.group
    : undefined;

  const currentConfig = useMemo(
    () => itemsToConfig(items, styles, disableContentWrap),
    [items, styles, disableContentWrap, itemsToConfig],
  );
  const configJson = JSON.stringify(currentConfig, null, 2);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="profile-name">
            Profile Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="profile-name"
            value={profileName}
            onChange={(e) => onProfileNameChange(e.target.value)}
            onBlur={() => setProfileNameTouched(true)}
            placeholder="Enter profile name"
            className={`max-w-md ${profileNameError ? "border-destructive focus-visible:ring-destructive" : ""}`}
            aria-invalid={!!profileNameError}
            aria-describedby={profileNameError ? "profile-name-error" : undefined}
          />
          {profileNameError && (
            <p id="profile-name-error" className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {profileNameError}
            </p>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="visual" className="gap-2">
              <Layers className="h-4 w-4" />
              Visual Builder
            </TabsTrigger>
            <TabsTrigger value="json" className="gap-2">
              <Code className="h-4 w-4" />
              JSON Editor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-0">
            {/* Single column layout */}
            <div className="space-y-0">
              {/* Toolbar Configuration with Preview and Custom Styles buttons */}
              <Card className="rounded-b-none border-b-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="text-sm">
                      Toolbar Configuration
                    </CardTitle>
                    <CardDescription>
                      Drag items here to build your toolbar. Drag to reorder.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSettingsModalOpen(true)}
                      className="gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Content Wrapper
                      {disableContentWrap && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-amber-600 text-white dark:bg-amber-500 dark:text-neutral-900 rounded-full">
                          !
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStylesModalOpen(true)}
                      className="gap-2"
                    >
                      <Paintbrush className="h-4 w-4" />
                      Custom Styles
                      {styles.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900 rounded-full">
                          {styles.length}
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewModalOpen(true)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ToolbarConfig
                    items={items}
                    onRemove={handleRemove}
                    onEditGroup={handleEditGroup}
                  />
                </CardContent>
              </Card>

              {/* Items Palette Drawer directly below toolbar config */}
              <ItemPaletteDrawer
                isOpen={paletteOpen}
                onToggle={() => setPaletteOpen(!paletteOpen)}
                onAddSeparator={handleAddSeparator}
                onAddGroup={handleAddGroup}
              />
            </div>
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>JSON Configuration</CardTitle>
                <CardDescription>
                  Edit the toolbar configuration directly in JSON format. Only
                  valid toolbar items will be accepted.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  value={rawJsonInput || configJson}
                  onChange={(e) => {
                    const value = e.target.value;
                    setRawJsonInput(value);

                    // Validate the JSON
                    const validation = validateProfileConfig(value);
                    setJsonValidation(validation);

                    // Only update config if valid
                    if (validation.valid) {
                      try {
                        const parsed = JSON.parse(value);
                        const newItems = parseConfigToItems(parsed);
                        setItems(newItems);
                        // Also update styles from parsed config
                        if (parsed.style?.definitions && Array.isArray(parsed.style.definitions)) {
                          setStyles(parsed.style.definitions);
                        } else {
                          setStyles([]);
                        }
                        // Update disableContentWrap from parsed config
                        setDisableContentWrap(
                          parsed.disableContentWrap === true,
                        );
                        onConfigChange(parsed);
                      } catch {
                        // Should not happen if validation passed
                      }
                    }
                  }}
                  onFocus={() => {
                    // Initialize raw input when focusing
                    if (!rawJsonInput) {
                      setRawJsonInput(configJson);
                      setJsonValidation(validateProfileConfig(configJson));
                    }
                  }}
                  onBlur={() => {
                    // Reset raw input if valid (sync with visual builder)
                    if (jsonValidation.valid) {
                      setRawJsonInput("");
                    }
                  }}
                  className={`w-full h-80 font-mono text-sm p-4 border rounded-lg ${
                    jsonValidation.errors.length > 0
                      ? "border-red-300 bg-red-50/30 dark:bg-red-950/20"
                      : "bg-muted/30"
                  }`}
                  spellCheck={false}
                />

                {/* Validation Status */}
                <div className="space-y-2">
                  {jsonValidation.valid &&
                    jsonValidation.warnings.length === 0 && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Configuration is valid</span>
                      </div>
                    )}

                  {jsonValidation.errors.length > 0 && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                      <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>Errors ({jsonValidation.errors.length})</span>
                      </div>
                      <ul className="text-sm text-red-600 dark:text-red-400 space-y-1 list-disc list-inside">
                        {jsonValidation.errors.slice(0, 5).map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                        {jsonValidation.errors.length > 5 && (
                          <li className="text-red-500">
                            ...and {jsonValidation.errors.length - 5} more
                            errors
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {jsonValidation.warnings.length > 0 && (
                    <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900">
                      <div className="flex items-center gap-2 text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Warnings ({jsonValidation.warnings.length})</span>
                      </div>
                      <ul className="text-sm text-yellow-600 dark:text-yellow-400 space-y-1 list-disc list-inside">
                        {jsonValidation.warnings.map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Toolbar Preview</DialogTitle>
            <DialogDescription>
              This is how the toolbar will appear in the Sitecore RTE editor.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 border rounded-lg bg-muted/30">
            <ToolbarPreview value={JSON.stringify(currentConfig)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Styles Modal */}
      <Dialog open={stylesModalOpen} onOpenChange={setStylesModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Custom Styles</DialogTitle>
            <DialogDescription>
              Define custom styles that authors can apply to content in the RTE
              editor.
            </DialogDescription>
          </DialogHeader>
          <StyleEditor
            styles={styles}
            onChange={handleStylesChange}
            hasStyleToolbarItem={hasStyleToolbarItem}
            isInModal={true}
          />
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
            <DialogDescription>
              Configure advanced settings for this editor profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Disable Content Wrap Setting */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="disable-content-wrap"
                    className="text-base font-medium"
                  >
                    Disable Content Wrapper
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Disable the automatic{" "}
                    <code className="px-1 py-0.5 bg-muted rounded text-xs">
                      ck-content
                    </code>{" "}
                    wrapper around RTE output
                  </p>
                </div>
                <Switch
                  id="disable-content-wrap"
                  checked={disableContentWrap}
                  onCheckedChange={handleDisableContentWrapChange}
                />
              </div>

              {/* Warning when enabled */}
              {disableContentWrap && (
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-amber-800 dark:text-amber-400">
                        Important: Custom styling required
                      </p>
                      <p className="text-amber-700 dark:text-amber-500">
                        When disabled, the RTE will output content without the
                        automatic{" "}
                        <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/50 rounded text-xs">
                          ck-content
                        </code>{" "}
                        wrapper. You must ensure:
                      </p>
                      <ul className="list-disc list-inside text-amber-700 dark:text-amber-500 space-y-1 ml-2">
                        <li>
                          Your HTML markup uses the{" "}
                          <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/50 rounded text-xs">
                            ck-content
                          </code>{" "}
                          class in an ancestor element, OR
                        </li>
                        <li>
                          Provide equivalent CSS in your site&apos;s stylesheet
                          that replaces all{" "}
                          <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/50 rounded text-xs">
                            .ck-content
                          </code>{" "}
                          rules
                        </li>
                      </ul>
                      <p className="text-amber-700 dark:text-amber-500 mt-2">
                        Without proper styling, features like images, block
                        quotes, tables, and typography may not render correctly.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info when disabled */}
              {!disableContentWrap && (
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                  <div className="flex gap-3">
                    <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
                      <p>
                        <strong>Default behavior:</strong> RTE output is wrapped
                        in{" "}
                        <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded text-xs">
                          &lt;div
                          class=&quot;ck-content&quot;&gt;...&lt;/div&gt;
                        </code>
                      </p>
                      <p>
                        This ensures content styles (images, block quotes,
                        tables, typography) are properly scoped and rendered
                        consistently between the editor and published site.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <GroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        onSave={handleSaveGroup}
        initialGroup={editingGroup}
      />

      <DragOverlay>
        {activeId && (
          <div className="p-2 bg-background border rounded shadow-lg">
            Dragging...
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

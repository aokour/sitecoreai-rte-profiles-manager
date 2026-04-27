"use client";

import { useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Paintbrush,
  AlertCircle,
  GripVertical,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STYLE_ELEMENT_GROUP_ORDER,
  STYLE_ELEMENT_PRESETS,
  VALID_STYLE_ELEMENTS,
  type StyleDefinition,
  type StyleElementGroup,
} from "@/types";

const TAG_NAME_REGEX = /^[a-z][a-z0-9-]*$/;

interface StyleEditorProps {
  styles: StyleDefinition[];
  onChange: (styles: StyleDefinition[]) => void;
  hasStyleToolbarItem: boolean;
  isInModal?: boolean;
}

interface SortableStyleRowProps {
  style: StyleDefinition;
  index: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

function SortableStyleRow({ style, index, onEdit, onDelete }: SortableStyleRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `style-${index}` });

  const rowStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={rowStyle}
      className={cn(
        "flex items-center justify-between p-3 border rounded-lg bg-background",
        isDragging && "opacity-50 shadow-lg z-10"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab hover:bg-muted rounded p-0.5 mr-2 flex-shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{style.name}</span>
          <Badge colorScheme="neutral" className="text-xs">
            &lt;{style.element}&gt;
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {style.classes.map((cls, i) => (
            <code key={i} className="text-xs px-1.5 py-0.5 rounded bg-muted">
              .{cls}
            </code>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 ml-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(index)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(index)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function StyleEditor({ styles, onChange, hasStyleToolbarItem, isInModal = false }: StyleEditorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<StyleDefinition>({
    name: "",
    element: "p",
    classes: [],
  });
  const [classInput, setClassInput] = useState("");
  const [useCustomElement, setUseCustomElement] = useState(false);
  const [elementPopoverOpen, setElementPopoverOpen] = useState(false);

  const presetsByGroup = useMemo(() => {
    const map = {} as Record<StyleElementGroup, typeof STYLE_ELEMENT_PRESETS>;
    for (const group of STYLE_ELEMENT_GROUP_ORDER) {
      map[group] = STYLE_ELEMENT_PRESETS.filter((p) => p.group === group);
    }
    return map;
  }, []);

  const currentPresetLabel = useMemo(
    () => STYLE_ELEMENT_PRESETS.find((p) => p.value === formData.element)?.label,
    [formData.element]
  );
  const triggerLabel = useCustomElement
    ? "Custom element"
    : currentPresetLabel ?? "Select element";

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = Number(String(active.id).replace("style-", ""));
    const newIndex = Number(String(over.id).replace("style-", ""));
    if (Number.isNaN(oldIndex) || Number.isNaN(newIndex)) return;
    onChange(arrayMove(styles, oldIndex, newIndex));
  };

  const handleAddStyle = () => {
    setEditingIndex(null);
    setFormData({ name: "", element: "p", classes: [] });
    setClassInput("");
    setUseCustomElement(false);
    setDialogOpen(true);
  };

  const handleEditStyle = (index: number) => {
    const style = styles[index];
    setEditingIndex(index);
    setFormData({ ...style });
    setClassInput(style.classes.join(" "));
    // Auto-enter custom mode when the saved tag isn't in the curated list so
    // the input is pre-populated and the picker reflects the actual value.
    setUseCustomElement(!VALID_STYLE_ELEMENTS.includes(style.element));
    setDialogOpen(true);
  };

  const handleDeleteStyle = (index: number) => {
    const newStyles = styles.filter((_, i) => i !== index);
    onChange(newStyles);
  };

  const handleSave = () => {
    // Parse classes from input
    const classes = classInput
      .split(/[\s,]+/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const newStyle: StyleDefinition = {
      name: formData.name.trim(),
      element: formData.element,
      classes,
    };

    if (editingIndex !== null) {
      const newStyles = [...styles];
      newStyles[editingIndex] = newStyle;
      onChange(newStyles);
    } else {
      onChange([...styles, newStyle]);
    }

    setDialogOpen(false);
  };

  const elementIsValid = useCustomElement
    ? TAG_NAME_REGEX.test(formData.element)
    : Boolean(formData.element);
  const customElementHasError =
    useCustomElement && formData.element.length > 0 && !TAG_NAME_REGEX.test(formData.element);
  const customElementIsUnknown =
    useCustomElement &&
    TAG_NAME_REGEX.test(formData.element) &&
    !VALID_STYLE_ELEMENTS.includes(formData.element);
  const isFormValid = Boolean(formData.name.trim()) && elementIsValid && Boolean(classInput.trim());

  const content = (
    <div className="space-y-4">
      {!hasStyleToolbarItem && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 text-sm">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="text-yellow-700 dark:text-yellow-400">
            <strong>Note:</strong> Add the &quot;Styles&quot; item to your toolbar to enable the Styles dropdown. Without it, custom styles won&apos;t be accessible to authors.
          </div>
        </div>
      )}

      {styles.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Paintbrush className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No custom styles defined</p>
          <p className="text-xs">Add styles to give authors ready-to-use formatting options</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={styles.map((_, index) => `style-${index}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {styles.map((style, index) => (
                <SortableStyleRow
                  key={`style-${index}`}
                  style={style}
                  index={index}
                  onEdit={handleEditStyle}
                  onDelete={handleDeleteStyle}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Button variant="outline" size="sm" onClick={handleAddStyle} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Custom Style
      </Button>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setElementPopoverOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Edit Style" : "Add Custom Style"}
            </DialogTitle>
            <DialogDescription>
              Define a custom style that authors can apply to content. The style will render with the specified HTML element and CSS classes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="style-name">Display Name</Label>
              <Input
                id="style-name"
                placeholder="e.g., Article Category, Info Box"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                The name shown in the Styles dropdown menu
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style-element">HTML Element</Label>
              <Popover open={elementPopoverOpen} onOpenChange={setElementPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="style-element"
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={elementPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate text-left">{triggerLabel}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-[var(--radix-popover-trigger-width)] min-w-[420px] p-0"
                >
                  <Command>
                    <CommandInput
                      placeholder="Search elements..."
                      aria-label="Search HTML elements"
                    />
                    <CommandList className="max-h-[360px]">
                      <CommandEmpty>No matching elements.</CommandEmpty>
                      {STYLE_ELEMENT_GROUP_ORDER.map((group) => (
                        <CommandGroup key={group} heading={group}>
                          <div className="grid grid-cols-2 gap-x-1">
                            {presetsByGroup[group].map((el) => (
                              <CommandItem
                                key={el.value}
                                value={`${el.label} ${el.value}`}
                                onSelect={() => {
                                  setUseCustomElement(false);
                                  setFormData({ ...formData, element: el.value });
                                  setElementPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    !useCustomElement && formData.element === el.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <span className="truncate">{el.label}</span>
                              </CommandItem>
                            ))}
                          </div>
                        </CommandGroup>
                      ))}
                      <CommandSeparator />
                      <CommandGroup heading="Other">
                        <CommandItem
                          value="custom element"
                          onSelect={() => {
                            setUseCustomElement(true);
                            setFormData({
                              ...formData,
                              element: VALID_STYLE_ELEMENTS.includes(formData.element)
                                ? ""
                                : formData.element,
                            });
                            setElementPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              useCustomElement ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Custom element...
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {useCustomElement ? (
                <div className="space-y-1">
                  <Input
                    id="style-element-custom"
                    placeholder="e.g., section"
                    value={formData.element}
                    onChange={(e) =>
                      setFormData({ ...formData, element: e.target.value.toLowerCase() })
                    }
                    aria-invalid={customElementHasError}
                  />
                  {customElementHasError ? (
                    <p className="text-xs text-destructive">
                      Use a lowercase tag name starting with a letter (letters, digits, or hyphens).
                    </p>
                  ) : customElementIsUnknown ? (
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      &quot;{formData.element}&quot; is not in the recommended list. Make sure your CKEditor schema/plugins support it.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Use a lowercase tag name (letters, digits, hyphens). Make sure your CKEditor schema supports it.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  The HTML element that wraps the styled content
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="style-classes">CSS Classes</Label>
              <Input
                id="style-classes"
                placeholder="e.g., category secondary heading"
                value={classInput}
                onChange={(e) => setClassInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Space-separated CSS class names (must exist in your site&apos;s stylesheet)
              </p>
            </div>

            {formData.name && formData.element && classInput && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Preview:</p>
                <code className="text-xs block">
                  &lt;{formData.element} class=&quot;{classInput.split(/[\s,]+/).filter(c => c).join(" ")}&quot;&gt;
                  <br />
                  &nbsp;&nbsp;{formData.name} content...
                  <br />
                  &lt;/{formData.element}&gt;
                </code>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!isFormValid}>
              {editingIndex !== null ? "Save Changes" : "Add Style"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // When in modal, just return the content without card wrapper
  if (isInModal) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Paintbrush className="h-4 w-4" />
          <CardTitle className="text-sm">Custom Styles</CardTitle>
        </div>
        <CardDescription>
          Define custom styles that appear in the Styles dropdown. Authors can apply these to selected content. Drag to reorder.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}

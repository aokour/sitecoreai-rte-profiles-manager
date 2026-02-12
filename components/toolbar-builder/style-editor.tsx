"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Paintbrush, AlertCircle } from "lucide-react";
import type { StyleDefinition } from "@/types";

// Common HTML elements for styles
const STYLE_ELEMENTS = [
  { value: "p", label: "Paragraph (p)" },
  { value: "span", label: "Span (span)" },
  { value: "div", label: "Division (div)" },
  { value: "h1", label: "Heading 1 (h1)" },
  { value: "h2", label: "Heading 2 (h2)" },
  { value: "h3", label: "Heading 3 (h3)" },
  { value: "h4", label: "Heading 4 (h4)" },
  { value: "h5", label: "Heading 5 (h5)" },
  { value: "h6", label: "Heading 6 (h6)" },
  { value: "blockquote", label: "Blockquote (blockquote)" },
  { value: "pre", label: "Preformatted (pre)" },
  { value: "code", label: "Code (code)" },
];

interface StyleEditorProps {
  styles: StyleDefinition[];
  onChange: (styles: StyleDefinition[]) => void;
  hasStyleToolbarItem: boolean;
  isInModal?: boolean;
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

  const handleAddStyle = () => {
    setEditingIndex(null);
    setFormData({ name: "", element: "p", classes: [] });
    setClassInput("");
    setDialogOpen(true);
  };

  const handleEditStyle = (index: number) => {
    const style = styles[index];
    setEditingIndex(index);
    setFormData({ ...style });
    setClassInput(style.classes.join(" "));
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

  const isFormValid = formData.name.trim() && formData.element && classInput.trim();

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
        <div className="space-y-2">
          {styles.map((style, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg bg-background"
            >
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
                  onClick={() => handleEditStyle(index)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteStyle(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={handleAddStyle} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Custom Style
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
              <Select
                value={formData.element}
                onValueChange={(value) => setFormData({ ...formData, element: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select element" />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_ELEMENTS.map((el) => (
                    <SelectItem key={el.value} value={el.value}>
                      {el.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The HTML element that wraps the styled content
              </p>
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
          Define custom styles that appear in the Styles dropdown. Authors can apply these to selected content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}

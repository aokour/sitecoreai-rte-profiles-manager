// Editor Profile Types
export interface EditorProfile {
  id: string;
  name: string;
  profile?: string; // JSON stringified EditorProfileConfig (from API)
  value?: string; // Alias for profile (for compatibility)
}

// Helper to get the profile JSON string from either property
export function getProfileValue(profile: EditorProfile): string {
  return profile.profile || profile.value || "";
}

export interface EditorProfileConfig {
  toolbar: {
    items: (string | ToolbarGroup)[];
  };
  style?: StyleDefinition[]; // Custom styles for the Styles dropdown
  disableContentWrap?: boolean; // Disable the automatic ck-content wrapper around RTE output
}

export interface ToolbarGroup {
  group: string; // Unique identifier
  label: string; // Dropdown display name
  icon?: string; // Icon identifier
  items: string[]; // List of toolbar item IDs
  withText?: boolean; // Show text with icon
}

export interface StyleDefinition {
  name: string;
  element: string;
  classes: string[];
}

// Input types for API operations
export interface CreateEditorProfileInput {
  name: string;
  value: string;
}

export interface UpdateEditorProfileInput {
  name?: string | null;
  profile?: string | null;
}

// Site Types
export interface Site {
  id: string;
  name: string;
  displayName: string;
  collectionId?: string;
  collectionName?: string;
  editorProfiles?: string | string[]; // Can be string or array
  thumbnailUrl?: string;
  hosts?: SiteHost[];
  isActive?: boolean;
  settings?: {
    editorProfiles?: string | string[];
    [key: string]: unknown;
  };
}

// Helper to parse profile IDs from string or array format
function parseProfileIds(value: string | string[] | undefined): string[] {
  if (!value) return [];
  
  if (Array.isArray(value)) {
    // Flatten in case array contains comma-separated strings
    return value.flatMap(v => 
      typeof v === 'string' && v.includes(',') 
        ? v.split(',').map(id => id.trim()).filter(Boolean)
        : v
    ).filter(Boolean);
  }
  
  if (typeof value === 'string' && value) {
    // Handle comma-separated string
    return value.split(',').map(id => id.trim()).filter(Boolean);
  }
  
  return [];
}

// Helper to get editor profile IDs from site (handles string, array, and settings.editorProfiles)
export function getSiteEditorProfiles(site: Site): string[] {
  // Check settings.editorProfiles first (where API actually stores it)
  const settingsProfiles = parseProfileIds(site.settings?.editorProfiles);
  if (settingsProfiles.length > 0) {
    return settingsProfiles;
  }
  
  // Fallback to top-level editorProfiles
  return parseProfileIds(site.editorProfiles);
}

// Helper to check if site has a specific profile
export function siteHasProfile(site: Site, profileId: string): boolean {
  return getSiteEditorProfiles(site).includes(profileId);
}

// Helper to get first editor profile from site
export function getSiteEditorProfileId(site: Site): string | undefined {
  return getSiteEditorProfiles(site)[0];
}

export interface SiteHost {
  id: string;
  name: string;
}

export interface SiteCollection {
  id: string;
  name: string;
  displayName: string;
  sites?: Site[];
}

// Toolbar Item Definitions
export interface ToolbarItemDefinition {
  id: string;
  label: string;
  description: string;
  icon?: string;
  category: ToolbarCategory;
}

export type ToolbarCategory =
  | "text-formatting"
  | "color-controls"
  | "structure"
  | "lists-indentation"
  | "links"
  | "media-tables"
  | "advanced";

// Available toolbar items configuration
export const TOOLBAR_ITEMS: ToolbarItemDefinition[] = [
  // Text Formatting
  { id: "bold", label: "Bold", description: "Bold text", category: "text-formatting" },
  { id: "italic", label: "Italic", description: "Italic text", category: "text-formatting" },
  { id: "emphasis", label: "Emphasis", description: "Custom emphasis style", category: "text-formatting" },
  { id: "underline", label: "Underline", description: "Underline text", category: "text-formatting" },
  { id: "strikethrough", label: "Strikethrough", description: "Strikethrough text", category: "text-formatting" },
  { id: "subscript", label: "Subscript", description: "Subscript formatting", category: "text-formatting" },
  { id: "superscript", label: "Superscript", description: "Superscript formatting", category: "text-formatting" },
  { id: "removeFormat", label: "Remove Format", description: "Clear all formatting", category: "text-formatting" },

  // Color Controls
  { id: "fontColor", label: "Font Color", description: "Text color picker", category: "color-controls" },
  { id: "fontBackgroundColor", label: "Background Color", description: "Highlight color", category: "color-controls" },

  // Structure
  { id: "heading", label: "Heading", description: "Heading dropdown (H1-H6, paragraph)", category: "structure" },
  { id: "alignment", label: "Alignment", description: "Align left, center, right, justify", category: "structure" },
  { id: "blockQuote", label: "Block Quote", description: "Block quotation", category: "structure" },

  // Lists & Indentation
  { id: "bulletedList", label: "Bulleted List", description: "Unordered list", category: "lists-indentation" },
  { id: "numberedList", label: "Numbered List", description: "Ordered list", category: "lists-indentation" },
  { id: "indent", label: "Indent", description: "Increase indent", category: "lists-indentation" },
  { id: "outdent", label: "Outdent", description: "Decrease indent", category: "lists-indentation" },

  // Links
  { id: "link", label: "Link", description: "External hyperlink", category: "links" },
  { id: "internalLink", label: "Internal Link", description: "Internal Sitecore item link", category: "links" },
  { id: "phoneLink", label: "Phone Link", description: "Phone number link", category: "links" },

  // Media & Tables
  { id: "sitecoreSelectMedia", label: "Media", description: "Insert media library item", category: "media-tables" },
  { id: "insertTable", label: "Table", description: "Insert table", category: "media-tables" },
  { id: "horizontalLine", label: "Horizontal Line", description: "Insert horizontal rule", category: "media-tables" },

  // Advanced
  { id: "style", label: "Styles", description: "Custom styles dropdown (requires style config)", category: "advanced" },
  { id: "sourceEditing", label: "Source", description: "Raw HTML source editor", category: "advanced" },
  { id: "sitecoreResetFieldValue", label: "Reset Value", description: "Clear value", category: "advanced" },
];

// Predefined toolbar groups
export const PREDEFINED_GROUPS: ToolbarGroup[] = [
  {
    group: "formatting",
    label: "Formatting",
    icon: "text",
    items: ["strikethrough", "subscript", "superscript", "removeFormat"],
  },
  {
    group: "insert",
    label: "Insert",
    icon: "plus",
    items: ["sitecoreSelectMedia", "insertTable", "horizontalLine"],
    withText: false,
  },
];

// Category labels for UI
export const CATEGORY_LABELS: Record<ToolbarCategory, string> = {
  "text-formatting": "Text Formatting",
  "color-controls": "Color Controls",
  "structure": "Structure",
  "lists-indentation": "Lists & Indentation",
  "links": "Links",
  "media-tables": "Media & Tables",
  "advanced": "Advanced",
};

// Helper function to get items by category
export function getItemsByCategory(category: ToolbarCategory): ToolbarItemDefinition[] {
  return TOOLBAR_ITEMS.filter((item) => item.category === category);
}

// Helper function to parse profile value
export function parseProfileValue(value: string): EditorProfileConfig | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// Helper function to stringify profile config
export function stringifyProfileConfig(config: EditorProfileConfig): string {
  return JSON.stringify(config);
}

// Validation result type
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Get all valid toolbar item IDs
export function getValidToolbarItemIds(): string[] {
  return TOOLBAR_ITEMS.map(item => item.id);
}

// Valid icon options for groups
export const VALID_GROUP_ICONS = ["text", "plus"] as const;

// Validate a toolbar group object
function validateToolbarGroup(group: unknown, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Item ${index + 1} (group)`;
  
  if (typeof group !== 'object' || group === null) {
    errors.push(`${prefix}: Must be an object`);
    return errors;
  }
  
  const g = group as Record<string, unknown>;
  
  // Required: group identifier
  if (!g.group || typeof g.group !== 'string') {
    errors.push(`${prefix}: Missing required "group" identifier (string)`);
  }
  
  // Required: label
  if (!g.label || typeof g.label !== 'string') {
    errors.push(`${prefix}: Missing required "label" (string)`);
  }
  
  // Optional: icon (must be valid)
  if (g.icon !== undefined) {
    if (typeof g.icon !== 'string') {
      errors.push(`${prefix}: "icon" must be a string`);
    } else if (!VALID_GROUP_ICONS.includes(g.icon as typeof VALID_GROUP_ICONS[number])) {
      errors.push(`${prefix}: Invalid icon "${g.icon}". Valid options: ${VALID_GROUP_ICONS.join(", ")}`);
    }
  }
  
  // Required: items array
  if (!g.items) {
    errors.push(`${prefix}: Missing required "items" array`);
  } else if (!Array.isArray(g.items)) {
    errors.push(`${prefix}: "items" must be an array`);
  } else {
    const validIds = getValidToolbarItemIds();
    g.items.forEach((item, i) => {
      if (typeof item !== 'string') {
        errors.push(`${prefix}: Item ${i + 1} in group must be a string`);
      } else if (item !== '|' && !validIds.includes(item)) {
        errors.push(`${prefix}: Unknown item "${item}" in group. Valid items: ${validIds.join(", ")}`);
      }
    });
  }
  
  // Optional: withText (must be boolean)
  if (g.withText !== undefined && typeof g.withText !== 'boolean') {
    errors.push(`${prefix}: "withText" must be a boolean`);
  }
  
  return errors;
}

// Valid HTML elements for custom styles
export const VALID_STYLE_ELEMENTS = [
  "p", "span", "div", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code"
] as const;

// Validate a style definition object
function validateStyleDefinition(style: unknown, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Style ${index + 1}`;
  
  if (typeof style !== 'object' || style === null) {
    errors.push(`${prefix}: Must be an object`);
    return errors;
  }
  
  const s = style as Record<string, unknown>;
  
  // Required: name
  if (!s.name || typeof s.name !== 'string') {
    errors.push(`${prefix}: Missing required "name" (string)`);
  } else if (s.name.trim().length === 0) {
    errors.push(`${prefix}: "name" cannot be empty`);
  }
  
  // Required: element
  if (!s.element || typeof s.element !== 'string') {
    errors.push(`${prefix}: Missing required "element" (string)`);
  } else if (!VALID_STYLE_ELEMENTS.includes(s.element as typeof VALID_STYLE_ELEMENTS[number])) {
    errors.push(`${prefix}: Invalid element "${s.element}". Valid elements: ${VALID_STYLE_ELEMENTS.join(", ")}`);
  }
  
  // Required: classes array
  if (!s.classes) {
    errors.push(`${prefix}: Missing required "classes" array`);
  } else if (!Array.isArray(s.classes)) {
    errors.push(`${prefix}: "classes" must be an array`);
  } else {
    if (s.classes.length === 0) {
      errors.push(`${prefix}: "classes" array cannot be empty`);
    }
    s.classes.forEach((cls, i) => {
      if (typeof cls !== 'string') {
        errors.push(`${prefix}: Class ${i + 1} must be a string`);
      } else if (cls.trim().length === 0) {
        errors.push(`${prefix}: Class ${i + 1} cannot be empty`);
      }
    });
  }
  
  return errors;
}

// Validate editor profile JSON configuration
export function validateProfileConfig(jsonString: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if it's valid JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return {
      valid: false,
      errors: [`Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`],
      warnings: [],
    };
  }
  
  // Check root structure
  if (typeof parsed !== 'object' || parsed === null) {
    return {
      valid: false,
      errors: ['Configuration must be an object'],
      warnings: [],
    };
  }
  
  const config = parsed as Record<string, unknown>;
  
  // Check for toolbar property
  if (!config.toolbar) {
    errors.push('Missing required "toolbar" property');
    return { valid: false, errors, warnings };
  }
  
  if (typeof config.toolbar !== 'object' || config.toolbar === null) {
    errors.push('"toolbar" must be an object');
    return { valid: false, errors, warnings };
  }
  
  const toolbar = config.toolbar as Record<string, unknown>;
  
  // Check for items array
  if (!toolbar.items) {
    errors.push('Missing required "toolbar.items" array');
    return { valid: false, errors, warnings };
  }
  
  if (!Array.isArray(toolbar.items)) {
    errors.push('"toolbar.items" must be an array');
    return { valid: false, errors, warnings };
  }
  
  // Validate each item
  const validIds = getValidToolbarItemIds();
  
  toolbar.items.forEach((item: unknown, index: number) => {
    if (typeof item === 'string') {
      // String item - must be a valid toolbar item ID or separator
      if (item === '|') {
        // Valid separator
      } else if (!validIds.includes(item)) {
        errors.push(`Item ${index + 1}: Unknown toolbar item "${item}". Valid items: ${validIds.join(", ")}`);
      }
    } else if (typeof item === 'object' && item !== null) {
      // Object item - must be a valid group
      const groupErrors = validateToolbarGroup(item, index);
      errors.push(...groupErrors);
    } else {
      errors.push(`Item ${index + 1}: Must be a string (item ID) or object (group)`);
    }
  });
  
  // Warnings for potential issues
  if (toolbar.items.length === 0) {
    warnings.push('Toolbar has no items configured');
  }
  
  // Check for duplicate items (warning, not error)
  const seenItems = new Set<string>();
  toolbar.items.forEach((item: unknown) => {
    if (typeof item === 'string' && item !== '|') {
      if (seenItems.has(item)) {
        warnings.push(`Duplicate item "${item}" found`);
      }
      seenItems.add(item);
    }
  });
  
  // Check for style definitions if present
  if (config.style !== undefined) {
    if (!Array.isArray(config.style)) {
      errors.push('"style" must be an array of style definitions');
    } else {
      const styleArray = config.style as unknown[];
      styleArray.forEach((styleDef, index) => {
        const styleErrors = validateStyleDefinition(styleDef, index);
        errors.push(...styleErrors);
      });

      // Warning if style toolbar item is not present
      const hasStyleItem = Array.isArray(toolbar.items) && toolbar.items.some(
        (item: unknown) => item === 'style'
      );
      if (styleArray.length > 0 && !hasStyleItem) {
        warnings.push('Custom styles defined but "style" item not in toolbar. Add "style" to toolbar.items to enable the Styles dropdown.');
      }
    }
  }

  // Validate disableContentWrap if present
  if (config.disableContentWrap !== undefined) {
    if (typeof config.disableContentWrap !== 'boolean') {
      errors.push('"disableContentWrap" must be a boolean value');
    } else if (config.disableContentWrap === true) {
      warnings.push('Content wrapper is disabled. Ensure your site provides equivalent CSS styling for RTE content.');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Example profiles for templates
export const EXAMPLE_PROFILES = {
  minimal: {
    name: "Minimal",
    value: JSON.stringify({
      toolbar: {
        items: ["bold", "italic", "link"],
      },
    }),
  },
  marketing: {
    name: "Marketing",
    value: JSON.stringify({
      toolbar: {
        items: [
          "bold",
          "italic",
          "underline",
          "|",
          "heading",
          "|",
          "bulletedList",
          "numberedList",
          "|",
          "link",
          "internalLink",
          "|",
          "sitecoreSelectMedia",
        ],
      },
    }),
  },
  full: {
    name: "Full Editor",
    value: JSON.stringify({
      toolbar: {
        items: [
          "bold",
          "italic",
          "emphasis",
          "underline",
          "blockQuote",
          {
            group: "formatting",
            label: "Formatting",
            icon: "text",
            items: ["strikethrough", "subscript", "superscript", "|", "removeFormat"],
          },
          "fontColor",
          "fontBackgroundColor",
          "|",
          "heading",
          "|",
          "alignment",
          "bulletedList",
          "numberedList",
          "|",
          "outdent",
          "indent",
          "|",
          "link",
          "internalLink",
          "phoneLink",
          "|",
          {
            group: "insert",
            label: "Insert",
            withText: false,
            icon: "plus",
            items: ["sitecoreSelectMedia", "insertTable", "horizontalLine"],
          },
          "|",
          "sourceEditing",
          "|",
          "sitecoreResetFieldValue",
        ],
      },
    }),
  },
};

import type { EditorProfileConfig } from "@/types";

export interface ProfileTemplate {
  id: string;
  name: string;
  description: string;
  config: EditorProfileConfig;
}

export const PROFILE_TEMPLATES: ProfileTemplate[] = [
  {
    id: "blank",
    name: "Blank",
    description: "Start from scratch with an empty toolbar",
    config: {
      toolbar: { items: [] },
    },
  },
  {
    id: "standard",
    name: "Standard",
    description:
      "This is a replica of the standard RTE profile, it has a full-featured toolbar with formatting, lists, links, and media insertion",
    config: {
      toolbar: {
        items: [
          "|",
          "bold",
          "italic",
          "emphasis",
          "underline",
          "blockQuote",
          "|",
          {
            group: "formatting",
            label: "Formatting",
            icon: "text",
            items: [
              "strikethrough",
              "subscript",
              "superscript",
              "removeFormat",
            ],
            withText: false,
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
          "indent",
          "outdent",
          "link",
          "internalLink",
          "phoneLink",
          "|",
          {
            group: "insert",
            label: "Insert",
            icon: "plus",
            items: ["sitecoreSelectMedia", "insertTable", "horizontalLine"],
            withText: false,
          },
          "|",
          "sourceEditing",
          "|",
          "sitecoreResetFieldValue",
        ],
      },
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Basic formatting only - bold, italic, and links",
    config: {
      toolbar: {
        items: ["bold", "italic", "underline", "|", "link"],
      },
    },
  },
];

export function getTemplateById(id: string): ProfileTemplate | undefined {
  return PROFILE_TEMPLATES.find((t) => t.id === id);
}

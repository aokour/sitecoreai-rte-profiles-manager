# SitecoreAI RTE Profiles Manager

A Sitecore Marketplace App for managing Rich Text Editor (RTE) toolbar configurations across your Sitecore XM Cloud sites.

## Overview

The RTE Profiles Manager allows content administrators to:

- **View and manage Editor Profiles** - See all configured RTE toolbar profiles with visual previews
- **Create new profiles** - Build custom toolbar configurations using a visual drag-and-drop builder or JSON editor
- **Edit existing profiles** - Modify toolbar items, groups, and custom styles
- **Assign profiles to sites** - Control which RTE toolbar configuration each site uses

## Features

### Profiles Management

- Visual toolbar builder with drag-and-drop interface
- JSON editor with validation for advanced configuration
- Custom styles support for the Styles dropdown
- Live toolbar preview showing exactly how the RTE will appear
- Protection against deleting profiles that are assigned to sites
- Enable or Disable Content wrapper (ck-editor div )

### Sites RTE Profile Management

- View all sites and their assigned editor profiles
- Assign or change profiles for individual sites
- Search and filter sites

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: Sitecore Blok Design System (shadcn/ui + Tailwind CSS)
- **Drag & Drop**: dnd-kit
- **API**: Sitecore Marketplace SDK (`@sitecore-marketplace-sdk/client`)

## Getting Started

### Prerequisites

- Node.js 18+
- Access to Sitecore XM Cloud environment
- Sitecore Marketplace SDK credentials

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Build

```bash
npm run build
```

## Project Structure

```
app/
├── page.tsx              # Profiles listing (home page)
├── profiles/
│   ├── [id]/
│   │   ├── page.tsx      # Profile detail view
│   │   └── edit/
│   │       └── page.tsx  # Edit profile
│   └── new/
│       └── page.tsx      # Create new profile
└── sites/
    └── page.tsx          # Sites management

components/
├── toolbar-builder/      # Visual toolbar builder components
├── profiles/             # Profile-related components
└── layout/               # App shell and navigation

hooks/
├── useProfiles.ts        # Profile CRUD operations
└── useSites.ts           # Site operations
```

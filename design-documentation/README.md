---
title: AI News Desk Design Overview
description: Project-wide design and UX overview for the Vercel-native migration.
feature: foundation
last-updated: 2026-04-05
version: 0.1.0
related-files:
  - ./design-system/style-guide.md
  - ./features/dashboard/README.md
  - ./accessibility/guidelines.md
dependencies:
  - ./design-system/tokens/colors.md
status: approved
---

# AI News Desk Design Overview

## Overview
The web app is designed as an editorial operations surface rather than a generic dashboard. It needs to feel trustworthy, dense, and calm while still exposing fast actions for pipeline control.

## Navigation
- [Style Guide](./design-system/style-guide.md)
- [Color Tokens](./design-system/tokens/colors.md)
- [Typography Tokens](./design-system/tokens/typography.md)
- [Accessibility Guidelines](./accessibility/guidelines.md)
- [Dashboard Feature](./features/dashboard/README.md)
- [Pipeline Studio Feature](./features/pipeline-studio/README.md)
- [Profile Settings Feature](./features/profile-settings/README.md)

## Implementation Notes
- Tokens map directly to CSS variables in [app/globals.css](/C:/Users/wisdo/OneDrive/Desktop/codex_projects/RAG-news-generator/app/globals.css).
- The current implementation prioritizes web and progressive enhancement.

## Last Updated
- 2026-04-05: Initial design overview created.

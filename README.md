# obss-documentation


## Page authors and dates

Add authors to a page's frontmatter to show a byline beneath its title:

```yaml
---
title: Page title
authors:
  - Author name
  - Another author
---
```

Omit `authors` to leave the byline hidden. Credit the people who wrote or substantially contributed to the page.

Starlight shows the last updated date in the footer using the page's Git history. Your build checkout needs that history (for GitHub Actions, use `fetch-depth: 0` with `actions/checkout`). Pages without available Git history have no automatic date.

To override the date, add `lastUpdated: 2026-10-23` to the page's frontmatter. Use `lastUpdated: false` to hide it on a particular page. The date records an edit, not a technical review.

# 11PARA11 Design Preferences

This document defines the visual direction for the rebuilt product.

## Brand Direction

- Editorial quality inspired by New York Times, The Athletic, and The Ringer.
- Tone: premium, focused, football-first, high-contrast readability.
- Mobile is the primary target.
- Experience should feel app-like (native feel) on phone and tablet.
- Responsive breakpoint rule:
  - mobile behavior/styles: `< 720px`
  - desktop behavior/styles: `>= 720px`
  - all mobile adjustments must preserve existing desktop layout/visuals.

## Color System (Required)

Use this palette distribution across screens:

- 35% `Blue` #1F2937
- 25% `Green` #16A34A
- 15% `Lighter Green` #22C55E
- 15% `White` #ECFDF5
- 10% `Orange` #FE7733

### Usage Rules

- `Blue`: deep surfaces, overlays, and high-contrast components.
- `Green`: cards, secondary surfaces, raised containers.
- `White`: main page background and text on dark surfaces.
- `Lighter Green`: primary highlight state, active chips, key accents.
- `Orange`: action emphasis, active nav markers, important metadata.

## Typography

- Headlines/highlights: `Oswald`.
- Body/UI text: `Barlow` (prefer lighter weights for long reading).
- Keep line length comfortable on mobile.
- Strong hierarchy: kicker -> headline -> deck -> body.

## Layout and Components

- Mobile-first composition with sticky top context and bottom nav.
- Rounded cards with clear separation and readable spacing.
- Section pills/chips for quick filtering.
- Pills row styling:
  - row background: `Green` `#16A34A`
  - pill background: `Lighter Green` `#22C55E`
  - pill text: `Blue` `#1F2937`
  - pill font size: `15px`
  - pill hover text: `White` `#ECFDF5`
  - selected pill background: `White` `#ECFDF5`
- Fast scan feed: section + date + title + short deck.
- Article card styling:
  - card uses article cover image as full background
  - remove solid color content block under cover
  - card info is anchored bottom-left over the image
  - author appears in a pill: `Orange` `#FE7733` background with `White` `#ECFDF5` text
  - article title uses larger, bolder typography
- Homepage featured area:
  - use a carousel with the latest 3 articles
  - include selection pills below the sliding article
  - auto-rotate every `5s`
  - selector pills container uses transparent background
  - selector pills use `Green` `#16A34A` when active and `Lighter Green` `#22C55E` when inactive
  - active selector pill is long, inactive pills are short
  - active selector pill fills left-to-right as a progress bar during each `5s` interval
  - carousel has no outer border and no green strip behind selector pills
  - carousel content includes author pill, title, and subtitle
- Home feed spacing:
  - do not render the `Últimos Artigos` heading
  - keep clean vertical spacing between carousel and the remaining cards
- Home feed layout:
  - extra-large spacing from category pills row to slider
  - double spacing from slider (including dots) to article grid
  - double both vertical and horizontal spacing between article cards
  - first block: `2` rows x `2` columns
  - first block uses wider equal gaps for both axes
  - first block cards are square (`1:1`) and cover images are cropped accordingly
  - second block: `3` rows x `3` columns
- Category spotlight block (between `2x2` and `3x3`):
  - container card background: `Blue` `#1F2937`
  - header row with title `category` and left/right arrow controls
  - shows `3` articles from the selected category
  - article covers use `3:4` display ratio
  - categories are ordered by article volume (highest first)
- Feed card metadata:
  - remove top meta line (author/date style line)
- Home pagination:
  - show a `Load more` button at the bottom of the home feed
  - button style: `Lighter Green` `#22C55E` background with `White` `#ECFDF5` text
- Footer styling:
  - footer background: `Lighter Green` `#22C55E`
  - footer text: `Blue` `#1F2937`
  - footer left area: `sobre` and `arquivo` stacked, with social icons below in `White` `#ECFDF5`
  - footer right area: `11para11`
- Header social:
  - top-right social icons (Facebook, Twitter, RSS) in `Orange` `#FE7733`
  - icon style: orange circular background with white glyphs
- Footer social:
  - icon style: white circular background with blue glyphs
- Article page styling:
  - article page base block uses `Blue` `#1F2937` background and expands full-bleed to viewport sides
  - hero/photo card uses `Lighter Green` `#22C55E` background
  - hero title stays `Blue` `#1F2937`
  - hero metadata shows author + date in `White` `#ECFDF5`
  - article text card uses `White` `#ECFDF5` background with `Blue` `#1F2937` text
  - bottom author card uses `Green` `#16A34A` background
  - `Autor` label is `White` `#ECFDF5`
  - author name is `Blue` `#1F2937`
  - show latest 4 articles as square cover-image tiles inside the author card, all in one row
  - each author-card tile overlays article title in `White` `#ECFDF5`, aligned bottom-left

## Motion

- Subtle and purposeful only.
- Prefer small transitions for hover/focus/state changes.
- Avoid decorative animation loops.

## Content and UX Priorities

- Readability first.
- Clear section taxonomy.
- Fast route to latest stories.
- Each article should expose and reuse a cover image:
  - feed/home cards: cover thumbnail
  - article page: top hero cover
- Consistent article URLs in format:
  - `/subsection/yyyy-mm-dd-title.html`

## Non-Negotiables

- Do not use light generic theme defaults.
- Do not regress mobile UX quality.
- Do not use visible borders in cards, pills, or UI blocks; rely on spacing, color, and shadow for separation.

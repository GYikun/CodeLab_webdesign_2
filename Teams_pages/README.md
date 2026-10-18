# CODELAB Website — `Pages_for_teams`

Static website for the **CODELAB** research group at Leiden University.  
Deployed on **GitHub Pages**. Content is managed through **Pages CMS** (`pagescms.org`) via `.pages.yml`, or by editing the JSON files in `data/` directly.

---

## Architecture in one sentence

Every page is a **static HTML shell** that loads JSON from `data/` at runtime and renders it with vanilla JavaScript. No build step. No framework.

```
data/*.json   ←  the content layer (edit to update the site)
js/*.js       ←  rendering logic (reads data/, writes DOM)
css/styles.css ← all styles, single file
*.html        ←  page shells (structure + inline UI strings)
.pages.yml    ←  Pages CMS schema (which fields exist in each JSON)
```

---

## Pages

| File | URL slug | What it shows |
|---|---|---|
| `index.html` | `/` | Hero section + milestone timeline |
| `discoveries.html` | `/discoveries` | Papers/publications + media coverage (In the news) + video |
| `research.html` | `/research` | Research questions (FAQ style) |
| `partners.html` | `/partners` | Research partners, funders, spin-offs |
| `team.html` | `/team` | Team member cards + personal timelines |
| `resources.html` | `/resources` | Patents, datasets, code repositories |

---

## Data files (`data/`)

These are the files you edit to change site content. All are plain JSON. Every text field that appears on the site is bilingual — English is required, Dutch (`nl`) is optional (falls back to English if empty).

### Bilingual text pattern (used everywhere)
```json
{ "en": "English text", "nl": "Nederlandse tekst" }
```

---

### `data/home.json`
Controls the **hero section** text on the homepage.

Fields: `prelude`, `title`, `highlight`, `intro` — all bilingual strings.  
The HTML in `index.html` contains fallback text; values in this file override it at runtime.

---

### `data/milestones.json`
The **"How one idea led to the next"** timeline on the homepage. A list of milestone objects.

| Field | Type | Notes |
|---|---|---|
| `time` | string | `MM/YYYY` or `YYYY`. Empty = no date shown. |
| `status` | `normal` / `today` / `future` | Controls position and dot style. Only one `today` and one `future` at a time. |
| `text` | bilingual string | ~40 characters. Short. |

Items are sorted by `time` ascending, then `today`, then `future` — so the timeline always reads past → present → future regardless of order in the file.

---

### `data/team.json`
The largest file. A list of **team member** objects, rendered on `team.html`.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Lowercase, hyphens only (e.g. `arko-ghosh`). **Never change once published** — other data may reference it. |
| `name` | string | Full display name. |
| `role` | bilingual string | Include `MSc` in the English role for master's students (affects sort order — MSc students appear after staff). |
| `status` | `current` / `alumni` | Alumni are shown in a separate section. |
| `joined` | string | `MM/YYYY` or `YYYY`. Optional. |
| `photo` | image path | Relative path under `assets/mem/`. Leave empty for placeholder. |
| `topic` | select | Must match one of the IDs in `data/questions.json`. Controls the coloured topic button. |
| `scholar` | URL | Google Scholar profile. Also used on the Resources page to pull publications. |
| `orcid` | URL | ORCID profile URL. Also used on the Resources page. |
| `sample` | boolean | **`true` = this member's timeline is still example/placeholder content.** Tick it off once real content is filled in. A small indicator may appear in the CMS. |
| `timeline` | list of objects | Personal career/event timeline shown on the member's expanded card. Ordered oldest → newest. |

**Timeline item fields:**

| Field | Type | Notes |
|---|---|---|
| `time` | string | `MM/YYYY` or `YYYY`. |
| `text` | bilingual string | 2–5 words. Shown on the node. |
| `detailTitle` | bilingual string (optional) | If filled, the node becomes clickable. |
| `detail` | bilingual text (optional) | Longer text shown when node is clicked. Fill together with `detailTitle`. |

---

### `data/questions.json`
The **research questions** shown on `research.html`. Also drives the topic buttons on team member cards.

| Field | Notes |
|---|---|
| `id` | Lowercase, hyphens. **Never change once in use** — `data/team.json` references these IDs in the `topic` field. If you add or remove a question, also update the `topic` select options in `.pages.yml`. |
| `short` | bilingual — 2–3 words, shown on team card topic buttons. |
| `question` | bilingual — the full research question. |
| `answer` | bilingual text — the answer/explanation paragraph. |

---

### `data/discoveries.json`
List of **publications / papers**, shown on `discoveries.html`. Sorted newest first by `year`.

| Field | Notes |
|---|---|
| `title` | bilingual string |
| `summary` | bilingual text — short abstract for the site |
| `image` | optional — path under `assets/pub/`. GIFs accepted; keep under ~2 MB. |
| `authors` | plain string — e.g. `Ceolini, Ridderinkhof & Ghosh` |
| `journal` | plain string |
| `year` | number — used for sort order |
| `url` | full `https://` link to the paper (preferably DOI) |

---

### `data/discoveries-page.json`
Page-level metadata for `discoveries.html` (e.g. section headings, intro text). Bilingual. Not the paper list itself — that's `discoveries.json`.

---

### `data/video.json`
Controls the **video** shown on `discoveries.html`.

| Field | Notes |
|---|---|
| `src` | path under `assets/video/`. MP4 (H.264) recommended. Max ~50 MB (GitHub rejects >100 MB). Leave empty to hide. |
| `poster` | optional cover image shown before play (or as placeholder if no video). Path under `assets/pub/`. |

---

### `data/news.json`
List of **media coverage**, shown in the "In the news" block on `discoveries.html` (between the papers and the video, collapsed behind a "Show coverage" button). Shown in file order, so keep the newest first. The block is hidden while the list is empty.

| Field | Notes |
|---|---|
| `outlet` | plain string — e.g. `The Guardian` |
| `title` | plain string — the headline, in its original language |
| `year` | number |
| `url` | required, full `https://` link |

---

### `data/partners.json`
List of **partners**, shown on `partners.html`. Grouped by type.

| Field | Notes |
|---|---|
| `name` | bilingual string |
| `group` | `research` / `support` / `spinoff` |
| `location` | bilingual string (optional for spin-offs) |
| `founded` | number — spin-offs only, shown instead of location while location is empty |
| `url` | required, full `https://` link |
| `contact` | optional object with `name` (string) and `url` (profile link) |

---

### `data/partners-page.json`
Page-level metadata for `partners.html` (headings, intro). Bilingual.

---

### `data/resources.json`
List of **patents, datasets, and code repositories**, shown on `resources.html`.  
Note: *publications are not listed here* — they are pulled automatically from team members' Google Scholar / ORCID links.

| Field | Notes |
|---|---|
| `type` | `patent` / `data` / `code` |
| `name` | bilingual string |
| `summary` | bilingual text |
| `url` | required, full `https://` link |

---

### `data/milestones.json` *(already listed above under Home)*

### `data/questions-page.json`
Page-level metadata for `research.html`. Bilingual headings/intro.

---

## JavaScript files (`js/`)

| File | Purpose |
|---|---|
| `js/main.js` | Core site utilities: i18n language switching, nav toggle, scroll/reveal animations, `initSite()` entry point used by every page. |
| `js/data.js` | `CodeLabData` module — fetches and caches JSON from `data/`, provides helpers like `sortByTime()`, `addText()`, `esc()`, `showError()`. Every page calls `CodeLabData.load([...])`. |
| `js/team.js` | Renders the team page: member cards, personal timelines, filtering by topic/status. |
| `js/discovery-art.js` | Renders the discoveries page: paper cards, video player, filtering. |
| `js/behaviour-map.js` | Renders the behaviour-map feature (interactive data visualisation). |
| `js/audit2.js` | **Development-only.** A Sprint 2 geometry-verification script that logs layout calculations to the console (pitch reduction, horizontal/vertical breakpoints for the team timeline). Not loaded by any HTML page. Safe to ignore or delete. |

---

## Stylesheet

`css/styles.css` — single file, all pages. No preprocessor. CSS custom properties (`--var`) used throughout for theming.

---

## Assets (`assets/`)

| Folder | Contents | Used by |
|---|---|---|
| `assets/img/` | Site illustrations (e.g. hero scene) | Hard-coded in HTML |
| `assets/mem/` | Team member photos | `data/team.json` → `photo` field |
| `assets/pub/` | Publication images and paper GIFs | `data/discoveries.json` → `image`, `data/video.json` → `poster` |
| `assets/video/` | MP4 video files | `data/video.json` → `src` |

File naming: lowercase, hyphens, no spaces. Reference paths in JSON are relative to the repo root (e.g. `assets/mem/arko-ghosh.jpg`).

---

## CMS config (`.pages.yml`)

Defines the field schema for Pages CMS (`pagescms.org`). Editors can update content through the CMS UI without touching JSON directly. The file also documents validation rules (regex patterns, required fields, min/max values). **Do not rename or move `data/*.json` files** — the paths are hardcoded in `.pages.yml`.

The shared bilingual component is defined once in `.pages.yml` as `i18n-string` / `i18n-text` and reused across all files.

---

## Language system (i18n)

The site is bilingual English / Dutch. Two mechanisms work together:

1. **Data-driven text** (content from JSON files): all text fields in `data/*.json` use `{ "en": "...", "nl": "..." }`. JavaScript reads the active language and picks the right value.

2. **Inline UI strings** (nav labels, button text, fixed phrases): stored in a `pageText` object inside each HTML file's `<script>` block. Elements with `data-i18n="key"` are updated by `initSite()` in `main.js`.

Language is toggled by the EN / NL buttons in the header. English is always the fallback.

---

## Deployment

The site is hosted on **GitHub Pages** from the `main` branch. Pushing to `main` publishes immediately (no build step needed — the site is fully static).

Pages CMS commits directly to `main` when editors save changes through the CMS UI.

---

## How to update content (quick reference)

| What to change | File to edit |
|---|---|
| Homepage hero text | `data/home.json` |
| Homepage timeline | `data/milestones.json` |
| Research questions | `data/questions.json` (+ sync `topic` options in `.pages.yml` if adding/removing) |
| Papers / publications | `data/discoveries.json` |
| Video on discoveries page | `data/video.json` |
| Media coverage (In the news) | `data/news.json` |
| Partners | `data/partners.json` |
| Patents / datasets / code | `data/resources.json` |
| Team members | `data/team.json` |
| Member photo | Add image to `assets/mem/`, set path in `data/team.json` → `photo` |
| Publication image | Add image to `assets/pub/`, set path in `data/discoveries.json` → `image` |
| Nav labels, button text, fixed UI phrases | `pageText` object inside the relevant `*.html` file's `<script>` block |
| Page layout / styling | `css/styles.css` |

---

## Notes for AI assistance

When an AI is asked to update this site, the key facts are:

- **Content lives in `data/*.json`**, not in the HTML. Edit JSON, not HTML, for content changes.
- **All user-facing text is bilingual.** Every string field must include at least `"en"`. Add `"nl"` wherever possible.
- **IDs must not change once published.** `id` in `data/team.json` and `data/questions.json` are stable keys referenced by other parts of the system.
- **The `topic` field** in `data/team.json` must be one of the `id` values in `data/questions.json`. If a question is added or removed, both files need updating, plus the `topic` select options in `.pages.yml`.
- **The `sample` flag** on a team member (`"sample": true`) means their timeline is placeholder content. Flip to `false` when real content is in place.
- **No build step.** Files are served as-is from GitHub Pages. Changes to JSON or HTML take effect on the next page load after a push to `main`.
- **`js/audit2.js` is not production code.** Do not load it from HTML or reference it in new features.
- **Asset paths in JSON** are relative to the repo root (e.g. `assets/mem/photo.jpg`).

# CODELAB Website

Static website for the **CODELAB** research group at Leiden University.  
Deployed on **GitHub Pages**. Content is managed through **Pages CMS** ([app.pagescms.org](https://app.pagescms.org)) via `.pages.yml`, or by editing the JSON files in `data/` directly.

---

## Architecture in one sentence

Every page is a **static HTML shell** that loads JSON from `data/` at runtime and renders it with vanilla JavaScript. No build step. No framework.

```
data/*.json    ←  the content layer (edit to update the site)
js/*.js        ←  rendering logic (reads data/, writes DOM)
css/styles.css ←  all styles, single file
*.html         ←  page shells (structure + inline UI strings + page scripts)
.pages.yml     ←  Pages CMS schema (which fields exist in each JSON)
```

---

## Previewing locally

Pages load their content with `fetch()`, which browsers block on `file://` pages. **Double-clicking an HTML file shows an empty page.** Serve the folder with a local web server instead, for example:

- VS Code: the **Live Server** extension → "Open with Live Server", or
- a terminal in the project folder: `python -m http.server 8000`, then open <http://localhost:8000>.

---

## Pages

| File | URL slug | What it shows |
|---|---|---|
| `index.html` | `/` | Hero section + milestone timeline |
| `discoveries.html` | `/discoveries` | Papers/publications + media coverage (In the news) + video |
| `research.html` | `/research` | Research questions + "map of behaviour" animation |
| `partners.html` | `/partners` | Research partners, funders, spin-offs |
| `team.html` | `/team` | Team member cards + personal timelines |
| `resources.html` | `/resources` | Publications (via profiles), patents, datasets, code repositories |

---

## Data files (`data/`)

These are the files you edit to change site content. All are plain JSON, and every one of them can also be edited in Pages CMS. Text that appears on the site is bilingual — English is required, Dutch (`nl`) is optional (falls back to English if empty).

### Bilingual text pattern (used everywhere)
```json
{ "en": "English text", "nl": "Nederlandse tekst" }
```

---

### `data/home.json`
Controls the **hero section** text on the homepage.

Fields: `prelude` (paragraph above the title), `title` (first part of the title), `highlight` (blue italic part of the title), `intro` (paragraph under the title) — all bilingual.  
The HTML in `index.html` contains fallback text; values in this file override it at runtime.

---

### `data/milestones.json`
The **"How one idea led to the next"** timeline on the homepage. A list of milestone objects.

| Field | Type | Notes |
|---|---|---|
| `time` | string | `MM/YYYY` or `YYYY`. Used only to put the milestones in order; it is **not displayed**. |
| `status` | `normal` / `today` / `future` | Controls position and dot style. Only one `today` and one `future` at a time. |
| `text` | bilingual string | ~40 characters. Short. |
| `url` | URL (optional) | Turns the milestone text into a link, e.g. the paper's DOI. |

Items are sorted by `time` ascending, then `today`, then `future` — so the timeline always reads past → present → future regardless of order in the file.

---

### `data/team.json`
The largest file. A list of **team member** objects, rendered on `team.html`. See also [Adding or updating team members](#adding-or-updating-team-members) below.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Lowercase, hyphens only (e.g. `arko-ghosh`). **Never change once published** — other data may reference it. |
| `name` | string | Full display name. |
| `role` | bilingual string | Not shown on current members' cards (only alumni cards show a role line — see `tag`). An English role containing `MSc` puts the person in the **students list** below the staff. |
| `tag` | list | Drives the **filter buttons** on the Team page and the role line on alumni cards. Allowed values: `Principal Investigator`, `Researcher`, `Visiting Researcher`, `MSc Student`, `Pre-University`, `Alumni`. Current members: one value, e.g. `["Researcher"]`. Alumni: `Alumni` plus their former role, e.g. `["Alumni", "MSc Student"]`. A person without a tag only appears under "All". |
| `status` | `current` / `alumni` | Alumni are shown in a separate, collapsed section at the bottom. |
| `joined` | string | `MM/YYYY` or `YYYY`. Optional. Stored for reference — **not displayed** on the site. |
| `photo` | image path | `assets/mem/<id>.jpg` (see [Assets](#assets-assets) for photo guidelines). Leave empty for the placeholder avatar. |
| `topic` | select | Must match one of the IDs in `data/questions.json`. Shown as a button on the card that links to that question on the Research page. |
| `scholar` | URL | Google Scholar profile. Also used on the Resources page to list publications. |
| `orcid` | URL | ORCID profile URL. Shows a green "iD" badge next to the name, and is also used on the Resources page. |
| `sample` | boolean | `true` = this member's timeline is still example/placeholder content. Set to `false` once real content is filled in. |
| `timeline` | list of objects | The member's timeline, always visible on their card. **Sorted automatically** by `time`, oldest → newest; points without a time go last. |

**Timeline item fields:**

| Field | Type | Notes |
|---|---|---|
| `time` | string | `MM/YYYY` or `YYYY`. A single date — ranges such as `2024–2026` are not allowed. |
| `text` | bilingual string | 2–5 words. The label shown next to the point. |
| `detailTitle` | bilingual string (optional) | Title of the panel that opens on click. If empty, `text` is used as the title. |
| `detail` | bilingual text (optional) | **If filled, the point becomes clickable** ("Read more") and opens a panel with this text. |

**Order on the page:** the page does not sort people. Within each group (staff, students, alumni) members appear in the order of this file. To change the order, move the entries in the file (or drag them in Pages CMS).

---

### `data/questions.json`
The **research questions** shown on `research.html`. Also drives the topic buttons on team member cards.

| Field | Notes |
|---|---|
| `id` | Lowercase, hyphens. **Never change once in use** — `data/team.json` references these IDs in the `topic` field. If you add or remove a question, also update the `topic` select options in `.pages.yml`. The ID is also the anchor the team cards link to (`research.html#<id>`). |
| `short` | bilingual — 2–3 words, shown on team card topic buttons. |
| `question` | bilingual — the full research question. |
| `answer` | bilingual text — the answer/explanation paragraph. |
| `art` | optional — artwork style drawn on the card (see [Artwork styles](#artwork-styles-art)). |

---

### `data/questions-page.json`
Page-level text for `research.html`: `title` + `highlight` (the page title), `intro` (optional paragraph, hidden while empty), and the text around the animation: `frameworkTitle`, `frameworkText`, `flowCaption`, `mapCaption`. All bilingual.

---

### `data/discoveries.json`
List of **publications / papers**, shown on `discoveries.html`. Sorted newest first by `year`.

| Field | Notes |
|---|---|
| `title` | bilingual string |
| `summary` | bilingual text — short abstract for the site |
| `image` | optional — path under `assets/pub/`. Replaces the drawn artwork. GIFs accepted; keep under ~2 MB. |
| `art` | optional — artwork style drawn when there is no image (see [Artwork styles](#artwork-styles-art)). |
| `authors` | plain string — e.g. `Ceolini, Ridderinkhof & Ghosh`. Required in the CMS, but **not displayed** at the moment. |
| `journal` | plain string. Required in the CMS, but **not displayed** at the moment. |
| `year` | number — used for sort order |
| `url` | full `https://` link to the paper (preferably DOI). Makes the card clickable. |

#### Artwork styles (`art`)
Cards on the Discoveries and Research pages show an abstract drawing made by `js/discovery-art.js`. `art` picks the drawing style (e.g. `sleep`, `epilepsy`, `jid-lifespan`). Empty or `auto` = a style chosen automatically from the title, so every new entry still gets its own artwork. To add a new style, add a function to `MOTIFS` in `js/discovery-art.js` and add its name to both `art` option lists in `.pages.yml`.

---

### `data/discoveries-page.json`
Page-level text for `discoveries.html`: `title` + `highlight` (the page title) and `intro` (the paragraph below it). Bilingual. Not the paper list itself — that's `discoveries.json`.

---

### `data/video.json`
Controls the **video** shown on `discoveries.html`.

| Field | Notes |
|---|---|
| `src` | path under `assets/video/`. MP4 (H.264) recommended. Max ~50 MB (GitHub rejects >100 MB). Leave empty to hide. |
| `poster` | optional cover image shown before play (or as placeholder if no video). Path under `assets/pub/`. |

---

### `data/news.json`
List of **media coverage**, shown in the "In the news" block on `discoveries.html` (between the papers and the video). The block has a **"Featured in"** row of outlet names (the items with `featured: true`) and the full list collapsed behind a "Show coverage" button. Both are shown in file order, so keep the newest first. The block is hidden while the list is empty; the "Featured in" row is hidden while no item is featured.

| Field | Notes |
|---|---|
| `outlet` | plain string — e.g. `The Guardian` |
| `title` | plain string — the headline, in its original language |
| `year` | number |
| `url` | required, full `https://` link |
| `featured` | optional boolean — `true` also shows the outlet name in the "Featured in" row, linking to this article. Keep it to a handful of well-known outlets. |

---

### `data/partners.json`
List of **partners**, shown on `partners.html` in three groups.

| Field | Notes |
|---|---|
| `name` | bilingual string |
| `short` | optional plain string — short label in the network diagram (e.g. `Yale`). Empty = full English name. |
| `group` | `research` (Research partners) / `funder` (Funded by) / `spinoff` (Spin-offs) |
| `themes` | research partners only — list of theme IDs from `data/partners-page.json`, e.g. `["epilepsy", "sleep"]`. Drives the theme filter and the network diagram. |
| `focus` | research partners only — optional bilingual one-liner under the name, e.g. "Invasive EEG recordings". |
| `location` | bilingual string (optional for spin-offs) |
| `founded` | number — spin-offs only, shown instead of location while location is empty |
| `url` | required, full `https://` link |
| `contact` | optional object with `name` (string) and `url` (profile link). Stored only — **not displayed** on the site at the moment. |

---

### `data/partners-page.json`
Page-level content for `partners.html`: `title` + `highlight` (the page title), and `themes` — the list of research themes, each with an `id` (lowercase, hyphens) and a bilingual `label`. Theme IDs are referenced by `themes` in `data/partners.json`; when adding or removing a theme, also update the `themes` select options under Partners in `.pages.yml`.

---

### `data/resources.json`
List of **patents, datasets, and code repositories**, shown on `resources.html`.  
Note: *publications are not listed here* — the Publications section is built automatically from team members' Google Scholar / ORCID links.

| Field | Notes |
|---|---|
| `type` | `patent` / `data` / `code` |
| `name` | bilingual string |
| `summary` | bilingual text |
| `url` | required, full `https://` link |

---

## Adding or updating team members

There are three ways to add people to the Team page or update their information. Whichever you use, the result is the same: an updated `data/team.json` (plus photos in `assets/mem/`) on GitHub.

### 1. Edit the files directly

Best for small changes by someone comfortable with JSON and Git.

1. Open `data/team.json` and copy an existing member as a template. Fill in the fields described in [`data/team.json`](#datateamjson); make sure `id` is new and unique.
2. Add the photo to `assets/mem/` as `<id>.jpg` (or `.png`) and set `photo` to that path.
3. Preview locally (see [Previewing locally](#previewing-locally)), then commit and push to `main`. You can also edit and upload files directly on github.com.

### 2. Use Pages CMS

Best for editors who prefer a form over code. No local setup is needed.

1. Sign in at [app.pagescms.org](https://app.pagescms.org) with a GitHub account that has write access to the repository — or accept an email invitation from a maintainer (Pages CMS can invite editors by email; no GitHub account needed).
2. Open **Team**, add or edit a member, and upload the photo through the Photo field (it is stored in `assets/mem/`).
3. Save. Pages CMS commits the change straight to GitHub, and the live site updates after GitHub Pages republishes (usually within a minute or two).

Tip: after your first save, look at the commit on GitHub to confirm nothing unexpected changed.

### 3. Collect information with the Google Form (for many people at once)

When several people join (or alumni need to be added), ask them to fill in the **Lab Member / Alumni Timeline Information Form** instead of collecting details one by one. It asks for each person's name, status, role, start date, Google Scholar / ORCID links, a portrait photo, and up to several timeline experiences (title, short label, years, research direction and a short description).

Then add the responses with method 1 or 2. **Claude can do most of this work for you:**

1. In the form's response sheet, choose *File → Download → Microsoft Excel (.xlsx)*.
2. Download the uploaded photos from the form's Google Drive folder into `assets/mem/` (any file names are fine).
3. Give Claude the `.xlsx` file and access to the project folder, and ask it to update the Team page. It can turn every response into a `team.json` entry, crop and compress the photos to `assets/mem/<id>.jpg`, fix small spelling mistakes, write the Dutch text, and flag anything that needs a decision (e.g. a date that looks wrong, or a member missing from the form).
4. Review the result in a local preview, then commit and push (method 1) — or enter the details in Pages CMS (method 2).

How form answers map to `team.json` (used for the October 2026 update; keep it consistent):

| Form answer | `team.json` field |
|---|---|
| Full name | `name` (and `id` = name in lowercase with hyphens, accents removed) |
| Date joined the lab | `joined` as `MM/YYYY` |
| Status | `status`: `current` / `alumni` |
| Current or former role | `role` (EN + NL) and `tag` |
| Google Scholar / ORCID link | `scholar` / `orcid` |
| Profile photo | `photo` → `assets/mem/<id>.jpg` (square, face centred) |
| Each timeline experience | one `timeline` point: Short label → `text`, Project title → `detailTitle`, "What you worked on" → `detail`, start year → `time` |
| Research direction | `topic` — one per person: the direction they chose most often ("other" not counted); on a tie, the experience marked most important or the most recent one |
| LinkedIn, "Anything else", milestone / most-important answers | not shown on the site |

Role → tag: Principal Investigator → `Principal Investigator`; Postdoc, PhD candidate, Researcher, Research assistant → `Researcher`; Visiting researcher → `Visiting Researcher`; MSc student → `MSc Student`; Pre-University → `Pre-University`; alumni additionally get `Alumni`.

---

## JavaScript files (`js/`)

| File | Purpose |
|---|---|
| `js/main.js` | Core site behaviour: shared nav/footer strings, i18n language switching, mobile nav, scroll-reveal animations, `initSite()` entry point used by every page. |
| `js/data.js` | `CodeLabData` module — fetches JSON from `data/` (no caching) and provides helpers like `sortByTime()`, `addText()`, `esc()`, `showError()`. Every page calls `CodeLabData.load([...])`. |
| `js/team.js` | Renders the Team page: member cards, wavy personal timelines, alumni section, and the **role filter buttons** (driven by `tag`; the button list is `TAG_ORDER`). |
| `js/discovery-art.js` | Draws the abstract card artworks for the Discoveries and Research pages (`art` field). The cards themselves are built by the script inside each HTML page. |
| `js/behaviour-map.js` | The animated "map of behaviour" on the Research page. |
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

File naming: lowercase, hyphens, no spaces. Reference paths in JSON are relative to the repo root (e.g. `assets/mem/arko-ghosh.jpg`). Spaces, accents or `%` in file names can break image links.

**Member photos:** shown as a small circle (44 px), cropped from the centre. Use a square image of about 400 × 400 px with the face in the middle, JPG (or PNG if the background is transparent), ideally under 200 KB.

---

## CMS config (`.pages.yml`)

Defines the field schema for Pages CMS. Editors can update content through the CMS UI without touching JSON directly. The file also documents validation rules (regex patterns, required fields, min/max values). **Do not rename or move `data/*.json` files** — the paths are hardcoded in `.pages.yml`.

Every file in `data/` and every field the site uses is defined in `.pages.yml`. Bilingual fields reuse four shared components defined at the top: `i18n-string`, `i18n-string-optional`, `i18n-text`, `i18n-text-optional`.

Some select lists must be kept in sync with other files by hand:

| Select options in `.pages.yml` | Must match |
|---|---|
| Team → `topic` | `id`s in `data/questions.json` |
| Team → `tag` | `TAG_ORDER` in `js/team.js` |
| Partners → `themes` | theme `id`s in `data/partners-page.json` |
| Discoveries / Research questions → `art` | `MOTIFS` names in `js/discovery-art.js` |

When you add a new field to any JSON file, add it to `.pages.yml` too, so it can be edited in the CMS.

---

## Language system (i18n)

The site is bilingual English / Dutch. Two mechanisms work together:

1. **Data-driven text** (content from JSON files): all text fields in `data/*.json` use `{ "en": "...", "nl": "..." }`. JavaScript reads the active language and picks the right value.

2. **Inline UI strings** (nav labels, button text, fixed phrases): stored in a `pageText` object inside each HTML file's `<script>` block (shared nav/footer strings live in `js/main.js`). Elements with `data-i18n="key"` are updated by `initSite()` in `main.js`.

Language is toggled by the EN / NL buttons in the header. English is always the fallback.

---

## Deployment

The site is hosted on **GitHub Pages** from the `main` branch. Pushing to `main` publishes it (no build step needed — the site is fully static); GitHub Pages usually takes a minute or two to update.

Pages CMS commits directly to `main` when editors save changes through the CMS UI.

---

## How to update content (quick reference)

| What to change | File to edit |
|---|---|
| Homepage hero text | `data/home.json` |
| Homepage timeline | `data/milestones.json` |
| Research questions | `data/questions.json` (+ sync `topic` options in `.pages.yml` if adding/removing) |
| Research page title / intro / animation text | `data/questions-page.json` |
| Papers / publications | `data/discoveries.json` |
| Discoveries page title / intro | `data/discoveries-page.json` |
| Video on discoveries page | `data/video.json` |
| Media coverage (In the news) | `data/news.json` |
| Partners | `data/partners.json` |
| Partners page title / research themes | `data/partners-page.json` (+ sync `themes` options in `.pages.yml`) |
| Patents / datasets / code | `data/resources.json` |
| Team members | `data/team.json` — see [Adding or updating team members](#adding-or-updating-team-members) |
| Member photo | Add image to `assets/mem/`, set path in `data/team.json` → `photo` |
| Publication image | Add image to `assets/pub/`, set path in `data/discoveries.json` → `image` |
| Nav labels, button text, fixed UI phrases | `pageText` object inside the relevant `*.html` file's `<script>` block |
| Page layout / styling | `css/styles.css` |

---

## Notes for AI assistance

When an AI is asked to update this site, the key facts are:

- **Content lives in `data/*.json`**, not in the HTML. Edit JSON, not HTML, for content changes.
- **All user-facing text is bilingual.** Every string field must include at least `"en"`. Add `"nl"` wherever possible.
- **IDs must not change once published.** `id` in `data/team.json`, `data/questions.json` and the theme IDs in `data/partners-page.json` are stable keys referenced by other parts of the system.
- **The `topic` field** in `data/team.json` must be one of the `id` values in `data/questions.json`. If a question is added or removed, both files need updating, plus the `topic` select options in `.pages.yml`.
- **The `tag` field** in `data/team.json` is always a list, using only the names in `TAG_ORDER` (`js/team.js`). Alumni get `"Alumni"` plus their former role.
- **Team grouping and order:** `status: "alumni"` → alumni section; an English `role` containing `MSc` → students list; everyone else → staff. Within a group, file order is display order.
- **Timeline points** become clickable only when `detail` is filled. `time` is a single `MM/YYYY` or `YYYY`.
- **Keep `.pages.yml` complete.** Any new JSON field must also be defined there.
- **The `sample` flag** on a team member (`"sample": true`) means their timeline is placeholder content. Flip to `false` when real content is in place.
- **No build step.** Files are served as-is from GitHub Pages. Changes to JSON or HTML take effect on the next page load after a push to `main`.
- **`js/audit2.js` is not production code.** Do not load it from HTML or reference it in new features.
- **Asset paths in JSON** are relative to the repo root (e.g. `assets/mem/photo.jpg`).
- **Adding members from the Google Form export:** follow the mapping table in [Adding or updating team members](#adding-or-updating-team-members); ask the user before deciding anything the form leaves unclear.

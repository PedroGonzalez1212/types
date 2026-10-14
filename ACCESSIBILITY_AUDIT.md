# Types — WCAG 2.2 AA accessibility audit

**Status:** Phase 1 (audit only, no code changed) · 2026-10-09
**Standard:** WCAG 2.2 Level AA · section refs (§N) = "Lineamientos de accesibilidad para etapa de diseño web" v1.0 (Gary Muñoz)
**Scope:** `preview.html` (home), `about.html`, `brand-building.html`, `lead-generation.html`, `content-globalization.html`, `business-intelligence.html`, `index.html` (access-code gate), all of `css/` and `js/`.

## How this was checked

- Full read of every HTML, CSS and JS file.
- Contrast computed with the WCAG relative-luminance formula from the token values in `css/colors.css` and the inline header/footer overrides.
- Headless Chromium 155 runs (reduced motion and full motion):
  - real **Tab-key walks** on every page at 1280px and 375px, recording each focus stop and whether it was actually visible;
  - **reflow** at 1280, 640 (= 200% zoom) and 320 CSS px (= 400% zoom), with and without the WCAG 1.4.12 text-spacing override, flagging text pushed off-screen or clipped;
  - screenshots to confirm each layout finding.
- Not done: a live NVDA session. The announcements in Phase 3 will be derived from the accessibility tree, and Gary's review stays the real test.

## Read this first: three facts that change the brief

1. **There are no `/en/` and `/es/` versions.** Every page exists once, in English. The EN/ES control in the header is two buttons that only toggle `aria-pressed` (`js/nav.js:34-42`, comment: "visual state only — no translated copy yet"). So "apply every fix to both /en/ and /es/" does not apply yet. Every fix below applies to the single English set, and all new accessible text is in English.
2. **The home page is `preview.html`.** `index.html` is a password gate that redirects there.
3. **Solution names differ between the brief, the pages and the contact form** (see A11Y-39). Page titles below use each page's own H1.

## Decisions needed before Phase 2

| # | Decision | Options | Recommendation |
|---|---|---|---|
| **D1** | Home page landmarks (A11Y-02). The home `<header>` sits inside the hero wrapper (`#root > #content`), and the `<footer>` sits inside `section#contact`. No single element can become `<main>` without also containing the header. | **A.** Only add attributes: wrap everything after the skip link in `<main>`, put `role="banner"` on the header and `role="contentinfo"` on the footer. This nests banner and contentinfo inside main, axe flags it, and the skip link can no longer point at `<main>` itself. **B.** Move `<header>` out of `#root` to just after the skip link, and move `<footer>` out of `#contact` to the end of `<body>`. Wrap the rest in `<main id="main-content">`. Needs about 6 small edits in `js/main.js` (header lookup, and keeping the header hidden during the intro exactly as today). | **B.** It gives clean landmarks matching the subpages. The header's and footer's own markup doesn't change, only where they sit in the DOM. Before/after screenshots will be pixel-compared to prove nothing moved. |
| **D2** | Language control (A11Y-07). ES does nothing, but NVDA announces "ES, toggle button, pressed" when clicked. | **A.** Leave as is and report. **B.** Add `aria-disabled="true"` to ES (no visual change; NVDA says "unavailable") until Spanish exists. **C.** Hide ES until Spanish exists (visual change, so a design decision). | **B** for now. Build the real version (links with `hreflang`, `lang`, `aria-current`, accessible name) when `/es/` pages exist. |

## Findings

Severity: **Critical** = blocks a screen-reader or keyboard user from content or a task · **High** = serious barrier or AA failure on a key path · **Medium** = AA failure with a workaround, or a likely real-world barrier · **Low** = best practice, robustness, or polish.

"Will fix" items change no rendering, apart from the four additions the brief allows (focus indicator, skip link, `.sr-only`, `scroll-padding-top`). "Requires design/content decision" items need a visual or copy change, so they are not applied.

| ID | Page/File:line | WCAG SC | Gary § | Severity | Issue | Proposed fix | Status |
|---|---|---|---|---|---|---|---|
| A11Y-01 | `preview.html:137`, `js/main.js:476` | 1.3.1, 2.1.1, 4.1.2 | §11, §20 | **Critical** | Home **Method** section has `visibility:hidden` until its top reaches the top of the screen. That removes it from the accessibility tree and from Tab order: 6 headings, 5 deliverables, "Talk to us" and 4 solution links. Verified: Tab goes straight from the last solution card to "Learn more about us". In NVDA browse mode the whole section is missing. | Hide it with `opacity:0` + `pointer-events:none` instead (renders identically, stays in the a11y tree). If focus enters while it's hidden, scroll to the section so it becomes visible. | Will fix |
| A11Y-02 | `preview.html:16,17,27,281,309` | 1.3.1, 2.4.1 | §21, §22 | **Critical** | Home has **no `<main>`**. The `<footer>` is inside `section#contact`, so it is not a contentinfo landmark. The skip link points to `#solutions`, which skips the H1. Nothing on the page is inside a landmark except header/nav. | `<main id="main-content">`, top-level footer, skip link → `#main-content`. Approach per **D1**. | Will fix (pending D1) |
| A11Y-03 | `preview.html:16,31-35,148`, `js/main.js:308-314` | 2.4.3, 2.4.1 | §11, §21 | High | On home, every `#` link (skip link, nav Solutions/Method/FAQs/Contact, "Talk to us") is intercepted by JS: it scrolls, then cancels the default. **Focus never moves**, so the next Tab continues from the header. | After scrolling, move focus to the target (`tabindex="-1"`, `focus({preventScroll:true})`). | Will fix |
| A11Y-04 | `preview.html:67-130`, `js/main.js:157-174` | 2.4.7, 2.4.11 | §12, §13, §26 | High | Desktop solution cards are revealed by scrolling. Tab reaches cards 2–4 while they are still fully clipped (**focused but invisible**; verified). During the exit phase the cards are thrown off-screen but stay focusable. | When a card receives focus, scroll to the point where all four cards are open. | Will fix |
| A11Y-05 | `js/nav.js:22-32`; header on all pages | 2.4.3 | §15 | High | Mobile/tablet menu (< 1024px): the menu links come *before* the burger in the DOM. After opening the menu, Tab leaves the header (verified: next stop is page content). The menu is only reachable by Shift+Tab back past EN/ES. | Tab from the open burger → first menu link. Shift+Tab from the first link → burger. Tab from the last link → close the menu and continue after the header. Escape already closes and returns focus. | Will fix |
| A11Y-06 | `js/main.js:507-510` | 2.1.4 | §11 | High | Pressing **R** anywhere outside a text field replays the intro: the screen blanks for about 2 s. It's a single-character shortcut that can't be turned off (a leftover from the design canvas). | Remove the shortcut. | Will fix |
| A11Y-07 | `js/nav.js:34-42`; header on all pages | 4.1.2 (expectation), 3.1.1 | §28 | High | The ES control does nothing (see "Read this first"). The EN/ES names are bare abbreviations. There are no `hreflang`, URLs or `aria-current`. | Per **D2**. The full spec needs `/es/` pages. | Requires design/content decision |
| A11Y-08 | `preview.html:79,127`; `about.html:187`; `brand-building.html:54,177`; `business-intelligence.html:54,186`; "What's next" Brand Building and Business Intelligence cards on every solution page | 1.4.3 | §4 | High | White text on **green #90b73e = 2.33:1** and on **orange #f8961c = 2.24:1**. That fails even the 3:1 large-text minimum. Affects the "Explore" buttons, "Book a discovery call" (Brand Building, Business Intelligence) and "Let's talk" (About). | Use dark text `#0a0b0d` on green/orange (8.47 / 8.79:1); the tokens already define `--on-accent` for this. | Requires design/content decision |
| A11Y-09 | `preview.html:47`, `js/main.js:404-419` | 2.2.2 | §24 | High | Hero word in the H1 rotates every 2.8 s **forever** with no pause control. Only OS reduced-motion stops it. The H1 text itself keeps changing. | Visible pause/stop control, or stop after one cycle (under 5 s). | Requires design/content decision |
| A11Y-10 | `index.html:37-46` | 1.3.1, 3.3.2, 4.1.2, 4.1.3 | §29, §22 | High | Gate page: the access-code field has **no label** (placeholder only). "Incorrect code" is not announced or linked to the field. There is no `<main>`. | Visually hidden `<label>`. Error linked via `aria-describedby`, announced via `role="alert"`, plus `aria-invalid`. `div.gate` → `main.gate` (same class, renders identically). | Will fix |
| A11Y-11 | `js/main.js:189,200,254` | 2.4.11 | §13 | Medium | On home, the header slides off-screen during the Solutions exit/title phase even when focus is in it (e.g. Shift+Tab back to the nav). The focused link is invisible. | Skip the header transform while the header contains focus. | Will fix |
| A11Y-12 | `css/site.css` (all pages) | 2.4.11 | §13 | Medium | Fixed header (79px desktop, 67px ≤ 767px) can cover focused elements and anchor targets when tabbing backwards. | `html { scroll-padding-top }` = header height + room for the focus ring. | Will fix |
| A11Y-13 | `js/faq.js:103-115`, `js/reveal.js:17-23`, `js/solution.js:158-174`, `js/brand-building.js:147-163`, `js/about.js:103-129` | 2.4.7 | §12 | Medium | Elements start at opacity 0 and fade in once 15–25% of them is on screen. Keyboard focus lands on them while still invisible. Verified on the FAQ tab, FAQ panel and contact e-mail link (home), and the FAQ tab (solution pages). | When an element or one of its children gets focus, reveal it immediately (`focusin`). Mouse users see no difference. | Will fix |
| A11Y-14 | `preview.html` (no focus rule), `css/home.css:27`, `index.html:22` | 2.4.7 | §12 | Medium | Home has no global focus style: logo, solution cards, footer links and Typesetter link rely on the browser default. The cards' `clip-path` clips any outline. Gate input has `outline:none`, leaving only a 1px border colour change. | Add the brief's `:focus-visible` rule (3px `currentColor`, offset 3px), wrapped in `:where()` so the existing 2px indicators on other pages stay as they are. Inset offset on home cards so the ring isn't clipped. Same rule in `index.html`. | Will fix |
| A11Y-15 | `css/solution.css:30` (Brand Building, Lead Generation, Content Globalization, Business Intelligence) | 1.3.1 | §3 | Medium | Service rows: on desktop the "Diagnosis" / "Solution" labels are `display:none`, and the visual column header is `aria-hidden`. A screen reader hears the two paragraphs with no labels. | Visually hide the labels (`.sr-only` technique) instead of `display:none` at ≥ 1024px. | Will fix |
| A11Y-16 | `js/brand-building.js:125-141`, `js/about.js:89-97,116-125` | 1.3.1 | §17 | Medium | Stats are set to **"0"** until scrolled into view, then count up. A screen reader reads "0%" or numbers in flux. `solution.js` already fixes this with a hidden final figure; Brand Building and About don't. | Reuse the `solution.js` technique (visually hidden final value, animated copy `aria-hidden`). | Will fix |
| A11Y-17 | `preview.html:72,88,104,120`; "What's next" card titles on every solution page (e.g. `lead-generation.html:194,203,212`, `brand-building.html:186,196,206`) | 1.3.1, 2.4.6 | §3, §26 | Medium | Solution card titles are `<span>`s. Heading navigation (H key) can't find the four solutions. | `<h3>` with the same class/inline style plus `margin:0`. On home, the wrapping `<span>` becomes `<div>` (a heading can't sit in a span) and four `home.css` selectors are updated so the result is identical. | Will fix |
| A11Y-18 | `preview.html:134` | 1.3.1 | §3 | Medium | The animated "The types Method" title copy is a second `<h2>` (invisible most of the time). The heading list shows it twice. | `aria-hidden="true"` on the animated copy. | Will fix |
| A11Y-19 | Home Method labels (`js/main.js:427`); Content Globalization / Lead Generation steps "Build" (`content-globalization.html:147`, `lead-generation.html:140`); mobile FAQ first sentence on teal/magenta pages (`css/faq.css:30`); gate tag (`index.html:18,38`) | 1.4.3 | §4 | Medium | Small text in **teal #00808b = 4.18:1** or **magenta #c92256 = 3.61:1** on #0a0b0d (needs 4.5:1). The same colours pass as large text. | Lighter accent tint for small text, or use ink. | Requires design/content decision |
| A11Y-20 | Footer `.hv-green`, `.hv-orange` (`css/site.css:42,45`) | 1.4.3 | §4 | Medium | Hover colour of the "Brand Building" / "Business Intelligence" footer links on white: 2.33 / 2.24:1. | Different hover treatment on white. | Requires design/content decision |
| A11Y-21 | `css/components.css:88`, `css/site.css:89` | 1.4.1 | §5 | Medium | Current nav item is shown by colour only. Desktop: #0a0b0d vs #33373e (1.65:1 between the two states, practically invisible). Mobile: teal only. Screen readers do get `aria-current`. | Add a non-colour cue (underline, weight, the triangle marker used on home). | Requires design/content decision |
| A11Y-22 | `about.html:157`; "Move forward with confidence." on every solution page (e.g. `lead-generation.html:185`); `css/home.css:98` (`#dd` tagline) | 1.4.12, 1.4.10 | §18, §19 | Medium | At 320px with WCAG text spacing, the giant one-word lines overflow and get **cut off** by `overflow-x:clip` (screenshots: "Confiden…", "onfidence"). The home tagline is `nowrap` ≥ 1024px and only refits on resize. | Smaller minimum font size or allow hyphenation for these display lines. | Requires design/content decision |
| A11Y-23 | `index.html:22` | 1.4.11 | §6 | Medium | Access-code input border #262a31 on #131519 = 1.27:1 (needs 3:1); field background vs page 1.08:1. | Use `--border-control` (3.26:1). | Requires design/content decision |
| A11Y-24 | Header nav on all pages (e.g. `lead-generation.html:20-26`); footer nav (e.g. `lead-generation.html:237-244`) | 1.3.1 | §14 | Low | Navs contain bare `<a>` with no list, so NVDA doesn't say "list, 5 items". Labels are "Main" / "Footer". | `<ul><li>` with `display:contents` (layout untouched). Mobile stagger selectors moved from `a:nth-child` to `li:nth-child`. `aria-label="Main navigation"` as requested. Footer nav gets the same list treatment. | Will fix |
| A11Y-25 | Footer "Contact" / "Explore" labels (e.g. `lead-generation.html:233,238`, `preview.html:291,296`) | 1.3.1 | §3 | Low | Visual column titles are `<p>`. | `<h2>` with the same inline styles (margin, size and weight are already set inline, so it renders identically). | Will fix |
| A11Y-26 | `<title>` of every page | 2.4.2 | §27 | Low | Titles are brand-first ("Types — Lead Generation"), so screen readers announce the brand first on every tab switch. | "Lead Generation \| Types", "About \| Types", etc. (each page's H1; gate "In development \| Types"). Home stays "Types — Move forward with clarity." | Will fix |
| A11Y-27 | Skip link on every subpage (e.g. `about.html:16`, `brand-building.html:17`) | 2.4.1 | §21 | Low | Text "Skip to content", target `#main`. Brand Building uses its own duplicate `.bb-skip` class. | Text "Skip to main content", `<main id="main-content">`. Existing classes kept. | Will fix |
| A11Y-28 | Solution pages nav (e.g. `lead-generation.html:21`) | 1.3.1 | §14 | Low | `aria-current="page"` on "Solutions", but this page isn't the Solutions page, so NVDA says "current page, Solutions". | `aria-current="true"` (announced "current"). CSS selectors extended to match `"true"` so the look is unchanged. | Will fix |
| A11Y-29 | `js/nav.js:15-20` | 4.1.2 | §15 | Low | Burger swaps its label "Open menu"/"Close menu" *and* toggles `aria-expanded`, so NVDA says "Close menu, button, expanded". | Static `aria-label="Menu"`; `aria-expanded` carries the state. | Will fix |
| A11Y-30 | Footer "Punto.Lab" link (e.g. `lead-generation.html:247`) | 3.2.5 (AAA) | §9 | Low | Opens a new tab without warning. The Typesetter link already warns. | Visually hidden " (opens in a new tab)". | Will fix |
| A11Y-31 | `preview.html:268`, `js/contact.js:59` | 4.1.3 | §29 | Low | Error count has `role="alert"`, so it interrupts on every change while typing and competes with the focused field's error. | `role="status"` (polite). Focus still moves to the first invalid field. | Will fix |
| A11Y-32 | `js/faq.js:49-57` | 2.1.1 | §11, §23 | Low | FAQ tabs: no Home/End keys. Hovering a question switches the answer (mouse only; not a failure). | Add Home/End. Hover behaviour reported only. | Will fix |
| A11Y-33 | `preview.html:144-147` | 1.3.1 | §3 | Low | Method sticky progress (counter "01 / 05", big step word, 5-label row) is a visual scroll indicator. A screen reader reads it as content, duplicating the steps. | `aria-hidden="true"` (same as About's question tracker). | Will fix |
| A11Y-34 | `js/faq.js:122-127` | 2.4.3 | §11 | Low | Crossing the 1024px breakpoint re-renders the FAQ, and focus inside it is lost. | Restore focus to the equivalent question after re-render. | Will fix |
| A11Y-35 | `preview.html:309` | 4.1.1 (obsolete) | §25 | Low | Stray `</section>`. | Remove (folded into D1). | Will fix |
| A11Y-36 | `.ty-lang button`; desktop nav links | 2.5.8 | §10 | Low | Targets pass the 24px minimum but are under 44px: EN/ES ≈ 36×27 (≈ 32×27 below 480px); desktop nav links ≈ 26px tall. | Enlarge to 44×44. | Requires design/content decision |
| A11Y-37 | Footer "Punto.Lab" (`css/site.css:147`) | 1.4.1 | §5 | Low | In-text link is distinguished by weight only (link vs text 2.39:1). Underline appears on hover only. Passes AA through the weight difference. | Persistent underline. | Requires design/content decision |
| A11Y-38 | `js/main.js:385-394`, `solution.js:177-190`, `about.js:144-150`; `solution.js:82-88`, `about.js:80-86`; `main.js:483-487` | 2.2.2, 1.4.3 | §24, §4 | Low | Background blobs drift forever (decorative, stops with reduced motion). Word-by-word reveals start at 16–20% opacity (1.49–1.73:1) until scrolled. Method step text dims to 62% (muted text 3.79:1). | Pause control for motion, or accept as decorative. Higher minimum opacity. | Requires design/content decision |
| A11Y-39 | `preview.html:255-258` vs page H1s | 3.2.4 | §9 | Medium | The form lists **Brand Development / Demand Generation / Global Content**; the pages and nav say **Brand Building / Lead Generation / Content Globalization**. The brief uses the form's names. A screen-reader user can't match them. | Pick one set of names site-wide. | Requires design/content decision |
| A11Y-40 | Home Method labels `clamp(7px,2.5cqi,15px)` (`preview.html:147`); desktop solutions grid scaled to 0.6–0.75 on short screens (`js/main.js:275-282`) | 1.4.4 | §17 | Low | Text can render at about 7–9px at 100% zoom. Zoom still works because the layout switches, so it passes, but it's hard to read. | Raise minimums. | Requires design/content decision |
| A11Y-41 | `index.html:42` | 2.4.3 (advisory) | §11 | Low | `autofocus` on the gate field: a screen reader starts at the field and skips "We're building something" and the instructions. | Remove `autofocus`; sighted users then have to click the field. | Requires design/content decision |
| A11Y-42 | Footer LinkedIn (`preview.html:293` and every page) | — | §9 | Low | Points to `linkedin.com` root, which looks like a placeholder. | Real company URL. | Requires design/content decision |

## Contrast table

Dark theme: page `#0a0b0d`, raised surface `#131519`. Header/footer: white `#ffffff` with their own ink overrides. Large text = ≥ 24px, or ≥ 18.66px bold.

| Foreground | Background | Ratio | Required | Result | Where |
|---|---|---|---|---|---|
| `#f4f5f6` ink | `#0a0b0d` | 18.04 | 4.5 | Pass | Body, headings, card titles |
| `#a3a9b3` ink-muted | `#0a0b0d` | 8.33 | 4.5 | Pass | Secondary text, eyebrows, Method labels (inactive) |
| `#a3a9b3` ink-muted | `#131519` | 7.73 | 4.5 | Pass | Card quotes, deliverable text |
| `#8a909a` ink-subtle | `#0a0b0d` | 6.13 | 4.5 | Pass | "Required"/"Optional", fact sources, About questions (inactive) |
| `#8a909a` ink-subtle | `#131519` | 5.69 | 4.5 | Pass | — |
| `rgba(255,255,255,.78)` | `#0a0b0d` | 11.90 | 4.5 | Pass | FAQ tabs (unselected) |
| `#90b73e` green | `#0a0b0d` | 8.47 | 4.5 | Pass | Accent text, hero word |
| `#f8961c` orange | `#0a0b0d` | 8.79 | 4.5 | Pass | Errors, accent text |
| `#00808b` teal | `#0a0b0d` | 4.18 | 3 (large) / 4.5 (small) | Pass large / **Fail small** | Method H3s (pass); Method active label, "Build" step, mobile FAQ bold, gate tag (fail) |
| `#00808b` teal | `#131519` | 3.88 | 3 (large) | Pass | Desktop FAQ panel bold first sentence (19–21px bold) |
| `#c92256` magenta | `#0a0b0d` | 3.61 | 3 (large) / 4.5 (small) | Pass large / **Fail small** | Large accent words (pass); Lead Generation "Build" step, mobile FAQ bold (fail) |
| `#c92256` magenta | `#131519` | 3.35 | 3 (large) | Pass | Desktop FAQ panel bold first sentence |
| `#ffffff` | `#90b73e` green | **2.33** | 4.5 (3 large) | **Fail** | Explore / Book a discovery call / Let's talk on green |
| `#ffffff` | `#f8961c` orange | **2.24** | 4.5 (3 large) | **Fail** | Explore / Book a discovery call on orange |
| `#ffffff` | `#c92256` magenta | 5.46 | 4.5 | Pass | Magenta CTAs and cards |
| `#ffffff` | `#00808b` teal | 4.71 | 4.5 | Pass | Talk to us, Send request, teal CTAs/cards |
| `#ffffff` | `#1b1e23` | 16.71 | 4.5 | Pass | Send request (hover) |
| `#0a0b0d` | `#90b73e` / `#f8961c` | 8.47 / 8.79 | 4.5 | Pass | Suggested fix for A11Y-08 |
| `#0a0b0d` (check mark) | `#c92256` / `#00808b` | 3.61 / 4.18 | 3 (non-text) | Pass | Selected service checkbox |
| `#5c6370` border-control | `#0a0b0d` | 3.26 | 3 (non-text) | Pass | Input underline, service button border |
| `#c92256` / `#00808b` / `#90b73e` / `#f8961c` | `#0a0b0d` | 3.61 / 4.18 / 8.47 / 8.79 | 3 (non-text) | Pass | Selected service border, error border |
| `#262a31` border-subtle | `#0a0b0d` / `#131519` | 1.37 / 1.27 | 3 if essential | Fail (decorative) | Card and divider borders; cards are identified by their content, so reported only |
| `#f4f5f6` focus ring | `#0a0b0d` | 18.04 | 3 (non-text) | Pass | Focus indicator, dark areas |
| `#0a0b0d` | `#ffffff` | 19.69 | 4.5 | Pass | Header/footer ink, skip link, focus ring in header/footer |
| `#33373e` | `#ffffff` | 11.95 | 4.5 | Pass | Nav links, footer links |
| `#4a4f57` | `#ffffff` | 8.24 | 4.5 | Pass | EN/ES (unselected), footer titles, legal line |
| `#ffffff` | `#0a0b0d` | 19.69 | 4.5 | Pass | EN/ES (selected) |
| `#6b7079` | `#ffffff` | 4.98 | 3 (non-text) | Pass | EN/ES border, burger border |
| `#00808b` teal | `#ffffff` | 4.71 | 4.5 | Pass | Mobile current link, footer hover (teal) |
| `#c92256` magenta | `#ffffff` | 5.46 | 4.5 | Pass | Footer hover (magenta) |
| `#90b73e` green | `#ffffff` | **2.33** | 4.5 | **Fail** | Footer hover "Brand Building" |
| `#f8961c` orange | `#ffffff` | **2.24** | 4.5 | **Fail** | Footer hover "Business Intelligence" |
| `#8a8f98` | `#ffffff` | 3.25 | — | n/a | Nav triangle marker (decorative, `aria-hidden`) |
| `#0a0b0d` vs `#33373e` | (state vs state) | **1.65** | 3 (if colour-only) | **Fail** | Desktop current nav item vs others (A11Y-21) |
| `#0a0b0d` (link) vs `#4a4f57` (text) | `#ffffff` | 2.39 | 3 (if colour-only) | Pass via weight | "Punto.Lab" in-text link (A11Y-37) |
| ink at 20% / 16% opacity | `#0a0b0d` | **1.73 / 1.49** | 4.5 | **Fail (temporary)** | Word-by-word reveal before scrolling |
| ink-muted at 62% opacity | `#0a0b0d` | **3.79** | 4.5 | **Fail (temporary)** | Method step text while dimmed |
| `#262a31` input border | `#131519` | **1.27** | 3 (non-text) | **Fail** | Gate access-code field |
| `#00808b` teal (12px) | `#0a0b0d` | **4.18** | 4.5 | **Fail** | Gate "In development" tag |
| `#a3a9b3` / `#f8961c` | `#0a0b0d` | 8.33 / 8.79 | 4.5 | Pass | Gate text and error |

Note: text over the blurred colour "blobs" was spot-checked at the strongest overlay (about 20% accent tint). Ink stays above 15:1 and muted text above 6:1.

## Checked and passing

- `<html lang="en">` on every page. No other-language fragments exist.
- One `<h1>` per page, no skipped heading levels (once A11Y-18 is fixed). Section titles that look like eyebrows ("What's Next?", "What we believe") are already real headings.
- Subpages have correct landmarks: `header` (banner), `nav` ×2, `main`, `footer` (contentinfo).
- All solution cards are real `<a>` elements with one link per card and no nested interactive elements. Link names are unambiguous; no "Learn more"-style names.
- Actions are `<button>`, navigation is `<a>`. No clickable `div`/`span`, no positive `tabindex`, no keyboard traps.
- Decorative canvas, blobs, triangles and intro overlay are all `aria-hidden`. Logo images have alt text or sit inside labelled links. The Typesetter link warns about the new tab.
- The rolling button text uses `content: attr(data-t) / ""`, so it isn't read twice.
- Contact form: every field has `<label for>`; services are a `<fieldset><legend>`; required is shown as text, not colour; `autocomplete` is name / organization-title / organization / email; errors are text + icon + border and linked with `aria-describedby` + `aria-invalid`; focus moves to the first invalid field; the success message is focused and inside `role="status"`; Enter submits.
- Services use toggle buttons with `aria-pressed`, a valid pattern that NVDA reads as "toggle button, pressed". Native checkboxes would be optional.
- FAQ: desktop is an ARIA tablist with roving tabindex, arrow keys and a focusable panel; mobile is an accordion with `h3 > button[aria-expanded]` and `hidden` panels.
- Mobile menu: real `button`, `aria-controls`, `aria-expanded` kept in sync, Escape closes and returns focus, closed menu is `display:none` (not focusable).
- `prefers-reduced-motion` is respected everywhere: intro, rotation, blobs, reveals, count-ups, menu animation, smooth scroll.
- No duplicate IDs. Every `aria-controls` / `aria-describedby` / `aria-labelledby` points to an existing ID. No tooltips. No modals.
- No CSS `order` or reverse flex/grid; the tablet grid areas on the cards keep reading order.
- No text clipping at 200% zoom (640px) on any page, with or without text spacing.

# UX, Responsive & Accessibility Audit — Phase D (2026-05-08)

Scope: Sprint 4 Phase D — UX, Responsive & Accessibility  
Branch: sprint-4/release-hardening

## Summary

Phase D UX hardening completed.
Three atomic commits applied:

1. `fix(web): responsive header with skip-link, viewport meta and mobile nav`
2. `fix(web): raise touch targets to 44px and add live-region alerts to forms`
3. `fix(web): add aria-hidden, aria-expanded, landmarks and screen-reader semantics`

---

## Breakpoint Audit — Key Screens

### Screens Audited

| Page                            | 320px | 375px | 768px | 1024px | 1440px |
| ------------------------------- | ----- | ----- | ----- | ------ | ------ |
| Home (/)                        | ✅    | ✅    | ✅    | ✅     | ✅     |
| Reports feed (/reports)         | ✅    | ✅    | ✅    | ✅     | ✅     |
| Report detail (/reports/:id)    | ✅    | ✅    | ✅    | ✅     | ✅     |
| Create report (/reports/create) | ✅    | ✅    | ✅    | ✅     | ✅     |
| My reports (/reports/mine)      | ✅    | ✅    | ✅    | ✅     | ✅     |
| Moderation (/moderation)        | ✅\*  | ✅    | ✅    | ✅     | ✅     |
| Admin (/admin)                  | ✅\*  | ✅    | ✅    | ✅     | ✅     |

\*Single-column stacking at 320px; all content accessible.

---

## Finding 1 — Header Nav Overflow on 320px

**Severity:** Critical — Blocks mobile usability  
**Status:** Fixed ✅

### Description

For signed-in users, the nav included: MAME + Reports + My Reports + (role links) + New Report + UserButton. On 320px this exceeded viewport width, causing horizontal overflow.

### Fix

- "My Reports" hidden below `sm` breakpoint using `hidden sm:contents` wrapper.
- Role-gated links (`AdminNavLink`, `ModerationNavLink`, `SecurityNavLink`) are already lazy-loaded and only visible to privileged users on wider screens.
- Guest layout (MAME + Reports + Sign In + Sign Up) verified to fit 320px.
- Added `aria-label="Main navigation"` to `<nav>` element.

---

## Finding 2 — All Interactive Elements Below 44px Touch Target

**Severity:** Critical — WCAG 2.5.5 failure  
**Status:** Fixed ✅

WCAG 2.5.5 (Success Criterion) requires touch targets to be at least 44×44 CSS pixels.

### Elements Fixed

| Component               | Element            | Before      | After                     |
| ----------------------- | ------------------ | ----------- | ------------------------- |
| `header.tsx`            | All nav Buttons    | h-9 (36px)  | min-h-[44px]              |
| `header.tsx`            | MAME logo Link     | ~24px       | min-h-[44px] flex         |
| `step-category.tsx`     | Category select    | h-9 (36px)  | h-11 (44px)               |
| `link-form.tsx`         | Add Link Button    | h-9 (36px)  | min-h-[44px]              |
| `evidence-upload.tsx`   | Choose File Button | h-9 (36px)  | min-h-[44px]              |
| `moderation-queue.tsx`  | Refresh Button     | h-9 (36px)  | min-h-[44px]              |
| `moderation-queue.tsx`  | Action select      | h-9 (36px)  | h-11 (44px)               |
| `moderation-queue.tsx`  | Apply Button       | h-10 (40px) | min-h-[44px]              |
| `admin-users-panel.tsx` | Role select        | h-9 (36px)  | h-11 (44px)               |
| `admin-users-panel.tsx` | Refresh Button     | h-9 (36px)  | min-h-[44px]              |
| `admin-users-panel.tsx` | Save Role Button   | h-9 (36px)  | min-h-[44px]              |
| `report-form.tsx`       | Back/Next/Submit   | h-10 (40px) | min-h-[44px]              |
| `submit-button.tsx`     | Submit for Review  | h-10 (40px) | min-h-[44px]              |
| `evidence-lightbox.tsx` | Close Button       | ~30px       | min-h-[44px] min-w-[44px] |

**Note:** Clerk's `UserButton` component is a third-party element we cannot control. It renders at ~36px. This is documented as a known external-component limitation.

---

## Finding 3 — Error Messages Without Live Regions

**Severity:** High — Screen readers miss dynamic errors  
**Status:** Fixed ✅

### Description

Form error messages appeared in the DOM dynamically but had no `role="alert"`. Screen readers (VoiceOver, NVDA) would not announce them automatically when they appeared.

### Fix

Added `role="alert"` to all dynamically-inserted error `<p>` elements:

- `link-form.tsx` — "Failed to add link"
- `evidence-upload.tsx` — "Upload failed / File exceeds 5MB"
- `report-form.tsx` — validation error
- `submit-button.tsx` — submission error
- `moderation-queue.tsx` — moderation error

---

## Finding 4 — Missing Skip-to-Content Link

**Severity:** High — Keyboard navigation failure  
**Status:** Fixed ✅

### Description

No skip-to-content link existed. Keyboard users had to tab through all header navigation on every page load before reaching the main content.

### Fix

Added visually-hidden skip link in `layout.tsx`:

```
<a href="#main-content" class="sr-only focus:not-sr-only ...">Skip to content</a>
<main id="main-content" ...>
```

The link becomes visible only when focused via keyboard (Tab key).

---

## Finding 5 — Missing Viewport Metadata Export

**Severity:** Medium — Mobile rendering hint missing  
**Status:** Fixed ✅

In Next.js 15, `viewport` should be exported separately from `metadata`.

```typescript
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}
```

`maximumScale: 5` allows user-initiated zoom (required by WCAG 1.4.4).

---

## Finding 6 — Decorative SVGs Without aria-hidden

**Severity:** High — Screen readers narrate decorative icons  
**Status:** Fixed ✅

The vote count SVG (upward chevron) in `report-card.tsx` and `my-report-card.tsx` had no `aria-hidden="true"`. Screen readers would attempt to describe it as an unnamed SVG graphic.

### Fix

- Added `aria-hidden="true"` to decorative SVGs.
- Wrapped vote count in `<span aria-label="${votes} votes">` for meaningful label.

---

## Finding 7 — Lightbox Close Button Without Accessible Label

**Severity:** High — Screen reader users cannot identify close action  
**Status:** Fixed ✅

The `Dialog.Close` component rendered `✕` text without a programmatic label. Screen readers would announce "button ✕" which is not meaningful.

### Fix

Added `aria-label="Close image"` to the lightbox close button.

---

## Finding 8 — Report Feed Without Landmark

**Severity:** Medium — Screen reader users cannot jump to content  
**Status:** Fixed ✅

The reports grid was rendered inside a React fragment `<>` with no semantic landmark. Screen reader navigation by landmark (NVDA, VoiceOver) could not jump directly to the feed.

### Fix

Wrapped feed in `<section aria-label="Published reports">`.

---

## Finding 9 — Privacy Notice Toggle Missing aria-expanded

**Severity:** Medium — State not communicated to screen readers  
**Status:** Fixed ✅

The collapsible privacy notice button toggled content but had no `aria-expanded` attribute. Screen readers could not communicate open/closed state.

### Fix

Added `aria-expanded={open}` and `aria-controls="privacy-details"` to the toggle button.  
Added `id="privacy-details"` to the controlled panel.

---

## Link Form Layout Fix

**Severity:** Medium — Mobile layout issue  
**Status:** Fixed ✅

The error message was inline in the `flex` row alongside Input and Button. On 320px this caused a third item in the row. Moved error message below the flex row in its own element.

---

## Lighthouse Status

- Lighthouse CLI not available locally.
- All code-level improvements applied; ready for CI/staging measurement.
- Expected score improvement: mobile performance +5-10 (lazy loading already applied in Phase C), accessibility +10-15 (aria attributes, touch targets, skip link).

## Known Limitations

| Item                                    | Status          | Reason                                |
| --------------------------------------- | --------------- | ------------------------------------- |
| Clerk `UserButton` touch target (~36px) | Not fixed       | Third-party component, no exposed API |
| Lighthouse mobile score measurement     | Pending CI      | CLI unavailable locally               |
| Color contrast verification             | Pending tooling | Requires Lighthouse/axe-core in CI    |

---

## Test Evidence

- Full test suite after all changes: **69 files, 430 tests, 0 failures**
- No regressions introduced.

---

## DoD Checklist Status

| Criterion                            | Status                                    |
| ------------------------------------ | ----------------------------------------- |
| All breakpoints 320-1440px validated | ✅                                        |
| Header overflow resolved             | ✅                                        |
| Touch targets ≥ 44px                 | ✅ (except Clerk UserButton, third-party) |
| aria-hidden on decorative SVGs       | ✅                                        |
| role=alert on dynamic errors         | ✅                                        |
| Skip-to-content link                 | ✅                                        |
| Feed landmark                        | ✅                                        |
| aria-expanded on toggles             | ✅                                        |
| Lightbox close labeled               | ✅                                        |
| Lighthouse mobile ≥ 85               | ⏳ Pending CI run                         |
| axe-core accessibility scan          | ⏳ Pending CI run                         |

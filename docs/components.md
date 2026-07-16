# Component Reference

All components live in `web/src/components/`. Every component that needs app state calls `useApi()` to access the `Api` instance from context.

## Component Tree

```
App
└── AppRouter
    └── Layout (root for all routes)
        ├── header
        │   ├── SearchInput
        │   ├── show-completed checkbox
        │   └── menu icon → PlanSettings (sidebar)
        │       └── TagSelector (one per PerDayTagData entry)
        ├── main (route outlet)
        │   ├── / → ChapterGroupList (Books view)
        │   │         └── ChapterGroup (one per book)
        │   │               └── Chapter (one per chapter)
        │   ├── /plan → ChapterGroupList (Plan view)
        │   │             └── ChapterGroup (one per day)
        │   │                   └── Chapter
        │   └── /history → HistoryList
        └── footer (tab bar: Books | Plan | History)
```

## Component Catalog

### `App` (`App.tsx`)

Bootstrap component. Calls `Api.create()` via `createResource`, waits for the async result, then renders `ApiProvider` → `AppRouter`. Nothing renders until the Api is ready.

### `AppRouter` (`AppRouter.tsx`)

Configures routes. Computes two top-level data structures passed as props:

- `bookGroups: Record<BookName, ChapterData[]>` — computed once via `groupByBook`
- `planGroups: Accessor<Record<string, ChapterData[]>>` — `createMemo` around `groupByDay`; reactive to `api.perDayTagData()`

### `Layout` (`Layout.tsx`)

Shell shared by all routes. Contains:

- Page title (derived from current path)
- Show Completed checkbox (toggles `api.showCompleted`)
- Search input (writes to `api.setSearchText`)
- Sidebar toggle (shows/hides `PlanSettings`)
- Tab bar navigation

### `ChapterGroupList` (`ChapterGroupList.tsx`)

Renders a list of `ChapterGroup` accordions from a `Record<string, ChapterData[]>`.

Key behaviors:
- Filters groups by `api.searchText()` — only groups containing a matching chapter name are shown
- When `sortProgressToTop` is true (Books view), groups with any completed chapters are sorted above those with none

### `ChapterGroup` (`ChapterGroup.tsx`)

Accordion row representing one book (Books view) or one day (Plan view).

State:
- `isExpanded: Signal<boolean>` — whether the chapter list is open
- `chapters: Signal<ChapterData[]>` — filtered chapter list (respects `showCompleted` and `searchText`)

Displays a `CheckMark` with three states: `complete` (all chapters read), `partial` (some read), `incomplete` (none read).

On `onChange` from a child `Chapter`, re-runs `filteredChapters()` to update the list immediately.

### `Chapter` (`Chapter.tsx`)

Leaf component for a single Bible chapter.

State:
- `isExpanded: Signal<boolean>` — whether the date list is expanded
- `dates: Signal<ISODateTimeString[]>` — all dates this chapter was read

Actions:
- `onAdd()` — calls `api.markAsRead(abbrev, number, now())`, appends date to local signal, calls `props.onChange()`
- `onRemove(date)` — calls `api.markAsUnread(...)`, removes date from local signal, calls `props.onChange()`

The expander (chevron + count) only toggles open if `dates().length > 0`. If all dates are removed, the accordion auto-collapses via `createEffect`.

### `HistoryList` (`HistoryList.tsx`)

Flat chronological log of all read events. Reads `api.getTimeStampData()` (derived from `timeStampMap` signal) and sorts descending by date. Filters by `api.searchText()` against `"ABBREV CHAPTER"` string.

### `PlanSettings` (`PlanSettings.tsx`)

Sidebar panel listing one `TagSelector` per entry in `api.perDayTagData()`. Changes are written back via `api.setPerDayTagData`, which triggers `planGroups` memo in `AppRouter` to recompute.

### `TagSelector` (`TagSelector.tsx`)

Controlled input for one `PerDayTagData` entry. Shows selected tags as chips; a text input filters available tags from `tagNames` (by name or description) and pops up a selection list — shown on focus so all existing tags are browsable, narrowing as you type. Each popup entry shows the tag's description from `tagDescriptions` (`api.getTagDescriptions()`), and selected chips carry the description as a `title` tooltip. Also contains a number input for chapters-per-day count, wired to `onChange`.

### `SearchInput` (`SearchInput.tsx`)

Uncontrolled text input that calls `onSearch(value)` on each keystroke.

### `CheckMark` (`CheckMark.tsx`)

Visual indicator with states `complete | partial | incomplete`. Accepts an optional `onClick` handler (used in `Chapter` to trigger `onAdd`).

### `Icon` (`Icon.tsx`)

Renders an inline SVG icon by name (Ionicons subset). Accepts a `size` prop (`"large"` or default).

## Context

### `ApiContext` (`ApiContext.ts`)

```ts
const ApiContext = createContext<Api>()
export const ApiProvider = ApiContext.Provider
export function useApi(): Api  // throws if no provider
```

`Api` is provided once at the `AppRouter` level and consumed by every component that needs state or actions.

## CSS Architecture

Each component has a paired `ComponentName.module.css` file with scoped CSS Modules. Shared accordion styles live in `Accordion.module.css` and are imported by both `ChapterGroup` and `Chapter`. The `className` utility (`utils/cssUtils.ts`) joins class names conditionally.

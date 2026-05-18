# Academic Certificate Verification Portal - Visual System

## Design Direction

The interface should feel like a precision instrument: calm, engineered, editorial, and durable. It borrows from UNIX-era control systems, institutional cryptographic software, and premium developer tooling, but avoids retro pastiche. Typography carries the identity; decoration stays secondary.

## Layout System

- Outer frame: centered workspace with a restrained maximum width and generous page margins.
- Header: title block plus compact operational metadata when wallet data exists.
- Navigation: equal-width phase rail with hard dividers and one high-contrast active state.
- Main work area: clear content bands, thin borders, and flat surfaces.
- Forms: two-column desktop grid, one-column mobile stack, consistent field rhythm.
- Data regions: bordered panels for payloads, QR output, audit records, and machine-readable JSON.
- Density: compact enough for tools, open enough to preserve readability.

## Typography Hierarchy

- Primary font: `JetBrains Mono`.
- H1: 22-34px, medium weight, short measure.
- Section heading: 18px, uppercase, medium weight.
- Panel heading: 13px, uppercase, semibold.
- Labels and metadata: 11px, uppercase, semibold.
- Body copy and inputs: 13-14px.
- JSON, hashes, and tables: 12-13px.
- Letter spacing: `0`; hierarchy comes from size, weight, casing, and whitespace.

## Spacing Rhythm

- Page gutters: 24-48px depending on viewport.
- Core increments: 8, 10, 12, 14, 16, 18, 20, 28px.
- Form gaps: 18px.
- Major region gaps: 18-28px.
- Panel padding: 16-20px.
- Dense data rows: 12-14px vertical padding.

## Color Palette

- Off-white paper: `#f3f0ea`
- Panel surface: `#f8f6f1`
- Secondary surface: `#efebe3`
- Graphite ink: `#1d1d1b`
- Soft ink: `#353432`
- Muted metadata: `#67635d`
- Hairline border: `#c8c2b8`
- Strong border: `#969087`
- Soft silver: `#d9d4cb`
- Success text/background: `#45584c` / `#e3e8e2`
- Error text/background: `#6d4944` / `#ece1de`

## Component Guidance

- Navigation: flat segmented rail, no pills, no icons required.
- Buttons: rectangular, uppercase, dark fill by default, inverse hover.
- Inputs: flat paper fields with stronger focus border, no glow.
- Status indicators: quiet tinted bands with exact wording and thin borders.
- QR sections: isolated white plate with hard outline.
- Tables: editorial grid, muted header row, subtle row hover.
- Data cards: simple bordered cells, one information role per block.
- Modals if introduced later: hard-edged panel, thin frame, mono title bar, no blur.

## Dashboard Concept

- Top band: portal identity on the left, wallet/network metrics on the right.
- Middle band: workflow phases as a control rail.
- Main stage: one active task surface at a time.
- Supporting data: payload, audit trail, and verification output appear as aligned instrument readouts below the active task.

## Interaction Styling

- Transitions: 120-160ms only for background, border, and text color.
- Hover: surface shift or inversion, never elevation.
- Focus: visible border change, no glow.
- Disabled state: silvered surface, muted copy, unchanged geometry.
- Motion: functional and restrained; no decorative animation.

## Tailwind-Friendly Translation

Use the following utility patterns if the project later adopts Tailwind:

```txt
font-mono tracking-normal
bg-[#f3f0ea] text-[#1d1d1b]
border border-[#c8c2b8]
bg-[#f8f6f1] / bg-[#efebe3]
uppercase text-[11px] font-semibold
text-[13px] leading-6
rounded-none shadow-none
transition-colors duration-150
grid gap-4 md:grid-cols-2
```

Suggested semantic tokens:

```txt
paper        #f3f0ea
panel        #f8f6f1
panel-strong #efebe3
ink          #1d1d1b
muted        #67635d
line         #c8c2b8
line-strong  #969087
silver       #d9d4cb
```

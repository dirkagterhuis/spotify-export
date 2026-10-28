// A discriminated union: `kind` tells TypeScript which shape you have, so an `error` only exists
// on a failed export. This rules out impossible combos two booleans would allow (exporting AND failed).
export type ExportStatus =
    | { kind: 'idle' }
    | { kind: 'exporting' }
    | { kind: 'done' }
    | { kind: 'failed'; error: string }

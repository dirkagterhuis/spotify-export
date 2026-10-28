import type { FileType } from './fileType'

// Stand-in for the real export until PKCE (step 7) and client-side fetching (step 8) land.
// It only takes some time, so the UI has an "exporting" phase to react to.
export function fakeExport(_fileType: FileType, durationMs = 2000): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, durationMs))
}

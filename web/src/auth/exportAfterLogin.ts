import { z } from 'zod'

// Router "location state": data that travels with a navigation without showing up in the URL.
// /callback sends it to / after a successful login, so the home page knows to start the export
// the user asked for, instead of making them click a second time.
export const exportAfterLoginState = { exportAfterLogin: true } as const

const ExportAfterLoginSchema = z.object({ exportAfterLogin: z.literal(true) })

// Location state is `unknown`: it lives in the browser's history, so check it rather than cast it.
export function isExportAfterLogin(locationState: unknown): boolean {
    return ExportAfterLoginSchema.safeParse(locationState).success
}

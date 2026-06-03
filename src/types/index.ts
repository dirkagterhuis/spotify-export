import { z } from 'zod'
export * from './spotify'

export const FileTypeSchema = z.enum(['json', 'csv'])
export type FileType = z.infer<typeof FileTypeSchema>

export const ClientSchema = z.object({
    socketId: z.string(),
    sessionId: z.string(),
    state: z.string().optional(),
    fileType: FileTypeSchema.optional(),
})
export type Client = z.infer<typeof ClientSchema>

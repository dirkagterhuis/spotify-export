import { z } from 'zod'

export const FileTypeSchema = z.enum(['json', 'csv'])
export type FileType = z.infer<typeof FileTypeSchema>

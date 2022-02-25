export type FileType = 'json' | 'csv'

export interface Client {
    socketId: string
    sessionId: string
    state?: string
    fileType?: FileType
}
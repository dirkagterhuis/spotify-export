import { useEffect, useRef } from 'react'
import type { ExportStatus } from '../exportStatus'

type ProgressLogProps = {
    status: ExportStatus
    messages: string[]
}

export function ProgressLog({ status, messages }: ProgressLogProps) {
    // A ref is a handle on the real DOM node; React fills it in after rendering.
    const logRef = useRef<HTMLDivElement>(null)

    // Runs after every render where `messages` changed, i.e. once the new <li> is in the DOM.
    useEffect(() => {
        const log = logRef.current
        if (log) {
            log.scrollTop = log.scrollHeight
        }
    }, [messages])

    if (status.kind === 'idle') {
        return null
    }

    const summary = statusSummary(status)

    // role="log" makes screen readers announce new lines as they are appended.
    return (
        <div ref={logRef} role="log" aria-label="Export progress" className="progress-log">
            <ul>
                {/* Index keys are fine here: lines are only ever appended, never reordered. */}
                {messages.map((message, index) => (
                    <li key={index}>{message}</li>
                ))}
            </ul>
            {summary && <p className={`progress-log-summary ${status.kind}`}>{summary}</p>}
        </div>
    )
}

// The switch narrows `status` per case, so `status.error` only type-checks under 'failed'.
// Every case returns: add a new kind to ExportStatus and TypeScript flags this function.
function statusSummary(status: ExportStatus): string | null {
    switch (status.kind) {
        case 'idle':
        case 'exporting':
            return null
        case 'done':
            return 'Done! Your download will start here once the real export lands (step 8).'
        case 'failed':
            return `Something went wrong: ${status.error}`
    }
}

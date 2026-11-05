import { useEffect, useRef, type KeyboardEvent } from 'react'
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
    // tabIndex={0} lets the box take focus, by clicking in it or with Tab, so it gets the key presses
    // below. It also lets keyboard users scroll it with the arrow keys.
    return (
        <div
            ref={logRef}
            role="log"
            aria-label="Export progress"
            className="progress-log"
            tabIndex={0}
            onKeyDown={selectAllInLog}
        >
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

// Ctrl+A (Cmd+A on a Mac) in the box selects only the log, to copy it, instead of the whole page.
// preventDefault stops the browser's own select-all; then select the box's content ourselves.
function selectAllInLog(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault()
        window.getSelection()?.selectAllChildren(event.currentTarget)
    }
}

// The switch narrows `status` per case, so `status.error` only type-checks under 'failed'.
// Every case returns: add a new kind to ExportStatus and TypeScript flags this function.
function statusSummary(status: ExportStatus): string | null {
    switch (status.kind) {
        case 'idle':
        case 'loggingIn':
        case 'exporting':
            return null
        case 'done':
            return 'Done! Your browser is saving the file, usually in your Downloads folder.'
        case 'failed':
            return `Something went wrong: ${status.error}`
    }
}

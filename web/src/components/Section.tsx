import type { ReactNode, Ref } from 'react'

type SectionProps = {
    title: string
    children: ReactNode
    // Since React 19, a function component can take `ref` as a normal prop (no forwardRef needed).
    ref?: Ref<HTMLElement>
}

export function Section({ title, children, ref }: SectionProps) {
    return (
        <section ref={ref}>
            <h2>{title}</h2>
            {children}
        </section>
    )
}

import type { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { PrivacyBanner } from './PrivacyBanner'

type LayoutProps = {
    children: ReactNode
}

export function Layout({ children }: LayoutProps) {
    return (
        <>
            <PrivacyBanner />
            <Header />
            <main>{children}</main>
            <Footer />
        </>
    )
}

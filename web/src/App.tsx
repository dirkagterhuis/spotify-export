import { useState } from 'react'
import { Route, Routes } from 'react-router'
import type { SpotifyToken } from './auth/spotifyCallback'
import { Layout } from './components/Layout'
import { AboutPage } from './pages/AboutPage'
import { CallbackPage } from './pages/CallbackPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PrivacyPage } from './pages/PrivacyPage'

export function App() {
    // Lives here, above the routes, because two pages need it: /callback sets it, / uses it.
    // Memory only, on purpose: a reload or a closed tab forgets the token.
    const [spotifyToken, setSpotifyToken] = useState<SpotifyToken>()

    return (
        <Layout>
            <Routes>
                <Route path="/" element={<HomePage spotifyToken={spotifyToken} />} />
                <Route path="/callback" element={<CallbackPage onLogin={setSpotifyToken} />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Layout>
    )
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { App } from './App'
import './styles.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
    throw new Error('Missing #root element in index.html')
}

createRoot(rootElement).render(
    <StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>
)

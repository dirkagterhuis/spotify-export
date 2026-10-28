// Adds DOM matchers like toBeInTheDocument() to Vitest's expect (types included).
import '@testing-library/jest-dom/vitest'

// jsdom doesn't do layout, so it has no scrollIntoView; a no-op is enough for the tests.
Element.prototype.scrollIntoView = () => {}

import { Section } from '../components/Section'

export function AboutPage() {
    return (
        <Section title="About">
            <p>
                I've created this tool because I can! It's a nice hobby project to play around with,
                and my first to make it to its own domain. The code is open source and you can view
                it here:
            </p>
            <p className="centre">
                <a href="https://github.com/dirkagterhuis/spotify-export">
                    https://github.com/dirkagterhuis/spotify-export
                </a>
            </p>
            <p>
                This is also the place where you can submit issues or improvements, and view the
                roadmap of this web app.
            </p>
        </Section>
    )
}

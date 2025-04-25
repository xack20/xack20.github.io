// components/ui/Section.jsx
export default function Section({ id, children, className = "" }) {
    return (
        <section id={id} className={`py-24 scroll-mt-20 ${className}`}>
            {children}
        </section>
    )
}

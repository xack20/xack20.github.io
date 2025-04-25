export default function Card({ children, highlight = false, className = "" }) {
    return (
        <div className={`card ${highlight ? 'card-highlight' : ''} ${className}`}>
            {children}
        </div>
    )
}

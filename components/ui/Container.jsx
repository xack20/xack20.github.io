// components/ui/Container.jsx
export default function Container({ children, className = "" }) {
    return (
        <div className={`container px-6 mx-auto max-w-7xl ${className}`}>
            {children}
        </div>
    )
}

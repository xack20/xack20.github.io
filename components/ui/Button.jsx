import Link from 'next/link';

export default function Button({
    href,
    variant = "primary",
    className = "",
    children,
    ...props
}) {
    const baseStyles = "btn";
    const variantStyles = variant === "primary" ? "btn-primary" : "btn-outline";

    if (href) {
        return (
            <Link
                href={href}
                className={`${baseStyles} ${variantStyles} ${className}`}
                {...props}
            >
                {children}
            </Link>
        )
    }

    return (
        <button
            className={`${baseStyles} ${variantStyles} ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}

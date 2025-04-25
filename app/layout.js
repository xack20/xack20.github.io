import { Inter, Roboto_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
})

const roboto_mono = Roboto_Mono({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-roboto-mono',
})

export const metadata = {
    title: 'Zakaria Hossain Foysal - Software Engineer',
    description: 'Portfolio website of Zakaria Hossain Foysal, a Software Engineer specializing in blockchain technology, web development, and automation testing.',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${inter.variable} ${roboto_mono.variable}`}>
            <body>
                {children}
            </body>
        </html>
    )
}

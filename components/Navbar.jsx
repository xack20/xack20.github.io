"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Container from './ui/Container'

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    // Improved smooth scrolling with better positioning
    const handleAnchorClick = (e, targetId) => {
        e.preventDefault()
        const targetElement = document.getElementById(targetId)

        if (targetElement) {
            // Get the navbar height dynamically
            const navbar = document.querySelector('header')
            const navbarHeight = navbar ? navbar.offsetHeight : 80

            // Calculate the target position with offset
            const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY

            // Apply the offset and scroll
            window.scrollTo({
                top: targetPosition - navbarHeight - 20, // Added extra 20px for breathing room
                behavior: 'smooth'
            })
        }

        if (isMenuOpen) {
            setIsMenuOpen(false)
        }
    }

    const navItems = [
        { name: 'About', href: '#about', id: 'about' },
        { name: 'Experience', href: '#experience', id: 'experience' },
        { name: 'Projects', href: '#projects', id: 'projects' },
        { name: 'Skills', href: '#skills', id: 'skills' },
        { name: 'Contact', href: '#contact', id: 'contact' },
    ]

    return (
        <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-background/90 backdrop-blur-md py-2 shadow-lg' : 'bg-transparent py-4'}`}>
            <Container className="flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <span className="text-xl font-bold">Zakaria</span>
                </Link>

                <nav className="hidden md:flex space-x-8">
                    {navItems.map((item) => (
                        <a
                            key={item.name}
                            href={item.href}
                            onClick={(e) => handleAnchorClick(e, item.id)}
                            className="text-gray-300 hover:text-white transition-colors"
                        >
                            {item.name}
                        </a>
                    ))}
                </nav>

                <button
                    className="block md:hidden text-white"
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {isMenuOpen ? (
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        ) : (
                            <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        )}
                    </svg>
                </button>

                {isMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-md md:hidden py-4 shadow-lg">
                        <Container>
                            <nav className="flex flex-col space-y-4">
                                {navItems.map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        onClick={(e) => handleAnchorClick(e, item.id)}
                                        className="text-gray-300 hover:text-white transition-colors"
                                    >
                                        {item.name}
                                    </a>
                                ))}
                            </nav>
                        </Container>
                    </div>
                )}
            </Container>
        </header>
    )
}

"use client"

import Image from 'next/image'
import { useEffect, useState } from 'react'
import Button from './ui/Button'
import Container from './ui/Container'

export default function Hero() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        setIsVisible(true)
    }, [])

    const scrollToContact = (e) => {
        e.preventDefault()
        const contactSection = document.getElementById('contact')

        if (contactSection) {
            // Get the navbar height dynamically
            const navbar = document.querySelector('header')
            const navbarHeight = navbar ? navbar.offsetHeight : 80

            // Calculate the target position with offset
            const targetPosition = contactSection.getBoundingClientRect().top + window.scrollY

            // Apply the offset and scroll
            window.scrollTo({
                top: targetPosition - navbarHeight - 20, // Added extra 20px for breathing room
                behavior: 'smooth'
            })
        }
    }


    return (
        <section id="hero" className="pt-32 pb-20 min-h-screen flex items-center">
            <Container>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                    <div className={`space-y-6 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
                        <p className="text-primary font-mono text-lg">Hello, I'm</p>
                        <h1 className="font-bold gradient-text">Zakaria Hossain Foysal</h1>
                        <h2 className="text-2xl md:text-3xl text-gray-300">Software Engineer with expertise in Blockchain Technology</h2>
                        <p className="text-lg max-w-xl">
                            I build innovative solutions using modern technologies including Blockchain,
                            Node.js, React, and Java. Specializing in developing secure, scalable applications
                            with a focus on blockchain integration.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <Button
                                href="#contact"
                                onClick={scrollToContact}
                            >
                                Contact Me
                            </Button>
                            <Button href="mailto:zakariahossain20@gmail.com" variant="outline">
                                <div className="flex items-center space-x-2">
                                    <Image src="/svg/mail.svg" alt="Email" width={20} height={20} />
                                    <span>Email</span>
                                </div>
                            </Button>
                        </div>

                        <div className="flex space-x-4 pt-2">
                            <a
                                href="https://github.com/xack20"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="GitHub"
                                className="flex items-center space-x-2 text-gray-300 bg-background/50 px-3 py-2 rounded-md hover:text-white hover:bg-gray-800 transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                                </svg>
                                <span>GitHub</span>
                            </a>

                            <a
                                href="https://www.linkedin.com/in/zakaria-hossain-b34446160/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="LinkedIn"
                                className="flex items-center space-x-2 text-gray-300 bg-background/50 px-3 py-2 rounded-md hover:text-white hover:bg-gray-800 transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                    <rect x="2" y="9" width="4" height="12"></rect>
                                    <circle cx="4" cy="4" r="2"></circle>
                                </svg>
                                <span>LinkedIn</span>
                            </a>
                        </div>
                    </div>
                    <div className={`justify-self-center lg:justify-self-end ${isVisible ? 'animate-slide-up delay-300' : 'opacity-0 translate-y-8'}`}>
                        <div className="relative w-72 h-72 md:w-96 md:h-96">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary blur-3xl opacity-20 animate-pulse"></div>
                            <div className="card bg-card/80 rounded-full overflow-hidden p-2 relative z-10">
                                <Image
                                    src="/images/profile.jpg"
                                    alt="Zakaria Hossain Foysal"
                                    width={400}
                                    height={400}
                                    className="rounded-full object-cover"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    )
}

"use client"

import { useEffect, useRef } from 'react'
import Card from './ui/Card'
import Container from './ui/Container'
import Section from './ui/Section'

export default function About() {
    const sectionRef = useRef(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-fade-in')
                        observer.unobserve(entry.target)
                    }
                })
            },
            { threshold: 0.1 }
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current)
            }
        }
    }, [])

    return (
        <Section id="about" className="bg-background/50">
            <Container>
                <div ref={sectionRef} className="animate-on-scroll">
                    <h2 className="text-center mb-16 gradient-text">About Me</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="lg:col-span-2">
                            <h3 className="text-2xl mb-4">Professional Journey</h3>
                            <p className="mb-4">
                                I'm a passionate Software Engineer with a strong focus on blockchain technology
                                and full-stack development. Currently working at KONA Software Lab Ltd, I've been
                                developing blockchain-based services for e-commerce platforms and leading API and UI
                                automation projects.
                            </p>
                            <p className="mb-4">
                                With a background in Computer Science and Engineering from Daffodil International University
                                (CGPA: 3.74/4.0), I combine strong theoretical knowledge with practical experience
                                in developing innovative solutions using modern technologies.
                            </p>
                            <p>
                                My expertise spans across blockchain technologies (Hyperledger Fabric, Ethereum),
                                backend development (Node.js, Spring Boot), frontend frameworks (React.js),
                                and database systems (PostgreSQL, MongoDB).
                            </p>
                        </Card>
                        <Card highlight={true}>
                            <h3 className="text-2xl mb-4">Education</h3>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xl text-primary">Bachelor of Science</h4>
                                    <p className="text-gray-300">Computer Science and Engineering</p>
                                    <p className="text-gray-400">Daffodil International University</p>
                                    <p className="text-gray-400">CGPA: 3.74/4.0</p>
                                    <p className="text-gray-500">Jan 2017 - Jan 2021</p>
                                </div>
                                <div>
                                    <h4 className="text-xl text-primary">Higher Secondary</h4>
                                    <p className="text-gray-300">BAF Shaheen College, Jashore</p>
                                    <p className="text-gray-400">GPA: 5.0/5.0</p>
                                    <p className="text-gray-500">Aug 2015</p>
                                </div>
                                <div>
                                    <h4 className="text-xl text-primary">Secondary</h4>
                                    <p className="text-gray-300">BAF Shaheen College, Jashore</p>
                                    <p className="text-gray-400">GPA: 5.0/5.0</p>
                                    <p className="text-gray-500">Apr 2013</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </Container>
        </Section>
    )
}

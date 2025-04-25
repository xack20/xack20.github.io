"use client"

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import Card from './ui/Card'
import Container from './ui/Container'
import Section from './ui/Section'

export default function Experience() {
    const sectionRef = useRef(null)
    const cardRefs = useRef([])

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

        // Observe each card with a delay for staggered animation
        cardRefs.current.forEach((card, index) => {
            if (card) {
                const cardObserver = new IntersectionObserver(
                    (entries) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting) {
                                // Add delay based on index
                                setTimeout(() => {
                                    entry.target.classList.add('animate-slide-up')
                                }, index * 200) // 200ms delay between each card
                                cardObserver.unobserve(entry.target)
                            }
                        })
                    },
                    { threshold: 0.1 }
                )

                cardObserver.observe(card)
            }
        })

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current)
            }

            cardRefs.current.forEach((card) => {
                if (card) {
                    observer.unobserve(card)
                }
            })
        }
    }, [])


    const experiences = [
        {
            company: "KONA Software Lab Ltd.",
            position: "Software Engineer",
            period: "July 2022 - Present",
            details: [
                "Developed a blockchain-based service for an e-commerce platform using Node.js, RabbitMQ, PostgreSQL, React.js, and Hyperledger Fabric",
                "Led API and UI automation project combining TestNG (Java), RestAssured, and Selenium",
                "Automated TestRail test case updates and configured Microsoft Teams test report notifications"
            ],
            icon: "/svg/blockchain.svg"
        },
        {
            company: "BJIT Ltd.",
            position: "Software Engineer",
            period: "Apr 2021 - May 2022",
            details: [
                "Conducted research and development in blockchain technology with Hyperledger Fabric and Ethereum",
                "Developed applications using Spring Boot and React.js"
            ],
            icon: "/svg/code.svg"
        },
        {
            company: "Semicolon IT Solutions",
            position: "Web Developer",
            period: "Feb 2021 - Mar 2021",
            details: [
                "Developed web applications using React.js and Node.js",
                "Implemented Ant Design (Antd) components",
                "Managed databases using MongoDB and PostgreSQL"
            ],
            icon: "/svg/web.svg"
        }
    ]

    return (
        <Section id="experience">
            <Container>
                <div ref={sectionRef} className="animate-on-scroll">
                    <h2 className="text-center mb-16 gradient-text">Professional Experience</h2>
                    <div className="space-y-8">
                        {experiences.map((exp, index) => (
                            <Card key={index} className="relative">
                                <div className="absolute top-6 left-6 -mt-12 -ml-12 bg-card rounded-full p-4 border border-gray-700 hidden lg:block">
                                    <Image src={exp.icon} alt={exp.company} width={40} height={40} />
                                </div>
                                <div className="lg:pl-12">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                                        <div>
                                            <h3 className="text-2xl text-primary">{exp.position}</h3>
                                            <h4 className="text-xl text-gray-300">{exp.company}</h4>
                                        </div>
                                        <div className="bg-background/50 px-4 py-2 rounded-full text-gray-400 text-sm mt-2 md:mt-0 inline-block">
                                            {exp.period}
                                        </div>
                                    </div>
                                    <ul className="space-y-2 list-disc list-inside">
                                        {exp.details.map((detail, idx) => (
                                            <li key={idx} className="text-gray-300">{detail}</li>
                                        ))}
                                    </ul>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </Container>
        </Section>
    )
}

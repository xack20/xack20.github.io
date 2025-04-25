"use client"

import { useEffect, useRef } from 'react'
import Card from './ui/Card'
import Container from './ui/Container'
import Section from './ui/Section'

export default function Skills() {
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


    const skillCategories = [
        {
            name: "Programming Languages",
            skills: ["C/C++", "Python", "Java", "JavaScript", "Bash Script", "Go", "Solidity"]
        },
        {
            name: "Web Development",
            skills: ["React.js", "Node.js", "Spring Boot", "HTML/CSS", "Ant Design"]
        },
        {
            name: "Blockchain",
            skills: ["Hyperledger Fabric", "Ethereum", "Smart Contracts", "Chaincode Development"]
        },
        {
            name: "Database Systems",
            skills: ["PostgreSQL", "MongoDB", "Sequelize ORM"]
        },
        {
            name: "DevOps & Tools",
            skills: ["Git", "Jenkins", "Linux", "SSH", "VS Code", "JetBrains IDEs"]
        },
        {
            name: "Testing",
            skills: ["Jest", "TestNG", "RestAssured", "Selenium", "TestRail"]
        }
    ]

    const competitiveInfo = {
        description: "I've solved 2000+ Data Structure and Algorithmic problems in several Online Judges using C++ and Python.",
        platforms: [
            { name: "Codeforces", count: "800+ problems" },
            { name: "URI", count: "250+ problems" },
            { name: "UVA", count: "100+ problems" },
            { name: "Atcoder", count: "100+ problems" },
            { name: "Codechef", count: "50+ problems" },
            { name: "LeetCode", count: "100+ problems" }
        ]
    }

    return (
        <Section id="skills">
            <Container>
                <div ref={sectionRef} className="animate-on-scroll">
                    <h2 className="text-center mb-16 gradient-text">Skills & Expertise</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {skillCategories.map((category, index) => (
                            <Card key={index}>
                                <h3 className="text-xl font-semibold text-primary mb-4">{category.name}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {category.skills.map((skill, idx) => (
                                        <span
                                            key={idx}
                                            className="text-sm bg-background/70 text-gray-300 px-3 py-1 rounded-full"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>

                    <Card highlight={true}>
                        <h3 className="text-xl font-semibold text-primary mb-4">Competitive Programming</h3>
                        <p className="text-gray-300 mb-4">{competitiveInfo.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {competitiveInfo.platforms.map((platform, idx) => (
                                <div key={idx} className="text-center p-3 bg-background/50 rounded-lg">
                                    <h4 className="text-lg font-medium text-white">{platform.name}</h4>
                                    <p className="text-gray-400">{platform.count}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </Container>
        </Section>
    )
}

"use client"

import { useEffect, useRef, useState } from 'react'
import Container from './ui/Container'
import Section from './ui/Section'

export default function Projects() {
    const sectionRef = useRef(null)
    const [selectedProject, setSelectedProject] = useState("Blockchain Gateway")

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

    const projects = [
        {
            "title": "Human Resource Management System",
            "description": "A comprehensive web application for managing HR processes including employee profiles, attendance tracking, leave management, payroll, and performance evaluations.",
            "technologies": ["Java", "Spring Boot", "JavaScript", "Maven", "MySQL"],
            "icon": "code",
            "github": "https://github.com/xack20/Human-Resource-Management-System",
        },
        {
            "title": "Document Sharing Platform",
            "description": "A blockchain-based document sharing platform that utilizes Hyperledger Fabric for secure, immutable document management and verification.",
            "technologies": ["Java", "Spring Boot", "Hyperledger Fabric", "JavaScript", "React", "Blockchain"],
            "icon": "article",
            "github": "https://github.com/xack20/BIPV-DOC-SHARING",
        },
        {
            title: "OnlineJudges's Solution Extractor",
            description: "A console-based application that extracts/downloads AC solutions from online judges like Codeforces and URI.",
            technologies: ["Python", "API", "JSON", "BeautifulSoup"],
            icon: "code",
            github: "https://github.com/xack20/OJ-s_Solution_Extractor",
        },
        {
            title: "Hide Your Message",
            description: "A messaging application where messages are compressed with Huffman coding algorithm, using Firebase for hosting and real-time database.",
            technologies: ["React", "JavaScript", "Ant Design", "Firebase"],
            icon: "web",
            github: "https://github.com/xack20/HideYourMessage",
        }
    ]

    // Helper function to render icon
    const renderIcon = (iconName) => {
        switch (iconName) {
            case 'blockchain':
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="10" rx="2" ry="2"></rect>
                        <line x1="16" y1="21" x2="16" y2="21"></line>
                        <line x1="8" y1="21" x2="8" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                        <path d="M6 11h.01M10 11h.01M14 11h.01M18 11h.01"></path>
                    </svg>
                );
            case 'code':
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6"></polyline>
                        <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                );
            case 'web':
            default:
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                );
        }
    };

    return (
        <Section id="projects" className="bg-background/50">
            <Container>
                <div ref={sectionRef} className="animate-on-scroll">
                    <h2 className="text-center mb-16 gradient-text">Projects</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {projects.map((project, index) => (
                            <div
                                key={index}
                                className={`bg-[#111b33] border border-[#1e293b] rounded-lg overflow-hidden ${selectedProject === project.title ? 'border-[#3b82f6]' : 'border-[#1e293b]'
                                    }`}
                                onClick={() => setSelectedProject(project.title)}
                            >
                                <div className="p-6">
                                    <div className="flex items-start mb-4">
                                        <div className={`p-2 rounded-lg mr-3 ${project.icon === 'blockchain' ? 'text-[#3b82f6]' :
                                            project.icon === 'web' ? 'text-[#38bdf8]' :
                                                'text-[#10b981]'
                                            }`}>
                                            {renderIcon(project.icon)}
                                        </div>
                                        <h3 className={`p-2 text-xl font-semibold ${project.icon === 'blockchain' ? 'text-[#3b82f6]' :
                                            project.icon === 'web' ? 'text-[#38bdf8]' :
                                                project.icon === 'code' ? 'text-[#10b981]' :
                                                    'text-[#8b5cf6]'
                                            }`}>{project.title}</h3>
                                    </div>
                                    <p className="text-gray-300 mb-4">{project.description}</p>

                                    <div className="flex flex-wrap gap-1 mb-6">
                                        {project.technologies.map((tech, idx) => (
                                            <span
                                                key={idx}
                                                className="text-xs bg-[#0a1121] text-gray-400 px-2 py-1 rounded-md"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>

                                    <a
                                        href={project.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 rounded-lg bg-[#1d4ed8] text-white hover:bg-[#1e40af] transition-colors"
                                    >
                                        <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                                        </svg>
                                        View on GitHub
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Container>
        </Section>
    )
}

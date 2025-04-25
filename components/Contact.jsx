"use client"

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import Button from './ui/Button'
import Card from './ui/Card'
import Container from './ui/Container'
import Section from './ui/Section'

export default function Contact() {
    const sectionRef = useRef(null)
    const [formState, setFormState] = useState({
        name: '',
        email: '',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitMessage, setSubmitMessage] = useState(null)

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


    const handleChange = (e) => {
        const { name, value } = e.target
        setFormState(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Simulate form submission
        setTimeout(() => {
            setIsSubmitting(false)
            setSubmitMessage({
                type: 'success',
                text: 'Thanks for your message! I\'ll get back to you soon.'
            })

            // Reset form
            setFormState({
                name: '',
                email: '',
                message: ''
            })

            // Clear success message after 5 seconds
            setTimeout(() => {
                setSubmitMessage(null)
            }, 5000)
        }, 1500)
    }

    const contactInfo = [
        {
            icon: "/svg/mail.svg",
            label: "Email",
            value: "zakariahossain20@gmail.com",
            link: "mailto:zakariahossain20@gmail.com"
        },
        {
            icon: "/svg/github.svg",
            label: "GitHub",
            value: "github.com/xack20",
            link: "https://github.com/xack20"
        },
        {
            icon: "/svg/linkedin.svg",
            label: "LinkedIn",
            value: "Connect on LinkedIn",
            link: "https://www.linkedin.com/in/zakaria-hossain-b34446160/"
        }
    ]

    return (
        <Section id="contact" className="bg-background/50">
            <Container>
                <div ref={sectionRef} className="animate-on-scroll">
                    <h2 className="text-center mb-16 gradient-text">Get In Touch</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card>
                            <h3 className="text-2xl font-semibold mb-6">Contact Information</h3>
                            <div className="space-y-6">
                                {contactInfo.map((info, index) => (
                                    <a
                                        key={index}
                                        href={info.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-4 text-gray-300 hover:text-white transition-colors"
                                    >
                                        <div className="bg-card rounded-full p-3">
                                            <Image src={info.icon} alt={info.label} width={24} height={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">{info.label}</p>
                                            <p className="font-medium">{info.value}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>

                            <div className="mt-8 pt-8 border-t border-gray-700">
                                <h3 className="text-xl font-semibold mb-4">Phone</h3>
                                <p className="text-gray-300">(+88) 01753732016</p>
                            </div>
                        </Card>

                        <Card>
                            <h3 className="text-2xl font-semibold mb-6">Send a Message</h3>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
                                        Your Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formState.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 bg-background border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                                        Your Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formState.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 bg-background border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-400 mb-1">
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formState.message}
                                        onChange={handleChange}
                                        required
                                        rows={4}
                                        className="w-full px-4 py-2 bg-background border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white resize-none"
                                    ></textarea>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full flex justify-center"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Message'}
                                </Button>

                                {submitMessage && (
                                    <div className={`p-3 rounded ${submitMessage.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                        {submitMessage.text}
                                    </div>
                                )}
                            </form>
                        </Card>
                    </div>
                </div>
            </Container>
        </Section>
    )
}

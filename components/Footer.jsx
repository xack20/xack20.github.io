import Image from 'next/image'
import Link from 'next/link'
import Container from './ui/Container'

export default function Footer() {
    const currentYear = new Date().getFullYear()

    const navItems = [
        { name: 'About', href: '#about' },
        { name: 'Experience', href: '#experience' },
        { name: 'Projects', href: '#projects' },
        { name: 'Skills', href: '#skills' },
        { name: 'Contact', href: '#contact' },
    ]

    const socialLinks = [
        { name: 'GitHub', href: 'https://github.com/xack20', icon: '/svg/github.svg' },
        { name: 'LinkedIn', href: 'https://www.linkedin.com/in/zakaria-hossain-b34446160/', icon: '/svg/linkedin.svg' },
        { name: 'Email', href: 'mailto:zakariahossain20@gmail.com', icon: '/svg/mail.svg' },
    ]

    return (
        <footer className="bg-background pt-16 pb-8">
            <Container>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <Image src="/svg/logo.svg" alt="Logo" width={40} height={40} />
                            <span className="text-xl font-bold">Zakaria Hossain</span>
                        </div>
                        <p className="text-gray-400 mb-6">
                            Software Engineer specializing in Blockchain Technology and Full-Stack Development.
                        </p>
                        <div className="flex space-x-4">
                            {socialLinks.map((link, index) => (
                                <a
                                    key={index}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-card/50 hover:bg-primary/20 p-2 rounded-full transition-colors"
                                    aria-label={link.name}
                                >
                                    <Image src={link.icon} alt={link.name} width={20} height={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            {navItems.map((item, index) => (
                                <li key={index}>
                                    <Link
                                        href={item.href}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-4">Contact</h4>
                        <p className="text-gray-400 mb-2">zakariahossain20@gmail.com</p>
                        <p className="text-gray-400">(+88) 01753732016</p>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 text-center text-gray-500">
                    <p>© {currentYear} Zakaria Hossain Foysal. All rights reserved.</p>
                </div>
            </Container>
        </footer>
    )
}

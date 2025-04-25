/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    output: 'export',
    // If deploying to a GitHub project page (username.github.io/repo-name)
    basePath: '/xack20.github.io', // Replace with your actual repo name
    images: {
      unoptimized: true, // Required for static export
    },
}

module.exports = nextConfig

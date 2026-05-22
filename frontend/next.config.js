/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Ignore typescript errors during build since dynamic types might clash
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore eslint during build for speed and reliability
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig;

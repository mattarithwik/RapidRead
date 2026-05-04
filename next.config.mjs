/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  turbopack: {
    root: process.cwd()
  }
};

export default nextConfig;

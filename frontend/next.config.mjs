/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "images.unsplash.com",
      "illustrations.popsy.co",
      "avatars.githubusercontent.com",
      "api.dicebear.com"
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.NEXT_PUBLIC_BACKEND_URL
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/:path*`
          : "http://localhost:5000/api/:path*",
      },
    ];
  },
};

export default nextConfig;

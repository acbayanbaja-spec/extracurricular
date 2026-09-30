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
    const backendTarget = (process.env.NEXT_PUBLIC_API_URL || "https://extracurricular-sc5rlfdq.b4a.run/api").replace(/\/$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${backendTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;

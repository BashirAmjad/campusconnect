/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pg"],
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
};
export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: [
    "@clearpill/db",
    "@clearpill/planning-core",
    "@clearpill/planning-service",
  ],
};

export default nextConfig;

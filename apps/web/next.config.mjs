/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    turbo: {
      rules: {
        "@prisma/client": {
          sideEffects: false
        }
      }
    }
  },
  output: 'standalone'
};

export default nextConfig;

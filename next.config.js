/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Suppress warnings from Lighthouse's dynamic imports
    config.module.exprContextCritical = false;
    
    // Ignore specific warnings from lighthouse modules
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /Critical dependency: Accessing import\.meta directly is unsupported/,
    ];
    
    return config;
  },
}

module.exports = nextConfig
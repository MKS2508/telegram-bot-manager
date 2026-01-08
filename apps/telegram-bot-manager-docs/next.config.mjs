import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,

  // GitHub Pages configuration
  basePath: '/telegram-bot-manager',
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Ensure trailing slash for GitHub Pages
  trailingSlash: true,
};

export default withMDX(config);

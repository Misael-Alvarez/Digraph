import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* The dev overlay badge sits bottom-left, exactly where the zoom controls
     live, and swallows clicks on them. Nothing in development needs it there. */
  devIndicators: false,
};

export default nextConfig;

/** Browser calls /api/estimator/* and /api/market/* on this origin; Next proxies them to the backends. */
const ESTIMATOR = process.env.ESTIMATOR_API_URL ?? "http://localhost:8001";
const MARKET = process.env.MARKET_API_URL ?? "http://localhost:8002";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/api/estimator/:path*", destination: `${ESTIMATOR}/api/:path*` },
      { source: "/api/market/:path*", destination: `${MARKET}/api/market/:path*` },
    ];
  },
};

export default nextConfig;

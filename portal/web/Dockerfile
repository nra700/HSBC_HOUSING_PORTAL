FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
# Rewrites are baked in at build time, so pass the in-network backend URLs here.
ARG ESTIMATOR_API_URL=http://estimator-api:8001
ARG MARKET_API_URL=http://market-api:8002
ENV ESTIMATOR_API_URL=$ESTIMATOR_API_URL MARKET_API_URL=$MARKET_API_URL
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]

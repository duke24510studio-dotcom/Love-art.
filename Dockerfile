FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig.json next.config.ts postcss.config.mjs ./
COPY public ./public
COPY src ./src

ENV DATABASE_URL="file:./dev.db"
RUN npx prisma generate \
  && npx prisma migrate deploy \
  && npm run build

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL="file:/data/dev.db"
ENV OUTPUT_DIR="/data/outputs"

EXPOSE 3000

CMD ["sh", "-c", "mkdir -p /data/outputs/images && npx prisma migrate deploy && npm start"]

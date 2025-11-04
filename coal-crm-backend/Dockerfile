FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm install --only=production

COPY src ./src
COPY .env.example ./.env.example

# Create data directory for SQLite
RUN mkdir -p /app/data
VOLUME ["/app/data"]

ENV PORT=4000
EXPOSE 4000

CMD ["node", "src/index.js"]


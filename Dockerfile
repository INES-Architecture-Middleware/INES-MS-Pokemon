# Étape de build
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Étape finale
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app .

# Variables d'environnement par défaut
ENV PORT=3000
ENV REDIS_URL=redis://redis:6379

EXPOSE $PORT
CMD ["node", "src/index.js"]
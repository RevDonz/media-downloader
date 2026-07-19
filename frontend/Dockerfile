# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Rewrite /api → backend dibake saat build (Next mengevaluasi rewrites di build-time).
# Di produksi nginx juga meneruskan /api langsung ke backend, jadi ini cadangan.
ARG BACKEND_URL=http://backend:8000
ENV BACKEND_URL=$BACKEND_URL
RUN npm run build

# ---- runtime ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV BACKEND_URL=http://backend:8000
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "run", "start"]

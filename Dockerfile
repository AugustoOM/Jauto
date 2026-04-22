# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY . .

RUN corepack enable pnpm && pnpm install --frozen-lockfile

RUN pnpm run build --filter=@jauto/web

# Production stage
FROM nginx:alpine

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
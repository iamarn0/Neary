FROM node:22-alpine AS client
WORKDIR /src
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
ARG VITE_API_URL=/api
ARG VITE_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
ARG VITE_ROUTING_URL=https://router.project-osrm.org
ENV VITE_API_URL=$VITE_API_URL \
    VITE_MAP_STYLE_URL=$VITE_MAP_STYLE_URL \
    VITE_ROUTING_URL=$VITE_ROUTING_URL
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server ./
COPY --from=client /src/dist /app/client/dist
RUN mkdir -p uploads && chown -R node:node /app
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]

# ---- build ----
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

# normaliza saída (funciona com dist/APP/browser ou dist/APP)
RUN mkdir -p /out && \
    sh -c 'd=$(find dist -mindepth 1 -maxdepth 1 -type d | head -n1); \
           if [ -d "$d/browser" ]; then cp -r "$d/browser/." /out/; \
           else cp -r "$d/." /out/; fi'

# ---- serve ----
FROM nginx:stable
COPY --from=build /out/ /usr/share/nginx/html
RUN sed -i 's/try_files $uri $uri\/ =404;/try_files $uri $uri\/ \/index.html;/' /etc/nginx/conf.d/default.conf
EXPOSE 80
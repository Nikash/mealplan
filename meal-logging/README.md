# Meal Log

A family meal logging web app built with Next.js. Data is stored on the filesystem via a lightweight API, so it persists across browsers and survives container restarts when using Docker.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000/mealplan](http://localhost:3000/mealplan). The app is mounted at `/mealplan` so it can sit behind a path-preserving reverse proxy. To serve from domain root instead:

```bash
NEXT_PUBLIC_BASE_PATH= npm run dev
```

Data is written to `./data/meal-logging-data.json` in the project directory.

## Docker (Raspberry Pi)

The image uses `node:20-alpine`, which supports ARM64 (Raspberry Pi 3/4/5 and Pi Zero 2 W).

### Build on the Pi

From the `meal-logging` directory:

```bash
docker build -t meal-logging .
```

### Build for the Pi from another machine

Use Docker's platform flag to cross-build for ARM64:

```bash
docker build --platform linux/arm64 -t meal-logging .
```

### Run

Mount a host directory to `/data` so meal logs persist outside the container:

```bash
docker run -d \
  --name meal-logging \
  -p 3000:3000 \
  -v meal-logging-data:/data \
  --restart unless-stopped \
  meal-logging
```

Open [http://localhost:3000/mealplan](http://localhost:3000/mealplan) (or `http://<pi-ip-address>:3000/mealplan` from another device on your network).

To serve from `/` instead of `/mealplan`:

```bash
docker build --build-arg NEXT_PUBLIC_BASE_PATH= -t meal-logging .
```

### nginx reverse proxy

The app expects nginx to **keep** the `/mealplan` prefix (no URI on `proxy_pass`). This is the working location block:

```nginx
location /mealplan {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_redirect off;
}
```

A copy lives in `nginx.mealplan.conf`.

Do **not** put a URI on `proxy_pass`. This strips `/mealplan` so Next.js never sees the prefix (404, or a redirect loop if it tries to add `/mealplan` back):

```nginx
location /mealplan/ {
    proxy_pass http://127.0.0.1:3000/;
}
```

`skipTrailingSlashRedirect` also stops the other common loop: nginx `location /mealplan/` 301s `/mealplan` → `/mealplan/` while Next.js 308s the slash the other way.

Rebuild the image after changing `NEXT_PUBLIC_BASE_PATH`; `basePath` is inlined at build time.

### Useful commands

```bash
# View logs
docker logs -f meal-logging

# Stop and remove the container
docker stop meal-logging && docker rm meal-logging

# Remove persisted data (careful — this deletes all meal logs)
docker volume rm meal-logging-data
```

### Data location

Inside the container, data is stored at `/data/meal-logging-data.json`. With the volume mount above, Docker keeps that file in the `meal-logging-data` volume on the host.

## Production build (without Docker)

```bash
npm run build
DATA_DIR=./data npm start
```

Then open [http://localhost:3000/mealplan](http://localhost:3000/mealplan).

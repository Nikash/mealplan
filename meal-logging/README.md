# Meal Log

A family meal logging web app built with Next.js. Data is stored on the filesystem via a lightweight API, so it persists across browsers and survives container restarts when using Docker.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Data is written to `./data/meal-logging-data.json` in the project directory.

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

Open [http://localhost:3000](http://localhost:3000) (or `http://<pi-ip-address>:3000` from another device on your network).

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

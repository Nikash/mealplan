#!/usr/bin/env bash
set -euo pipefail

# Git Bash otherwise rewrites "/mealplan" to "C:/Program Files/Git/mealplan"
# when invoking Win32 binaries such as docker.exe.
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL='*'

# Build meal-logging, scp the image to a remote host, then replace any running container.
#
# Usage:
#   ./deploy.sh
#   ./deploy.sh user@hostname
#
# Optional env:
#   PLATFORM        auto-detected from the remote host (uname -m)
#   IMAGE_NAME      default meal-logging
#   CONTAINER_NAME  default meal-logging
#   PORT            default 3000
#   VOLUME_NAME     default meal-logging-data
#   NEXT_PUBLIC_BASE_PATH  default /mealplan (baked into the image at build time)

IMAGE_NAME="${IMAGE_NAME:-meal-logging}"
CONTAINER_NAME="${CONTAINER_NAME:-meal-logging}"
PORT="${PORT:-3000}"
VOLUME_NAME="${VOLUME_NAME:-meal-logging-data}"
NEXT_PUBLIC_BASE_PATH="${NEXT_PUBLIC_BASE_PATH:-/mealplan}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ $# -ge 1 ]]; then
  HOST="$1"
else
  read -rp "Remote host (user@hostname): " HOST
fi

if [[ -z "${HOST}" ]]; then
  echo "Remote host is required." >&2
  exit 1
fi

# GitHub masks the full DEPLOY_HOST secret, but ssh/scp often print the hostname
# without the user@ prefix. Keep that out of CI logs; local deploys still show it.
if [[ "${GITHUB_ACTIONS:-}" == "true" ]]; then
  HOST_LABEL="remote host"
  SSH_OPTS=(-o LogLevel=ERROR -o BatchMode=yes)
  SCP_OPTS=(-q -o LogLevel=ERROR -o BatchMode=yes)
else
  HOST_LABEL="$HOST"
  SSH_OPTS=()
  SCP_OPTS=()
fi

platform_from_arch() {
  case "$1" in
    aarch64|arm64) echo "linux/arm64" ;;
    armv7l|armhf) echo "linux/arm/v7" ;;
    armv6l) echo "linux/arm/v6" ;;
    x86_64|amd64) echo "linux/amd64" ;;
    i386|i686) echo "linux/386" ;;
    *)
      echo "Unsupported remote architecture: $1" >&2
      exit 1
      ;;
  esac
}

if [[ -z "${PLATFORM:-}" ]]; then
  echo "Detecting architecture on ${HOST_LABEL}..."
  REMOTE_ARCH="$(ssh "${SSH_OPTS[@]}" "$HOST" uname -m)"
  PLATFORM="$(platform_from_arch "$REMOTE_ARCH")"
  echo "Remote uname -m is ${REMOTE_ARCH}; building for ${PLATFORM}."
else
  echo "Using PLATFORM=${PLATFORM}."
fi

TAR_FILE="${TMPDIR:-/tmp}/${IMAGE_NAME}.tar.gz"
REMOTE_TAR="/tmp/${IMAGE_NAME}.tar.gz"

cleanup() {
  rm -f "$TAR_FILE"
}
trap cleanup EXIT

echo "Building ${IMAGE_NAME} for ${PLATFORM}..."
# Provenance/SBOM attestations wrap the image in a manifest list that Docker 19.x
# on Raspberry Pi OS cannot load correctly. --load writes a single-platform image.
# Single-line invoke so Git Bash/CRLF cannot break backslash continuations.
docker buildx build --platform "$PLATFORM" --build-arg "NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}" --provenance=false --sbom=false --load -t "$IMAGE_NAME" .

echo "Saving image to ${TAR_FILE}..."
docker save "$IMAGE_NAME" | gzip > "$TAR_FILE"

echo "Copying image to ${HOST_LABEL}:${REMOTE_TAR}..."
scp "${SCP_OPTS[@]}" "$TAR_FILE" "${HOST}:${REMOTE_TAR}"

echo "Loading image and restarting container on ${HOST_LABEL}..."
ssh "${SSH_OPTS[@]}" "$HOST" bash -s <<REMOTE
set -euo pipefail
docker load -i ${REMOTE_TAR}
rm -f ${REMOTE_TAR}
docker rm -f ${CONTAINER_NAME} >/dev/null 2>&1 || true
docker run -d \\
  --name ${CONTAINER_NAME} \\
  -p ${PORT}:3000 \\
  -v ${VOLUME_NAME}:/data \\
  --restart unless-stopped \\
  ${IMAGE_NAME}
REMOTE

echo "Deployed ${IMAGE_NAME} to ${HOST_LABEL} on port ${PORT}."

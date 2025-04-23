# Build our Pocketbase executable with our 
# custom routes, etc.
# Output will be a `lynxapp` executable in /app
FROM golang:1.24 AS backend-builder
WORKDIR /app
# deps first, for caching on subsequent builds
COPY backend/go.mod backend/go.sum ./
RUN go mod download && go mod verify
COPY backend/ ./
RUN CGO_ENABLED=0 go build -o lynxapp main.go

# Build our React SPA frontend. We use Vite and 
# it outputs a static site in /app/dist
FROM node:20 AS frontend-builder
WORKDIR /app
# deps first, for caching on subsequent builds
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM alpine:3.20
WORKDIR /app

COPY --from=backend-builder /app/lynxapp .

RUN mkdir pb_public
COPY --from=frontend-builder /app/dist/ ./pb_public/

RUN mkdir pb_data
VOLUME pb_data

EXPOSE 8080
CMD ["./lynxapp", "serve", "--http=0.0.0.0:8080"]

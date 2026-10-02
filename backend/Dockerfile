# Multi-stage build to a distroless image. The whole dataset is a single
# committed JSON file, so the runtime image needs the executable and that file
# — no database, no migrations.
FROM golang:1.24-alpine AS build
WORKDIR /src
RUN apk add --no-cache git ca-certificates
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/server ./src

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/server /server
COPY --from=build /src/data/ /data/
ENV DATA_FILE=/data/lamine.json
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/server"]

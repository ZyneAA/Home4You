# Docker Setup

This project is containerized using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

1. **Create a `.env` file** in the project root with all required environment variables (see `src/shared/validations/env.validation.mts` for the complete list).

   Required variables:
   - `DATABASE_URL` (defaults to `mongodb://mongo:27017/home4you` in docker-compose)
   - `DATABASE_REPLICA_SET` (defaults to `rs0` in docker-compose)
   - `REDIS_URL` (defaults to `redis://redis:6379` in docker-compose)
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `SMTP_HOST`
   - `SMTP_USER`
   - `SMTP_PASS`

2. **Build and start all services:**

   ```bash
   docker-compose up -d
   ```

3. **View logs:**

   ```bash
   docker-compose logs -f app
   ```

4. **Stop all services:**

   ```bash
   docker-compose down
   ```

5. **Stop and remove volumes (clean slate):**
   ```bash
   docker-compose down -v
   ```

## Services

- **app**: The main application (port 8000 by default)
- **mongo**: MongoDB database (port 27017 by default)
- **mongo-init**: One-time initialization service for MongoDB replica set
- **redis**: Redis cache (port 6379 by default)

## Building the Image

To build the Docker image separately:

```bash
docker build -t home4you:latest .
```

## Development

For development, you may want to mount the source code as a volume. Modify `docker-compose.yml` to add:

```yaml
volumes:
  - ./src:/app/src:ro
  - ./package.json:/app/package.json:ro
```

Note: The application runs the built version from the `build/` directory, so you'll need to rebuild or use a development setup.

## Environment Variables

All environment variables can be set in a `.env` file or passed directly to `docker-compose up`. The `docker-compose.yml` file provides sensible defaults for local development.

## Health Checks

- The app service includes a health check that pings `/health`
- MongoDB and Redis have health checks to ensure they're ready before the app starts

## Troubleshooting

- **MongoDB replica set not initialized**: The `mongo-init` service runs once to initialize the replica set. If it fails, you can manually run:

  ```bash
  docker-compose exec mongo mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"
  ```

- **Port conflicts**: If ports 8000, 27017, or 6379 are already in use, modify the port mappings in `docker-compose.yml` or set `PORT`, `MONGO_PORT`, or `REDIS_PORT` in your `.env` file.

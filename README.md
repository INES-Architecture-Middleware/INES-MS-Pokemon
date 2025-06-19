# Pokemon Microservice

## `.env` File Configuration

Create a `.env` file at the root of the project with the following content:

```env
PORT=3001
REDIS_URL=redis://localhost:6379
CACHE_TTL=86400
CACHE_REFRESH_HOURS=72
REDIS_HOST=redis
PAGINATION_SIZE=50
```

## Start the Redis Server

Make sure the Redis service is enabled and started:

```bash
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

## Start with Docker Compose

To launch the service with Docker Compose, run the following command at the root of the project:

```bash
docker-compose up -d --build
```

This will build and start the containers in the background.
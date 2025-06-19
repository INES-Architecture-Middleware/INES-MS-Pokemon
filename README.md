# Pokemon Microservice

## `.env` File Configuration

Create a `.env` file at the root of the project with the following content:

```env
REDIS_URL=redis://localhost:6379
CACHE_TTL=86400
CACHE_REFRESH_HOURS=72
```

## Start the Redis Server

Make sure the Redis service is enabled and started:

```bash
sudo systemctl enable redis-server
sudo systemctl start redis-server
```
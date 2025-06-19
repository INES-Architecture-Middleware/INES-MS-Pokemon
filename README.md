# Pokemon Microservice

## Configuration du fichier `.env`

Créez un fichier `.env` à la racine du projet avec le contenu suivant :

```env
REDIS_URL=redis://localhost:6379
CACHE_TTL=86400
```

## Démarrer le serveur Redis

Assurez-vous que le service Redis est activé et démarré :

```bash
sudo systemctl enable redis-server
sudo systemctl start redis-server
```
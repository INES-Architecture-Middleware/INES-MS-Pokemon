const dotenv = require("dotenv")
const express = require("express")
const { initializeCache } = require('./cache');
const redisService = require('./redis.service.js');
const PokemonController = require("./controllers/PokemonController");
const PokemonRouter = require("./routers/PokemonRouter");

(async () => {
    dotenv.config()

    const app = express();

    app.use(express.json());
    const PORT = process.env.PORT || 3001;

    initializeCache();

    process.on('SIGTERM', async () => {
        await redisService.client.quit();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        await redisService.client.quit();
        process.exit(0);
    });

    const pokemonController = new PokemonController();
    app.use("/pokemon", new PokemonRouter(pokemonController).router);

    app.listen(PORT, () => {
        console.log(`Serveur démarré sur http://localhost:${PORT}`);
    });
})()

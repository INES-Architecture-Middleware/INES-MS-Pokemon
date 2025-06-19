require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const { initializeCache, loadAllPokemonData } = require('./cache');
const redisService = require('./redis.service');

const PORT = process.env.PORT || 3000;

app.use(express.json());




initializeCache();

app.get('/pokemon/all', async (req, res) => {
    try {
        const cachedData = await redisService.get('pokemon:all');
        if (cachedData) {
            const allPokemon = JSON.parse(cachedData);
            res.json(Object.values(allPokemon));
        } else {
            res.status(503).json({ error: "Données non encore chargées" });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/pokemon/:id', async (req, res) => {
    try {
        const pokemonId = req.params.id;
        const cachedData = await redisService.get('pokemon:all');

        if (cachedData) {
            const allPokemon = JSON.parse(cachedData);
            const pokemonData = allPokemon[pokemonId];
            
            if (pokemonData) {
                res.json(pokemonData);
            } else {
                res.status(404).json({ error: "Pokémon non trouvé" });
            }
        } else {
            res.status(503).json({ error: "Données non encore chargées" });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/pokemon/reload-cache', async (req, res) => {
    try {
        await loadAllPokemonData();
        res.json({ message: "Cache rechargé avec succès" });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors du rechargement" });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
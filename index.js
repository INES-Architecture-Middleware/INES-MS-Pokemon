require('dotenv').config();
const express = require('express');
const axios = require('axios');
const redis = require('redis');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration Redis
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect();

// Middleware pour parser le JSON
app.use(express.json());

// Fonction pour obtenir les noms français
const getFrenchName = (names) => {
    if (!names) return null;
    const frenchEntry = names.find(entry => entry.language.name === 'fr');
    return frenchEntry ? frenchEntry.name : null;
};

// Chargement initial des données dans Redis
const loadAllPokemonData = async () => {
    try {
        console.log('Début du chargement des données Pokémon...');
        
        // Récupérer la liste complète
        const listResponse = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=1302');
        const pokemonList = listResponse.data.results;
        
        // Pour chaque Pokémon, récupérer les données complètes
        const allPokemonData = {};
        
        for (const [index, pokemon] of pokemonList.entries()) {
            try {
                const pokemonResponse = await axios.get(pokemon.url);
                const speciesResponse = await axios.get(pokemonResponse.data.species.url);
                
                // Formatage des données
                allPokemonData[pokemonResponse.data.id] = {
                    id: pokemonResponse.data.id,
                    names: {
                        fr: getFrenchName(speciesResponse.data.names),
                        en: speciesResponse.data.name
                    },
                    sprites: {
                        front_default: pokemonResponse.data.sprites.front_default,
                        official_artwork: pokemonResponse.data.sprites.other['official-artwork']?.front_default
                    },
                    color: {
                        fr: getFrenchName(speciesResponse.data.color?.names),
                        en: speciesResponse.data.color?.name
                    },
                    generation: speciesResponse.data.generation?.name.replace('generation-', ''),
                    weight: pokemonResponse.data.weight / 10,
                    height: pokemonResponse.data.height / 10,
                    stats: {
                        hp: pokemonResponse.data.stats[0]?.base_stat,
                        attack: pokemonResponse.data.stats[1]?.base_stat,
                        defense: pokemonResponse.data.stats[2]?.base_stat,
                        special_attack: pokemonResponse.data.stats[3]?.base_stat,
                        special_defense: pokemonResponse.data.stats[4]?.base_stat,
                        speed: pokemonResponse.data.stats[5]?.base_stat
                    },
                    types: pokemonResponse.data.types.map(type => ({
                        fr: getFrenchName(type.type?.names),
                        en: type.type?.name
                    })),
                    // Autres données...
                };
                
                // Mise à jour périodique dans Redis pour éviter les timeouts
                if (index % 50 === 0) {
                    await redisClient.set('pokemon:all', JSON.stringify(allPokemonData));
                    console.log(`Pokémons chargés: ${index + 1}/${pokemonList.length}`);
                }
            } catch (error) {
                console.error(`Erreur sur le Pokémon ${pokemon.url}:`, error.message);
            }
        }
        
        // Sauvegarde finale dans Redis
        await redisClient.set('pokemon:all', JSON.stringify(allPokemonData));
        console.log('Tous les Pokémon ont été chargés avec succès dans Redis!');
        
        return allPokemonData;
    } catch (error) {
        console.error('Erreur lors du chargement initial:', error);
        throw error;
    }
};

// Vérifier et charger les données au démarrage
const initializeCache = async () => {
    const cachedData = await redisClient.get('pokemon:all');
    if (!cachedData) {
        await loadAllPokemonData();
    } else {
        console.log('Données Pokémon déjà présentes dans le cache Redis');
    }
};

initializeCache();

// Route pour récupérer tous les Pokémon (depuis le cache)
app.get('/pokemon/all', async (req, res) => {
    try {
        const cachedData = await redisClient.get('pokemon:all');
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

// Route pour récupérer un Pokémon spécifique
app.get('/pokemon/:id', async (req, res) => {
    try {
        const pokemonId = req.params.id;
        const cachedData = await redisClient.get('pokemon:all');
        
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

// Route pour forcer le rechargement du cache
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
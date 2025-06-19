const frenchTranslations = require('./frenchTranslations.json');
const redisService = require('./redis.service');
const axios = require('axios');

const generationToDecimal = {
    'i': 1,
    'ii': 2,
    'iii': 3,
    'iv': 4,
    'v': 5,
    'vi': 6,
    'vii': 7,
    'viii': 8,
    'ix': 9
};

const getFrenchName = (names, englishName, category = 'types') => {
    if (names) {
        const frenchEntry = names.find(entry => entry.language.name === 'fr');
        if (frenchEntry) return frenchEntry.name;
    }
    
    // Fallback par catégorie
    if (englishName) {
        return frenchTranslations[category]?.[englishName] 
               || frenchTranslations.types?.[englishName]
               || frenchTranslations.colors?.[englishName]
               || englishName;
    }
    
    return null;
};

const initializeCache = async () => {
    try {
        const cachedData = await redisService.get('pokemon:all');
        const lastUpdated = await redisService.get('pokemon:last_updated');
        
        if (!cachedData || shouldRefreshCache(lastUpdated)) {
            console.log('(Re)chargement des données Pokémon...');
            await loadAllPokemonData();
            await redisService.set('pokemon:last_updated', Date.now());
        } else {
            console.log('Utilisation des données Pokémon existantes dans Redis');
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du cache:', error);
    }
};

const shouldRefreshCache = (lastUpdatedTimestamp) => {
    if (!lastUpdatedTimestamp) return true;
    const hoursSinceLastUpdate = (Date.now() - parseInt(lastUpdatedTimestamp)) / (1000 * 60 * 60);
    return hoursSinceLastUpdate >= CACHE_REFRESH_HOURS;
};

const loadAllPokemonData = async () => {
    try {
        console.log('Début du chargement des données Pokémon...');
        
        const listResponse = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=1302');
        const pokemonList = listResponse.data.results;
        
        const allPokemonData = {};
        
        for (const [index, pokemon] of pokemonList.entries()) {
            try {
                const pokemonResponse = await axios.get(pokemon.url);
                const speciesResponse = await axios.get(pokemonResponse.data.species.url);
                
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
                        fr: getFrenchName(speciesResponse.data.color?.names, speciesResponse.data.color?.name, 'colors'),
                        en: speciesResponse.data.color?.name
                    },
                    generation: generationToDecimal[speciesResponse.data.generation?.name.replace('generation-', '')] || 0,
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
                        fr: getFrenchName(type.type?.names, type.type?.name, 'types'),
                        en: type.type?.name
                    })),
                    abilities: pokemonResponse.data.abilities.map(ability => ({
                        fr: getFrenchName(ability.ability?.names, ability.ability?.name, 'abilities'),
                        en: ability.ability?.name
                    })),
                    egg_groups: speciesResponse.data.egg_groups.map(group => ({
                        fr: getFrenchName(group.names, group.name, 'egg_groups'),
                        en: group.name
                    })),
                };
                
                if (index % 50 === 0) {
                    await redisService.set('pokemon:all', JSON.stringify(allPokemonData));
                    console.log(`Pokémons chargés: ${index + 1}/${pokemonList.length}`);
                }
            } catch (error) {
                console.error(`Erreur sur le Pokémon ${pokemon.url}:`, error.message);
            }
        }
        
        await redisService.set('pokemon:all', JSON.stringify(allPokemonData));
        console.log('Tous les Pokémon ont été chargés avec succès dans Redis!');
        
        return allPokemonData;
    } catch (error) {
        console.error('Erreur lors du chargement initial:', error);
        throw error;
    }
};

module.exports = {
    initializeCache,
    loadAllPokemonData
};

const { loadAllPokemonData } = require("../cache");
const redisService = require("../redis.service.js");

class PokemonController {
    constructor(){
        this.paginationSize = process.env.PAGINATION_SIZE || 50;
    }

    paginateResults (data, page) {
        const pageSize = parseInt(this.paginationSize, 10);
        if (!Array.isArray(data) || data.length === 0) {
            return {
                page: 0,
                pageSize: 0,
                total: 0,
                data: []
            };
        }
        if (data.length <= pageSize) {
            return {
                page: 0,
                pageSize: data.length,
                total: data.length,
                data: data
            };
        }
        const start = page * pageSize;
        const end = start + pageSize;
        return {
            page: page,
            pageSize: pageSize,
            total: data.length,
            data: data.slice(start, end)
        };
    };

    async getAll(req, res){
        try {
            const cachedData = await redisService.get('pokemon:all');
            if (cachedData) {
                const allPokemon = JSON.parse(cachedData);
                res.json(Object.values(allPokemon));
            } else {
                res.status(503).json({ error: "Données non encore chargées" });
            }
        } catch (error) {
            console.log("error")
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async getSingle(req, res){
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
    }

    async getPages(req, res){
        const cachedData = await redisService.get('pokemon:all');

        const { pageId } = req.params || 0;

        if(!cachedData) {
            return res.status(503).json({ error: "Données non encore chargées" });
        }

        if(!req.body) {
            const redisParse = JSON.parse(cachedData);
            const allPokemon = Object.values(redisParse);
            res.json(this.paginateResults(allPokemon, pageId));
        }
        else {
            const { name, colors, types, generations} = req.body;
            

            try {
                const filteredPokemon = JSON.parse(cachedData);
                if(name){
                    Object.keys(filteredPokemon).forEach(key => {
                        const poke = filteredPokemon[key];
                        const nameFr = poke?.names?.fr ? poke.names.fr.toLowerCase() : '';
                        const nameEn = poke?.names?.en ? poke.names.en.toLowerCase() : '';
                        if (
                            !nameFr.includes(name.toLowerCase()) &&
                            !nameEn.includes(name.toLowerCase())
                        ) {
                            delete filteredPokemon[key];
                        }
                    });
                }
                if(colors && colors.length > 0) {
                    Object.keys(filteredPokemon).forEach(key => {
                        const pokeColor = filteredPokemon[key].color;
                        const colorFr = pokeColor?.fr ? pokeColor.fr.toLowerCase() : '';
                        const colorEn = pokeColor?.en ? pokeColor.en.toLowerCase() : '';
                        const hasColor = colors.some(c =>
                            (colorFr && colorFr === c.toLowerCase()) ||
                            (colorEn && colorEn === c.toLowerCase())
                        );
                        if (!hasColor) {
                            delete filteredPokemon[key];
                        }
                    });
                }
                if(types && types.length > 0) {
                    Object.keys(filteredPokemon).forEach(key => {
                        const pokeTypes = filteredPokemon[key].types || [];
                        const hasType = types.some(filterType =>
                            pokeTypes.some(t =>
                                (t.fr && t.fr.toLowerCase() === filterType.toLowerCase()) ||
                                (t.en && t.en.toLowerCase() === filterType.toLowerCase())
                            )
                        );
                        if (!hasType) {
                            delete filteredPokemon[key];
                        }
                    });
                }
                if(generations && generations.length > 0) {
                    Object.keys(filteredPokemon).forEach(key => {
                        const pokeGeneration = filteredPokemon[key].generation;
                        if (!generations.includes(pokeGeneration)) {
                            delete filteredPokemon[key];
                        }
                    });
                }
                const allPokemon = Object.values(filteredPokemon);
                const paginatedResults = this.paginateResults(allPokemon, parseInt(pageId, 10));
                res.json(paginatedResults);
            } catch (error) {
                res.status(500).json({ error: "Internal server error" });
            }
        }
    }

    async reloadCache(req, res){
        try {
            await loadAllPokemonData();
            res.json({ message: "Cache rechargé avec succès" });
        } catch (error) {
            res.status(500).json({ error: "Erreur lors du rechargement" });
        }
    }

    async getList(req, res){
        if(!req.body.ids || req.body.ids.length === 0){
            res.sendStatus(500)
            return
        }

        try{
            const cachedData = await redisService.get('pokemon:all');
            if(!cachedData){
                res.sendStatus(500)
                return
            }

            const data = JSON.parse(cachedData);
            const pokemons = []
            for(const id of req.body.ids){
                if(data[id]) pokemons.push(data[id])
            }

            res.json(pokemons)
            return
        }catch(err){
            console.log("Error : ", err)
            res.sendStatus(500)
            return
        }
    }

    async getRandomTeam(req, res) {
        try{
            const cachedData = await redisService.get('pokemon:all');
            if(!cachedData){
                res.sendStatus(500)
                return
            }

            const data = JSON.parse(cachedData)
            const len = Object.keys(data).length
            const team = []
            for(let i = 0; i < 6; i++) {
                const randomId = Math.floor(Math.random() * len)
                team.push(data[Object.keys(data)[randomId]])
            }
            res.json(team)
        }catch(err){
            console.log(err)
            res.sendStatus(500)
            return
        }
    }
}

module.exports = PokemonController
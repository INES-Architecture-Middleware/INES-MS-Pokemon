const express = require('express')
const {authenticate, requestDetails} = require('../middleware/auth');

class PokemonRouter {
  constructor(pokemonController) {
    this.router = express.Router();

    this.router
      .route('/')
      .get(requestDetails, authenticate, async (req, res) => {
        await pokemonController.getAll(req, res);
      })

    this.router
      .route('/reload-cache')
      .get(requestDetails, authenticate, async (req, res) => {
        await pokemonController.reloadCache(req, res);
      })
    
    this.router
      .route('/:id')
      .get(requestDetails, authenticate, async (req, res) => {
        await pokemonController.getSingle(req, res);
      })

    this.router
      .route('/filter/:pageId')
      .post(requestDetails, authenticate, async (req, res) => {
        await pokemonController.getPages(req, res);
      })
  }
}

module.exports = PokemonRouter;
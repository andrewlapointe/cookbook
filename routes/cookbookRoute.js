const express = require('express');
const cookbookRouter = new express.Router();
const cookbookController = require('../controllers/cookbookController');
const utilities = require('../utilities/');

cookbookRouter.get(
    '/all',
    utilities.handleErrors(cookbookController.allRecipes)
);

cookbookRouter.get(
    '/recipe/:id',
    utilities.handleErrors(cookbookController.getRecipeById)
);

cookbookRouter.get(
    '/search',
    cookbookController.searchRules(),
    cookbookController.checkSearchData,
    utilities.handleErrors(cookbookController.getRecipeSearch)
);

module.exports = cookbookRouter;

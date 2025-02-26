const express = require('express');
const cookbookRouter = new express.Router();
const cookbookController = require('../controllers/cookbookController');
const utilities = require('../utilities/');

cookbookRouter.get(
    '/all',
    utilities.handleErrors(cookbookController.allRecipes)
);

module.exports = cookbookRouter;

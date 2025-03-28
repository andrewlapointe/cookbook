const { query, validationResult } = require('express-validator');
const cookbookModel = require('../models/cookbook-model');
const utils = require('../utilities/');
const cookbookController = {};
const accountModel = require('../models/account-model');

cookbookController.allRecipes = async function (req, res, next) {
    const result = await cookbookModel.allRecipes();

    res.render('pages/cookbook/grid-view', {
        title: 'All Recipes',
        recipes: result.data.rows,
    });
};

cookbookController.getRecipeById = async function (req, res) {
    const recipe = await cookbookModel.getRecipeById(req.params.id);
    const ingredients = await cookbookModel.getRecipeIngredientsById(
        req.params.id
    );
    let userLists;
    if (res.locals.loggedin) {
        const result = await accountModel.getUserLists(
            res.locals.accountData.id,
            req.cookies['jwt']
        );
        userLists = result.data.rows;
    } else {
        userLists = null;
    }
    res.render('pages/cookbook/recipe-page', {
        title: recipe.data.rows.title,
        recipe: recipe.data.rows[0],
        ingredients: ingredients.data.rows,
        userLists: userLists,
    });
};

cookbookController.searchRules = () => {
    return [
        query('q').trim().escape().notEmpty().isString(),
        // .checkExact([], { message: 'Too many fields submitted' }),
    ];
};

/* ******************************
 * Check data and return errors or continue to registration
 * ***************************** */
cookbookController.checkSearchData = async (req, res, next) => {
    let errors = [];
    errors = validationResult(req);
    utils.logger.log('error', 'Error in Search Query', errors);
    next();
};

cookbookController.getRecipeSearch = async function (req, res) {
    const result = await cookbookModel.getRecipeSearch(req.query.q);

    res.render('pages/cookbook/grid-view', {
        title: `Search: ${req.query.q}`,
        recipes: result.data.rows,
    });
};

module.exports = cookbookController;

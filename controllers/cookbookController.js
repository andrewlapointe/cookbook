const cookbookModel = require('../models/cookbook-model');
const htmlScripts = require('../utilities/cookbookHtml');

const cookbookController = {};

cookbookController.allRecipes = async function (req, res, next) {
    const result = await cookbookModel.allRecipes();

    res.render('pages/cookbook/grid-view', {
        title: 'All Recipes',
        recipes: result.data.rows,
    });
};

cookbookController.getRecipeById = async function (req, res) {
    const result = await cookbookModel.getRecipeById(req.params.id);

    res.render('pages/cookbook/recipe-page', {
        title: result.data.rows.title,
        recipe: result.data.rows[0],
    });
};

module.exports = cookbookController;

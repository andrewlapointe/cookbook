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

module.exports = cookbookController;

const cmsModel = require('../models/cms-model');
const cmsController = {};

cmsController.buildHub = async function (req, res) {
    const userRecipes = await cmsModel.getRecipesByUser(
        res.locals.accountData.id
    );

    const recipeData = userRecipes.data.rows;
    for (let i = 0; i < recipeData.length; i++) {
        const id = recipeData[i].id;
        const ingedients = await cmsModel.getRecipeIngredientsById(id);
        recipeData[i].ingredients = ingedients.data.rows;
    }

    console.log(recipeData[0]);

    // const ingredients = await cmsModel.getAllIngredients();
    const units = await cmsModel.getAllUnits();

    res.render('pages/cms/hub', {
        title: 'CMS Hub',
        user: res.locals.accountData.id,
        username: res.locals.accountData.username,
        userRecipes: recipeData,
        // allIngredients: ingredients.data.rows,
        units: units.data.rows,
    });
};

cmsController.createRecipe = async function (req, res) {
    console.log(req.body);
    await cmsModel.createNewRecipe(req.body, req.cookies['jwt']);
    res.status(201).redirect('/cms/hub');
};

cmsController.deleteRecipe = async function (req, res) {
    result = await cmsModel.deleteRecipe(
        { recipeId: req.params.id },
        req.cookies['jwt']
    );
    res.status(204).redirect('/cms/hub');
};

cmsController.editRecipe = async function (req, res, next) {
    result = await cmsModel.editRecipe(req.body, req.cookies['jwt']);
    res.status(204).redirect('/cms/hub');
};

module.exports = cmsController;

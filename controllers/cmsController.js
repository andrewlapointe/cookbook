const cmsModel = require('../models/cms-model');
const cmsController = {};

cmsController.buildHub = async function (req, res) {
    result = await cmsModel.getRecipesByUser(res.locals.accountData.id);

    res.render('pages/cms/hub', {
        title: 'CMS Hub',
        user: res.locals.accountData.id,
        username: res.locals.accountData.username,
        userRecipes: result.data.rows,
    });
};

cmsController.createRecipe = async function (req, res) {
    await cmsModel.createNewRecipe(req.body, req.cookies['jwt']);
    res.status(201).redirect('/cms/hub');
};

cmsController.deleteRecipe = async function (req, res) {
    result = await cmsModel.deleteRecipe(
        { recipeId: req.params.id },
        req.cookies['jwt']
    );
    res.status(204);
};

module.exports = cmsController;

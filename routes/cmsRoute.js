const express = require('express');
const cmsRouter = new express.Router();
const cmsController = require('../controllers/cmsController');
const utilities = require('../utilities/');

cmsRouter.get('/', function (req, res) {
    res.redirect('/cms/hub');
});
cmsRouter.get(
    '/hub',
    utilities.checkLogin,
    utilities.handleErrors(cmsController.buildHub)
);
cmsRouter.post(
    '/recipe/new',
    utilities.checkLogin,
    cmsController.createRecipeRules(),
    cmsController.checkRecipeData,
    utilities.handleErrors(cmsController.createRecipe)
);

cmsRouter.post(
    '/recipe/edit',
    utilities.checkLogin,
    utilities.handleErrors(cmsController.editRecipe)
);

cmsRouter.delete(
    '/recipe/delete/:id',
    utilities.checkLogin,
    utilities.handleErrors(cmsController.deleteRecipe)
);

module.exports = cmsRouter;

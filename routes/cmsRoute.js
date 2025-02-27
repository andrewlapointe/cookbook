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
    utilities.handleErrors(cmsController.createRecipe)
);

cmsRouter.put(
    '/recipe/edit',
    utilities.checkLogin,
    utilities.handleErrors(cmsController.buildHub)
);

cmsRouter.delete(
    '/recipe/delete/:id',
    utilities.checkLogin,
    utilities.handleErrors(cmsController.deleteRecipe)
);

module.exports = cmsRouter;

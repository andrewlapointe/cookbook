const express = require('express');
const accountRouter = new express.Router();
const utilities = require('../utilities/');
const accountController = require('../controllers/accountController');

accountRouter.get(
    '/register',
    utilities.handleErrors(accountController.buildRegistration)
);

accountRouter.get(
    '/login',
    utilities.handleErrors(accountController.buildLogin)
);

accountRouter.post(
    '/login',
    utilities.handleErrors(accountController.accountLogin)
);

accountRouter.get('/logout', utilities.handleErrors(accountController.logout));

accountRouter.post(
    '/register',
    accountController.registrationRules(),
    accountController.checkRegData,
    utilities.handleErrors(accountController.submitRegistration)
);

accountRouter.get(
    '/profile',
    utilities.checkLogin,
    utilities.handleErrors(accountController.buildProfile)
);

accountRouter.post(
    '/addlist',
    utilities.checkLogin,
    accountController.listNameRules(),
    accountController.checkListNameRules,
    utilities.handleErrors(accountController.addList)
);

accountRouter.get(
    '/list/:id',
    utilities.checkLogin,
    utilities.handleErrors(accountController.getList)
);

accountRouter.delete(
    '/list/delete/:id',
    utilities.checkLogin,
    utilities.handleErrors(accountController.deleteList)
);

accountRouter.post(
    '/list/addrecipe/:id',
    utilities.checkLogin,
    utilities.handleErrors(accountController.addRecipeToLists)
);

accountRouter.delete(
    '/list/removerecipe',
    utilities.checkLogin,
    utilities.handleErrors(accountController.removeRecipeFromList)
);

module.exports = accountRouter;

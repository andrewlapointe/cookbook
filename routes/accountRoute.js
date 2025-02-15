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

accountRouter.post(
    '/register',
    accountController.registrationRules(),
    accountController.checkRegData,
    utilities.handleErrors(accountController.submitRegistration)
);

module.exports = accountRouter;

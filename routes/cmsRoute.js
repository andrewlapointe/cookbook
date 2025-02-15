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

module.exports = cmsRouter;

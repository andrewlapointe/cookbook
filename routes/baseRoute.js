const express = require('express');
const axios = require('axios');
const router = new express.Router();
const utilities = require('../utilities/');
const baseController = require('../controllers/baseController');

const cmsRoute = require('./cmsRoute');
const accountRoute = require('./accountRoute');

// TODO: move all axios calls to the model

router.get(
    '',
    // utilities.checkJWTToken,
    utilities.handleErrors(baseController.buildHome)
);

router.use('/account', accountRoute);

router.use('/cms', cmsRoute);

router.get('/about', async (req, res) => {
    res.render('pages/about', {
        title: 'About',
    });
});
router.get('/account');
module.exports = router;

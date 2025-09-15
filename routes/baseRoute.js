const express = require('express');
const axios = require('axios');
const router = new express.Router();
const path = require('path');
const utilities = require('../utilities/');
const baseController = require('../controllers/baseController');
const mapController = require('../controllers/mapController');

const cmsRoute = require('./cmsRoute');
const accountRoute = require('./accountRoute');
const cookbookRoute = require('./cookbookRoute');

// TODO: move all axios calls to the model

router.get(
    '',
    // utilities.checkJWTToken,
    utilities.handleErrors(baseController.buildHome)
);

router.use('/account', accountRoute);

router.use('/cms', cmsRoute);

router.use('/cookbook', cookbookRoute);

router.get('/about', async (req, res) => {
    res.render('pages/about', {
        title: 'About',
    });
});

router.get('/map-demo', async (req, res) => {
    res.sendFile(path.join(__dirname, '../public/demo/map.html'), {
        title: 'Map Demo',
    });
});

router.post('/map-demo/data', async (req, res, next) => {
    const dataObject = await mapController.getData(req, res);
    res.setHeader('Content-Type', 'application/json');
    res.json(dataObject);
});

module.exports = router;

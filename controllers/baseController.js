const utilities = require('../utilities/');
const accountModel = require('../models/account-model');
const baseController = {};
const axios = require('axios');

baseController.buildHome = async function (req, res) {
    //   const nav = await utilities.getNav();
    req.flash('notice', 'This is a flash message.');
    res.render('pages/index', { title: 'Home' });
};

module.exports = baseController;

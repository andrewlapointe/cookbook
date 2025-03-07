const utilities = require('../utilities/');
const accountModel = require('../models/account-model');
const cookbookModel = require('../models/cookbook-model');
const baseController = {};
const axios = require('axios');

baseController.buildHome = async function (req, res) {
    //   const nav = await utilities.getNav();
    req.flash('notice', 'This is a flash message.');

    const result = await cookbookModel.allRecipes();

    // THIS SHOULD BE REMOVED FOR DEMO ONLY
    const top4 = [];
    result.data.rows.forEach((recipe) => {
        if (top4.length < 4) {
            top4.push(recipe);
        } else {
            return;
        }
    });

    res.render('pages/index', { title: 'Home', recipes: top4 });
};

module.exports = baseController;

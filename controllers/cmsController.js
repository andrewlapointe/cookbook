const cmsModel = require('../models/cms-model');
const cmsController = {};

cmsController.buildHub = async function (req, res) {
    res.render('pages/cms/hub', {
        title: 'CMS Hub',
        user: res.locals.accountData.id,
    });
};

cmsController.createRecipe = async function (req, res) {
    await cmsModel.createNewRecipe(req.body, req.cookies['jwt']);
    res.status(201).redirect('/cms/hub');
};

module.exports = cmsController;

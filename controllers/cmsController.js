const cmsController = {};

cmsController.buildHub = async function (req, res) {
    res.render('pages/cms/hub', { title: 'CMS Hub' });
};

module.exports = cmsController;

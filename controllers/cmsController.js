const { body, validationResult } = require('express-validator');
const parseFraction = require('parse-fraction');
const utils = require('../utilities/');
const cmsModel = require('../models/cms-model');
const accountModel = require('../models/account-model');
const cmsController = {};

cmsController.buildHub = async function (req, res) {
    console.log(parseFraction('1 1/3'));
    const userRecipes = await cmsModel.getRecipesByUser(
        res.locals.accountData.id
    );

    const userLists = await accountModel.getUserLists(
        res.locals.accountData.id,
        req.cookies['jwt']
    );

    userLists.data.rows.forEach((list) => {
        if (list.recipes[0].id === null) {
            delete list.recipes;
        }
    });

    const recipeData = userRecipes.data.rows;
    for (let i = 0; i < recipeData.length; i++) {
        const id = recipeData[i].id;
        const ingedients = await cmsModel.getRecipeIngredientsById(id);
        recipeData[i].ingredients = ingedients.data.rows;
        let parentLists = [];
        userLists.data.rows.forEach((list) => {
            if (
                list.recipes &&
                Object.values(Object.values(list.recipes)[0]).includes(
                    parseInt(id)
                )
            ) {
                parentLists.push(list.list_name);
            }
        });
        recipeData[i].lists = parentLists;
    }
    // const ingredients = await cmsModel.getAllIngredients();
    const units = await cmsModel.getAllUnits();

    res.render('pages/cms/hub', {
        title: 'CMS Hub',
        user: res.locals.accountData.id,
        username: res.locals.accountData.username,
        userRecipes: recipeData,
        // allIngredients: ingredients.data.rows,
        units: units.data.rows,
        userLists: userLists.data.rows,
    });
};

cmsController.createRecipeRules = () => {
    return [
        body('recipeName', 'Recipe name error').notEmpty().escape(),
        body('author', 'Recipe author error').notEmpty().escape(),
        body('author').notEmpty().escape().withMessage('Recipe author error'),
        body('description', 'Recipe description error')
            .escape()
            .isLength({ max: 1000 })
            .withMessage('Description is too long.')
            .default(''),
        body('ingredient', 'Recipe ingredient error').notEmpty().escape(),
        body('ingredientAmount').notEmpty(),
    ];
};

cmsController.checkRecipeData = async (req, res, next) => {
    let errors = [];
    errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('notice', errors.array()[0].msg);
        utils.logger.log('error', 'CMS Error', errors);
        res.status(500).redirect('/cms/hub');
        return;
    }
    next();
};

cmsController.createRecipe = async function (req, res) {
    console.log(req.body);
    await cmsModel.createNewRecipe(req.body, req.cookies['jwt']);
    res.status(201).redirect('/cms/hub');
};

cmsController.deleteRecipe = async function (req, res) {
    result = await cmsModel.deleteRecipe(
        { recipeId: req.params.id },
        req.cookies['jwt']
    );
    res.status(204).redirect('/cms/hub');
};

cmsController.editRecipe = async function (req, res, next) {
    result = await cmsModel.editRecipe(req.body, req.cookies['jwt']);
    res.status(204).redirect('/cms/hub');
};

module.exports = cmsController;

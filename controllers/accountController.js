const { body, param, validationResult } = require('express-validator');
const utils = require('../utilities/');
const accountModel = require('../models/account-model');
const API = require('../models/api');
const { hash, compare } = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const env = require('dotenv').config();
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const file = fs.readFileSync(path.join(__dirname, '../emails.yaml'), 'utf-8');
const parsed = yaml.load(file);
const allowedEmails = parsed.whitelist;

const accountController = {};

accountController.buildRegistration = async function (req, res) {
    res.render('pages/account/register', { title: 'Register' });
};

accountController.buildProfile = async function (req, res) {
    const userLists = await accountModel.getUserLists(
        res.locals.accountData.id,
        req.cookies['jwt']
    );

    userLists.data.rows.forEach((list) => {
        if (list.recipes[0].id === null) {
            delete list.recipes;
        }
    });

    res.render('pages/account/profile', {
        title: 'Profile',
        accountData: res.locals.accountData,
        userLists: userLists.data.rows,
    });
};

accountController.buildLogin = async function (req, res) {
    res.render('pages/account/login', {
        title: 'Login',
        goto: req.query.redirect || '/',
    });
};

accountController.registrationRules = () => {
    return [
        // firstname is required and must be string
        body('username')
            .trim()
            .escape()
            .notEmpty()
            .isLength({ min: 2 })
            .withMessage('Please provide a valid username.') // on error this message is sent.
            .custom(async (username) => {
                const usernameCheck =
                    await accountModel.checkAccountExitsUsername(username);
                if (usernameCheck) {
                    throw new Error(
                        'Username exists. Please log in or use different username'
                    );
                }
            }),

        // valid email is required and cannot already exist in the database
        body('email')
            .trim()
            .notEmpty()
            .blacklist('\\\'"><&|=')
            .isEmail()
            .withMessage('A valid email is required.')
            .custom((value) => {
                if (!allowedEmails.includes(value)) {
                    throw new Error('Email is not in the allowed list');
                }
                return true;
            })
            .withMessage('Account must be approved by site Admin.')
            .normalizeEmail() // refer to validator.js docs
            .custom(async (email) => {
                const emailCheck = await accountModel.checkAccountExitsEmail(
                    email
                );
                if (emailCheck) {
                    throw new Error(
                        'Email exists. Please log in or use different email'
                    );
                }
            }),

        // password is required and must be strong password
        body('password')
            .trim()
            .notEmpty()
            .isStrongPassword({
                minLength: 8,
                minLowercase: 1,
                minUppercase: 0,
                minNumbers: 0,
                minSymbols: 0,
            })
            .withMessage(
                'Password does not meet requirements. You must have at least 8 characters'
            ),
    ];
};

accountController.checkRegData = async (req, res, next) => {
    const { username, email } = req.body;
    let errors = [];
    errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('notice', errors.array()[0].msg);
        utils.logger.log('error', 'Registration Error', errors);
        // let nav = await utilities.getNav();
        res.render('pages/account/register', {
            errors,
            title: 'Registration',
            // nav,
            username,
            email,
        });
        return;
    }
    next();
};

accountController.submitRegistration = async function (req, res) {
    const { email, username, password } = req.body;
    let password_hash;
    try {
        password_hash = await hash(password, 10);
    } catch (error) {
        req.flash(
            'notice',
            'Sorry, there was an error processing the registration.'
        );
        res.status(500).redirect('/account/register');
        return;
    }

    accountModel.registerNewAccount(email, username, password_hash);
    req.flash('notice', 'Account successfully registered! Please log in.');
    res.status(201).redirect('/account/login');
};

accountController.loginRules = () => {
    return [
        // valid email is required and cannot already exist in the database

        body('email')
            .trim()
            .notEmpty()
            .blacklist('\\\'"><&|=')
            .withMessage('A valid email is required.')
            .normalizeEmail() // refer to validator.js docs
            .custom(async (email) => {
                const emailCheck = await accountModel.checkAccountExitsEmail(
                    email
                );
                if (!emailCheck) {
                    throw new Error(
                        'Account does not exist. Please use different email or register an account'
                    );
                }
            }),

        // password is required and must be strong password
        body('password').trim().notEmpty().withMessage('Must use password'),
    ];
};

accountController.checkLoginData = async (req, res, next) => {
    const { email, redirect } = req.body;
    let errors = [];
    errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('notice', errors.array()[0].msg);
        utils.logger.log('error', 'Login Error', errors);
        res.render('./pages/account/login', {
            title: 'Login',
            errors: null,
            email,
            goto: redirect,
        });
        return;
    }
    next();
};

/* ****************************************
 *  Process login request
 * ************************************ */
accountController.accountLogin = async function (req, res) {
    // let nav = await utilities.getNav();
    const { email, password, redirect } = req.body;
    const accountData = await accountModel.getAccountByEmail(email);

    if (accountData.data.length === 0) {
        console.log('in if');
        req.flash('notice', 'Please check your credentials and try again.');
        res.status(400).render('./pages/account/login', {
            title: 'Login',
            errors: null,
            email,
            goto: redirect,
        });
        console.log('before return');
        return;
    }

    try {
        const known_hash = accountData.data[0].password_hash;
        compare(password, known_hash, function (err, result) {
            if (err) {
                console.error(err);
                return;
            }
            if (result) {
                delete accountData.data[0].password_hash;
                const accessToken = jwt.sign(
                    accountData.data[0],
                    process.env.TOKEN_SECRET,
                    { expiresIn: 3600 }
                );
                if (process.env.NODE_ENV === 'development') {
                    res.cookie('jwt', accessToken, {
                        httpOnly: true,
                        sameSite: 'strict',
                        maxAge: 3600 * 1000,
                    });
                } else {
                    res.cookie('jwt', accessToken, {
                        httpOnly: true,
                        sameSite: 'strict',
                        secure: true,
                        maxAge: 3600 * 1000,
                    });
                }
                req.flash('notice', 'Login Successful');
                return res.redirect(redirect);
            } else {
                req.flash(
                    'notice',
                    'Please check your credentials and try again.'
                );
                res.status(400).render('./pages/account/login', {
                    title: 'Login',
                    errors: null,
                    email,
                    goto: redirect,
                });
                return;
            }
        });
    } catch (error) {
        return new Error('Access Forbidden');
    }
};

accountController.logout = async function (req, res) {
    res.locals.loggedin = 0;
    res.locals.accountData = {};
    if (req.cookies.jwt) {
        res.cookie('jwt', '', { maxAge: 0 });
    }
    res.redirect('/');
};

accountController.listNameRules = () => {
    return [
        body('listName')
            .trim()
            .escape()
            .notEmpty()
            .isLength({ min: 1 })
            .withMessage('List name error.'),
    ];
};

accountController.checkListNameRules = async (req, res, next) => {
    const { listName } = req.body;
    let errors = [];
    errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('notice', errors.array()[0].msg);
        utils.logger.log('error', 'Submission Error', errors);
        // let nav = await utilities.getNav();
        return;
    }
    next();
};

accountController.checkRulesGeneric = async (req, res, next) => {
    let errors = [];
    errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('notice', errors.array()[0].msg);
        utils.logger.log('error', 'Validation Error', errors);
        return;
    }
    next();
};

accountController.deleteRules = () => {
    return [
        param('id')
            .trim()
            .notEmpty()
            .isInt()
            .withMessage('Deletion param error.'),
    ];
};

accountController.addList = async function (req, res) {
    const { listName } = req.body;
    const data = await accountModel.addUserList(
        listName,
        res.locals.accountData.id,
        req.cookies['jwt']
    );
    res.send(data.data.rows);
};

accountController.getList = async function (req, res) {
    const id = req.params.id;
    const response = await accountModel.getList(id, req.cookies['jwt']);
    res.send(response.data.rows);
};

accountController.deleteList = async function (req, res) {
    const id = req.params.id;
    const response = await accountModel.deleteList(id, req.cookies['jwt']);
    res.send(response.data.rows);
};

accountController.addRecipeToLists = async function (req, res) {
    const recipeId = req.params.id;
    const lists = req.body;

    let worstResponse = -1;

    for (let i = 0; i < Object.keys(lists).length; i++) {
        let response;
        if (lists[i].value === true) {
            response = await accountModel.addRecipeToList(
                {
                    list_id: lists[i].id,
                    recipe_id: recipeId,
                },
                req.cookies['jwt']
            );
        } else {
            response = await accountModel.removeRecipeFromList(
                {
                    list_id: lists[i].id,
                    recipe_id: recipeId,
                },
                req.cookies['jwt']
            );
        }

        if (response > worstResponse) {
            worstResponse = response;
        }
    }
    res.status(worstResponse); // TODO: Change this to actually check for a success
};

accountController.removeRecipeFromList = async function (req, res) {
    const { listId, recipeId } = req.body;

    const response = await accountModel.removeRecipeFromList(
        { list_id: listId, recipe_id: recipeId },
        req.cookies['jwt']
    );

    res.sendStatus(response);
};

module.exports = accountController;

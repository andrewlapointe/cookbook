const { body, validationResult } = require('express-validator');
const utilities = require('../utilities/');
const accountModel = require('../models/account-model');
const API = require('../models/api');
const { hash, compare } = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('dotenv').config();

const accountController = {};

accountController.buildRegistration = async function (req, res) {
    res.render('pages/account/register', { title: 'Register' });
};

accountController.buildLogin = async function (req, res) {
    res.render('pages/account/login', { title: 'Login' });
};

accountController.registrationRules = () => {
    return [
        // firstname is required and must be string
        body('username')
            .trim()
            .escape()
            .notEmpty()
            .isLength({ min: 2 })
            .withMessage('Please provide a first name.'), // on error this message is sent.

        // valid email is required and cannot already exist in the database
        body('email')
            .trim()
            .isEmail()
            .normalizeEmail() // refer to validator.js docs
            .withMessage('A valid email is required.')
            .custom(async (email, { req }) => {
                username = req.body.username;
                const userCheck = await accountModel.checkAccountExits(
                    email,
                    username
                );
                const { emailExists, usernameExists } = userCheck['data'];

                if (emailExists) {
                    throw new Error(
                        'Email exists. Please log in or use different email'
                    );
                } else if (usernameExists) {
                    throw new Error(
                        'Username exists. Please log in or use different email'
                    );
                }
            }),

        // password is required and must be strong password
        body('password')
            .trim()
            .notEmpty()
            // .isStrongPassword({
            //     // minLength: 12,
            //     // minLowercase: 1,
            //     minUppercase: 1,
            //     minNumbers: 1,
            // })
            .withMessage('Password does not meet requirements.'),
    ];
};

/* ******************************
 * Check data and return errors or continue to registration
 * ***************************** */
accountController.checkRegData = async (req, res, next) => {
    const { username, email } = req.body;
    let errors = [];
    errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
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
        res.redirect('/account/register').status(500);
        return;
    }

    accountModel.registerNewAccount(email, username, password_hash); // Add success message
    res.redirect('/account/login', 200);
};

/* ****************************************
 *  Process login request
 * ************************************ */
accountController.accountLogin = async function (req, res) {
    // let nav = await utilities.getNav();
    const { email, password } = req.body;
    const accountData = await accountModel.getAccountByEmail(email); // Change for API call
    if (!accountData) {
        req.flash('notice', 'Please check your credentials and try again.');
        res.status(400).redirect('./pages/account/login', {
            title: 'Login',
            // nav,
            errors: null,
            email,
        });
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
                    process.env.SESSION_SECRET,
                    { expiresIn: 3600 }
                );
                if (process.env.NODE_ENV === 'development') {
                    res.cookie('jwt', accessToken, {
                        httpOnly: true,
                        maxAge: 3600 * 1000,
                    });
                } else {
                    res.cookie('jwt', accessToken, {
                        httpOnly: true,
                        secure: true,
                        maxAge: 3600 * 1000,
                    });
                }
                req.flash('notice', 'Login Successful');
                return res.redirect('/');
            } else {
                req.flash(
                    'notice',
                    'Please check your credentials and try again.'
                );
                res.status(400).render('./pages/account/login', {
                    title: 'Login',
                    errors: null,
                    email,
                });
                return;
            }
        });
    } catch (error) {
        return new Error('Access Forbidden');
    }
};

module.exports = accountController;

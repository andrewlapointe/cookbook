require('dotenv').config();
const jwt = require('jsonwebtoken');
const Util = {};

Util.handleErrors = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

Util.checkJWTToken = (req, res, next) => {
    if (req.cookies.jwt) {
        jwt.verify(
            req.cookies.jwt,
            process.env.TOKEN_SECRET,
            function (err, accountData) {
                if (err) {
                    req.flash('Please log in');
                    res.clearCookie('jwt');
                    return res.redirect('/account/login');
                }
                res.locals.accountData = accountData;
                res.locals.loggedin = 1;
                next();
            }
        );
    } else {
        res.locals.loggedin = 0;
        next();
    }
};

Util.checkLogin = (req, res, next) => {
    if (res.locals.loggedin) {
        next();
    } else {
        req.flash('notice', 'Please log in.');
        return res.redirect('/account/login');
    }
};

Util.isAdmin = (req, res, next) => {
    if (res.locals.accountData.account_type === 'Admin') {
        next();
    } else {
        req.flash('notice', 'Access Denied');
        return res.redirect('/');
    }
};

module.exports = Util;

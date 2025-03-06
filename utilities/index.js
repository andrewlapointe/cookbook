require('dotenv').config();
const jwt = require('jsonwebtoken');
const Util = {};
const winston = require('winston');

Util.logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        //
        // - Write all logs with importance level of `error` or higher to `error.log`
        //   (i.e., error, fatal, but not other levels)
        //
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        //
        // - Write all logs with importance level of `info` or higher to `combined.log`
        //   (i.e., fatal, error, warn, and info, but not trace)
        //
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
    Util.logger.add(
        new winston.transports.Console({
            format: winston.format.simple(),
        })
    );
}

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

const express = require('express');
const env = require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const static = require('./routes/static');
const route = require('./routes/baseRoute');
const utilities = require('./utilities/index');
// const jquery = require('jquery');

const cookieParser = require('cookie-parser');

/* ***********************
 * Middleware
 * ************************/
app.use(
    session({
        // TODO
        secret: 'CHANGE THIS',
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 60000 },
    })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser());

// Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});

app.use(utilities.checkJWTToken);

/* ***********************
 * Routes
 *************************/
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', './layouts/layout');
app.use(static);

// Main route handler
app.use('/', route);

app.use(async (req, res, next) => {
    next({
        status: 404,
        message: `Sorry, we appear to have lost that page.`,
    });
});

/************************
 * Express Error Handler
 * Place after all other middleware
 *************************/
app.use(async (err, req, res, next) => {
    // let nav = await utilities.getNav();
    console.error(`Error at: "${req.originalUrl}": ${err.message}`);
    let message =
        err.status == 404
            ? err.message
            : 'Oh no! There was a crash. Maybe try a different route?';
    res.render('errors/error', {
        title: err.status || 'Server Error',
        message,
        // nav,
    });
});

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT;
const host = process.env.HOST;

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
    console.log(`App listening on http://${host}:${port}`);
});

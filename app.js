/* eslint-disable no-shadow */
/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
require('dotenv').config();
const cookieParser = require('cookie-parser');
const express = require('express');
const httpErrors = require('http-errors');
const logger = require('morgan');
const path = require('path');
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcrypt-nodejs');

const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api');
const adminRouter = require('./routes/admin');

const { admin } = require('./model/main');

const app = express();

app.set('views', path.join(__dirname, 'views'));

// Passport
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  admin.findById(id, (err, user) => {
    done(err, user);
  });
});

passport.use('login', new LocalStrategy({
  passReqToCallback: true
},
((req, username, password, done) => {
  const usernameInLowerCase = username.toLowerCase();
  admin.findOne({ username: usernameInLowerCase }, (err, user) => {
    if (err) {
      return done(err);
    }

    if (!user) {
      return done(null, false, req.flash('info', 'User not found.'));
    }

    const isValidPassword = (user, password) => bcrypt.compareSync(password, user.password);

    if (!isValidPassword(user, password)) {
      return done(null, false, req.flash('info', 'Invalid password'));
    }

    return done(null, user);
  });
})));

// view engine setup
app.engine('hbs', hbs({
  layoutsDir: 'views',
  defaultLayout: 'layout',
  partialsDir: path.join(__dirname, 'views/partials'),
  extname: '.hbs'
}));
app.set('view engine', 'hbs');
if (process.env.ENV === 'dev') {
  app.use(logger('dev'));
}
const rawBodySaver = function (req, res, buf, encoding) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
};
app.use(bodyParser.json({ verify: rawBodySaver }));
app.use(bodyParser.urlencoded({ verify: rawBodySaver, extended: true }));
app.use(bodyParser.raw({ verify: rawBodySaver, type: '*/*' }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api', apiRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(httpErrors(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.redirect('/');
});

module.exports = app;

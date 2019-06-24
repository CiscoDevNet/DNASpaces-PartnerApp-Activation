var express = require('express');
var router = express.Router();
var loginValidateController = require('../controllers/loginValidateController');

/* Get login page */
router.get('/login', loginValidateController.login);

/* Validate User Credentials */
router.post('/validateLogin', loginValidateController.validateLogin);

/* Get access token for loggedin user */
router.post('/token', loginValidateController.getToken);

/* Auto login validation for already activated apps */
router.post('/appLogin', loginValidateController.appLogin);

/* Show partner dashboard page */
router.get('/dashboard', loginValidateController.dashboardPage);

/* Singup page */
router.get('/signup', loginValidateController.signUp);

/* Save new user via signup flow */
router.post('/saveUser', loginValidateController.saveUser);

module.exports = router;

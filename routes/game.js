/**
 * Created by philippe_simpson on 29/09/15.
 */
var express = require('express');
var router = express.Router();

/* GET game page. */
router.get('/', function(req, res, next) {
    res.render('game');
});

module.exports = router;
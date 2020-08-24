var express = require('express');
var jwt = require('jsonwebtoken');
var config = require('../config.json');
var User = require('../schemas/user');
var Collection = require('../schemas/collection');
var router = express.Router();
const { withJWTAuthMiddleware } = require('express-kun');
const protectedRouter = withJWTAuthMiddleware(router, config.jwtSecret, undefined, getUser);
var jwt = require('jsonwebtoken');

function getUser(req, res) {
  const authorization = req.headers.authorization;
  if (!authorization) {
    throw new Error("No Authorization Header");
  }
  try {
    const token = authorization.split("Bearer ")[1];
    req.token = jwt.verify(token, config.jwtSecret);
    return token;
  } catch {
    throw new Error("Invalid Token Format");
  }
}

/* POST user creation. */
router.post('/', function(req, res, next) {
  User.create(req.body)
    .then(function({ id, email, password }) {
      res.json({ id, email });
    })
    .catch(next);
});

/* POST user login. */
router.post('/login', function(req, res, next) {
  var { email, password } = req.body;
  User.findOne({ email })
    .then(function(user) {
      if (user) {
        user.comparePassword(password, function(error, isMatch) {
          if (isMatch) {
            const token = jwt.sign({ user }, config.jwtSecret, {
              expiresIn: '24h'
            });

            res.json({
              id: user.id,
              token
            });
          } else {
            res.status(401).json({
              message: 'Unauthenticated'
            });
          }
        });
      } else {
        res.status(404).json({
          message: 'User Not found'
        })
      }
    })
    .catch(next);
});

/* GET user collections. */
protectedRouter.get('/collections', function(req, res, next) {
  Collection.find({
    owners: req.token.user._id
  })
  .populate('owners')
  .populate({ path: 'restaurants', populate: { path: 'schedule' }})
  .then(function(collections) {
    res.json({ data: collections });
  })
  .catch(next);
});

module.exports = router;

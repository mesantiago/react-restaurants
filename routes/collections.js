var express = require('express');
var config = require('../config.json');
var router = express.Router();
var Collection = require('../schemas/collection');
const { withJWTAuthMiddleware } = require('express-kun');
const protectedRouter = withJWTAuthMiddleware(router, config.jwtSecret, undefined, getUser);
var jwt = require('jsonwebtoken');

function getUser(req, res) {
  // jwt.decode()
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

/* POST collection creation. */
protectedRouter.post('/', function(req, res, next) {
  const collection = {
    ...req.body,
    originalOwner: req.token.user._id,
    owners: [req.token.user._id]
  }
  Collection.create(collection)
    .then(function({ id, name, owners, originalOwner, restaurants }) {
      res.json({ id, name, owners, originalOwner, restaurants });
    })
    .catch(next);
});

/* PUT collection update. */
protectedRouter.put('/:id', function(req, res, next) {
  Collection.findOne({
    _id: req.params.id,
    owners: req.token.user._id
  })
  .then(function(collection) {
    if (!collection) {
      throw new Error('Cannot find colletion');
    }
    collection.name = req.body.name;
    return collection.save();
  })
  .then(function({ id, owners, originalOwner, restaurants }) {
    res.json({ id, name: req.body.name, owners, originalOwner, restaurants });
  })
  .catch(next);
});

/* PUT collection add restaurant. */
protectedRouter.put('/:id/add', function(req, res, next) {
  Collection.findOne({
    _id: req.params.id,
    owners: req.token.user._id
  })
  .then(function(collection) {
    if (!collection) {
      throw new Error('Cannot find colletion');
    }
    if (collection.restaurants.indexOf(req.body.restaurantId) < 0) {
      collection.restaurants.push(req.body.restaurantId);
    } else {
      throw new Error('Already in the collection');
    }
    return collection.save();
  })
  .then(function({ id, owners, originalOwner, restaurants }) {
    res.json({ id, name: req.body.name, owners, originalOwner, restaurants });
  })
  .catch(next);
});

/* DELETE collection remove restaurant. */
protectedRouter.delete('/:id/remove/:restaurantId', function(req, res, next) {
  Collection.findOne({
    _id: req.params.id,
    owners: req.token.user._id
  })
  .then(function(collection) {
    if (!collection) {
      throw new Error('Cannot find colletion');
    }
    if (collection.restaurants.indexOf(req.params.restaurantId) < 0) {
      throw new Error('Not in the collection');
    } else {
      collection.restaurants.splice(collection.restaurants.indexOf(req.params.restaurantId), 1);
    }
    return collection.save();
  })
  .then(function() {
    res.json({
      message: 'Successfully removed!'
    });
  })
  .catch(next);
});

/* DELETE collection delete. */
protectedRouter.delete('/:id', function(req, res, next) {
  Collection.findOne({
    _id: req.params.id,
    originalOwner: req.token.user._id
  })
  .then(function(collection) {
    if (!collection) {
      throw new Error('Cannot find colletion in your list');
    }
    return collection.delete();
  })
  .then(function() {
    res.json({
      message: 'Successfully deleted!'
    });
  })
  .catch(next);
});

module.exports = router;

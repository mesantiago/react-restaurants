var express = require('express');
var router = express.Router();
var Restaurant = require('../schemas/restaurant');
var RestaurantSchedule = require('../schemas/restaurantSchedule');

/* GET restaurants listing. */
router.get('/', function(req, res, next) {
  let {
    page,
    limit,
    name,
    day,
    time
  } = req.query;
  // DEFAULTS
  limit = limit ? parseInt(limit) : 10;
  let skip = req.query.page ? (parseInt(req.query.page) - 1) * limit : 0;
  const restaurantQuery = name ? {
    name: { $regex: '^' + name, $options: 'i' }
  } : undefined;

  if (day || time) {
    const scheduleQuery = { };
    if (day) {
      scheduleQuery.day = parseInt(day);
    }
    if (time) {
      scheduleQuery.$or = [
        { '$and': [
          { '$expr':{ '$lt': ['$endTime', '$startTime'] } },
          { $or: [
            { startTime: { $lte: parseInt(time) } },
            { endTime: { $gte: parseInt(time) } }
          ] }
        ] },
        { '$and': [
          { startTime: { $lte: parseInt(time) } },
          { endTime: { $gte: parseInt(time) } }
        ] }
      ];
    }
    const aggregation = [
      // Match day & time
      { '$match': scheduleQuery },
      // Group by restaurant
      { '$group': {
        '_id': '$restaurant'
      }},
      // Populate Restaurant
      { '$lookup': {
        'from': 'restaurants',
        'localField': '_id',
        'foreignField': '_id',
        'as': 'restaurant'
      }},
      { '$unwind': { 'path' : '$restaurant' } },
      // Flatten
      { '$addFields': {
        'name' : '$restaurant.name',
        'schedule' : '$restaurant.schedule',
      } },
      { '$project': { 'restaurant': 0 } },
      // Match name
      { '$match': restaurantQuery || {} },
      // Count
      { '$count': 'total' }
    ];
    RestaurantSchedule
      .aggregate(aggregation)
      .then(function(count) {
        aggregation.pop();
        return RestaurantSchedule
          .aggregate(aggregation.concat([
            // Populate restaurant schedule
            { '$unwind': { 'path' : '$schedule' } },
            { '$lookup': {
              'from': 'restaurantschedules',
              'localField': 'schedule',
              'foreignField': '_id',
              'as': 'schedule'
            }},
            { '$unwind': { 'path' : '$schedule' } },
            { '$group': {
              '_id': '$_id',
              'name': { '$first': '$name' },
              'schedule': { '$push': '$schedule' }
            }},
            { '$sort': { 'name': 1 } },
            { '$skip': skip },
            { '$limit': limit }
          ]))
          .then(function(restaurants) {
            return {
              data: restaurants,
              total: (count[0] || {}).total || 0,
              totalPages: Math.ceil(((count[0] || {}).total || 0) / limit),
              limit,
              skip,
              page: parseInt(page) || 1
            };
          });
      })
      .then(function(result) {
        res.json(result);
      })
      .catch(next)
  } else {
    Restaurant.countDocuments(restaurantQuery)
      .then(function(count) {
        return Restaurant.find(restaurantQuery)
          .sort('name')
          .skip(skip)
          .limit(limit)
          .populate('schedule')
          .then(function(restaurants) {
            return {
              data: restaurants,
              total: count,
              totalPages: Math.ceil(count / limit),
              limit,
              page: parseInt(page) || 1
            };
          });
      })
      .then(function(result) {
        res.json(result);
      })
      .catch(next);
  }
});

module.exports = router;

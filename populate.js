var initial = require('./assets/initial.json');
var async = require('async');
var Restaurant = require('./schemas/restaurant');
var RestaurantSchedule = require('./schemas/restaurantSchedule');

function populateRestaurants() {
    (initial.restaurants || []).forEach(function ({ name, schedule }) {
        Restaurant.findOne({ name })
            .then(function (restaurant) {
                if (!restaurant) {
                    return Restaurant.create({ name })
                        .then(function (createdRestaurant) {
                            console.log(`Created restaurant ${ name }`);
                            return createdRestaurant;
                        })
                }
                return restaurant;
            })
            .then(function (restaurant) {
                return createSchedule(restaurant, schedule);
            })
            .catch(function (error) {
                console.error(`Mongoose connection failed while creating restaurant ${ name }`);
            });
    });

    function createSchedule(restaurant, schedules) {
        async.mapSeries(schedules, function ({ day, startTime, endTime }, callback) {
            RestaurantSchedule
                .findOne({ restaurant: restaurant.id, day })
                .then(function (schedule) {
                    if (!schedule) {
                        return RestaurantSchedule.create({ day, startTime, endTime, restaurant: restaurant._id });
                    } else if (schedule.startTime !== startTime || schedule.endTime !== endTime) {
                        schedule.startTime = startTime;
                        schedule.endTime = endTime;
                        return schedule.save();
                    } else {
                        return schedule;
                    }
                })
                .then(function (schedule) {
                    callback(undefined, schedule);
                })
                .catch(function (error) {
                    console.log("error before callback", error);
                    callback(error);
                });
        }, function (error, schedule) {
            if (error) {
                console.error(`Mongoose connection failed while creating restaurant schedule for ${ restaurant.name }`);
            } else {
                if (!restaurant.schedule) {
                    restaurant.schedule = [];
                }
                restaurant.schedule = restaurant.schedule.concat(schedule);
                console.log(`Created schedule for restaurant ${ restaurant.name }`);
                restaurant.save()
                    .catch(function(error) {
                        console.error(`Mongoose connection failed while updating the schedule of restaurant ${ restaurant.name }`);
                    });
            }
        });
    }
}

module.exports = {
    restaurants: populateRestaurants
};
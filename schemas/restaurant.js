var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RestaurantSchema = new Schema({
    name: { type: String, required: true, index: { unique: true } },
    schedule: [{
        type: Schema.Types.ObjectId,
        ref: 'RestaurantSchedule'
    }]
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);

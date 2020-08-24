var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CollectionSchema = new Schema({
    name: { type: String, required: true },
    owners: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    restaurants: [{
        type: Schema.Types.ObjectId,
        ref: 'Restaurant'
    }],
    originalOwner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('Collection', CollectionSchema);

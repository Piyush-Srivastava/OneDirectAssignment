const mongoose = require('mongoose');

var Schema = mongoose.Schema;

var tweetSchema = new Schema({
    TweetId: {
        type: Number,
        required: true,
        minlength: 1
    },
    TimeStamp: {
        type: String,
        default: null
    },
    TwitterId: {
        type: String,
        default: null
    },

    TweetContentUrl: {
        type:String,
        default: null
    }
    
})
// var Tweet = mongoose.model('Tweet', tweetSchema);

module.exports = {
    tweetSchema
};
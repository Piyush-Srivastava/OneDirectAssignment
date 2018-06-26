
var express = require("express");
var app = express();
var db = '';

//initializing mongoDB
const {MongoClient, ObjectID} = require('mongodb'); //creates variables MongoClient and ObjectID with values in mongodb object


//connect to database
MongoClient.connect('mongodb://localhost:27017',(err, client) => {
    if(err) {
        return console.log('Unable to connect to MongoDB server');
    }
    console.log('Connected to MongoDB server');
    db = client.db('OneDirectApp');
});




//getting the session
var session = require('express-session');
app.use(session({secret: "enter custom sessions secret here"}));

//authenticating the user context using consumer_keys
var OAuth = require('OAuth');
var oauth = new OAuth.OAuth( 'https://api.twitter.com/oauth/request_token'
                          	, 'https://api.twitter.com/oauth/access_token'
                          	, 'FjT9B0QnDjdCqNX3oqZvrW6cT'
                          	, 'mupq2XqLd3QdA6KzMHFzIb8VVRAvY9vPxSBiCAlrMJOQs8V8wS'
                          	, '1.0A'
                          	, null
                          	, 'HMAC-SHA1' );


//getting the user authentication to access the data through passport                           
var passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy;
  app.use(passport.initialize());
  app.use(passport.session());


  passport.use(new TwitterStrategy({
    consumerKey: 'FjT9B0QnDjdCqNX3oqZvrW6cT',
    consumerSecret: 'mupq2XqLd3QdA6KzMHFzIb8VVRAvY9vPxSBiCAlrMJOQs8V8wS',
    callbackURL: "http://localhost:3000/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, cb) {
    if (profile) {
      
        var screen_name = profile;
        oauth.get( 'https://api.twitter.com/1.1/statuses/home_timeline.json?tweet_mode=extended&screen_name=' + screen_name + '&count=5'
                  , token
                  , tokenSecret
                  , function (e, data, result){
                      if (e) console.error(e); 
                       for(i=0;i<5;i++)
                       {
                        if(((JSON.parse(data))[i].entities['urls']).length>0){
                           db.collection('Urls').insertOne({
                             TwitterId: (JSON.parse(data))[i].user['screen_name'],
                             TweetContentUrl: ((JSON.parse(data))[i].entities['urls'][0])['expanded_url']
                           },(err, result) => {
                            if(err){
                                return  console.log('Unable to insert url', err);
                            }
                            console.log(JSON.stringify(result.ops,undefined, 2));
                          });
                        }
                      }
                  });
                    
                   }
    
                  
        else {
            console.log("Authentication failed.")
        }
  }
));


//to redirect to authentication page of twitter
app.get('/auth/twitter',
  passport.authenticate('twitter'));

//on completion of authentication
app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect();
  });

 

  app.listen(3000, () => {
      console.log("Connection Successful");
  })


 

var express = require("express");
var app = express();
const path = require('path');
const publicPath = path.join(__dirname, './views');
app.use('/', express.static(publicPath));

var bodyParser = require("body-parser");
var db = '';
app.use(bodyParser.urlencoded({ extended: true }));

var  mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');


mongoose.connect('mongodb://localhost:27017/OneDirectApp');
var tweetSchema = require('./data').tweetSchema;
tweetSchema.plugin(beautifyUnique);


const hbs = require('hbs');//handle bar
app.set('view engine','hbs');//to set the view engine to hbs

var username = '';
var tableName = '';


//getting the session
var session = require('express-session');
app.use(session({secret: 'secret',
                saveUninitialized: false,
                resave: false
                }));

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
 
app.post('/',(req, res) => {
 username = req.body.username;
  console.log(username);
  res.redirect('/auth/twitter');

});
  passport.use(new TwitterStrategy({
    consumerKey: 'FjT9B0QnDjdCqNX3oqZvrW6cT',
    consumerSecret: 'mupq2XqLd3QdA6KzMHFzIb8VVRAvY9vPxSBiCAlrMJOQs8V8wS',
    callbackURL: "http://localhost:3000/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, cb) {
    if (profile) {
      if(profile.username.toLowerCase() !== username.toLowerCase())
        console.log("Error");
      else {
      console.log(profile.username);
        var screen_name = username;
        console.log(screen_name);
        var Tweet = mongoose.model(profile.username, tweetSchema, profile.username);
        var count = 100;
        tableName = Tweet;
        oauth.get( 'https://api.twitter.com/1.1/statuses/home_timeline.json?tweet_mode=extended&screen_name=7PrinceKumar&count=200'
                  , token
                  , tokenSecret
                  , function (e, data, result){
                      if (e) console.error(e); 
                      var data_size = JSON.parse(data).length;
                       for(i=0;i<data_size;i++)
                       {
                        
                        if(((JSON.parse(data))[i].entities['urls']).length>0){
                              
                                   var newTweet = new Tweet({
                            
                                      TweetId:  (JSON.parse(data))[i].user['id'],
                                      TimeStamp: (JSON.parse(data))[i].created_at,
                                      TwitterId: (JSON.parse(data))[i].user['screen_name'],
                                      TweetContentUrl: ((JSON.parse(data))[i].entities['urls'][0])['expanded_url']
                                    });
                        
                                      newTweet.save()
                                          .then(() => console.log('Success saving!'))
                                          .catch(err => {console.log("DUPLICATE")});
                                      }
                      
                  }
                  });
                  return cb(null,profile);
                   }
                  }
        else {
            console.log("Authentication failed.")
        }
  }
));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});



app.get('/', (req,res) => {
  res.render("home.hbs");
});

var done = true;


//to redirect to authentication page of twitter
app.get('/auth/twitter',
  passport.authenticate('twitter'));

//on completion of authentication
app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { failureRedirect: '/login'}),
  function(req, res) {
    res.redirect('/show');
  });

  app.get('/show', function (req,res) {
    tableName.find({}, function(err,tweets) {
      if(err)
        {
          console.log(err);
        }
        else{
      if(done)
        {
          done = false;
          res.redirect('/show');
          return;
        }
      res.render("show.hbs", {tweetList: tweets});
      }
      // else  
        // console.log(tweets);
    })
  });

 

  app.listen(3000, () => {
      console.log("Connection Successful");
  });



 
//---------------------------------------------- SERVER -----------------------------------------------

var express = require("express");
var app = express();
const path = require('path');
const publicPath = path.join(__dirname, './views');
app.use('/', express.static(publicPath));


//----------------------------------------------BODY PARSER----------------------------------------
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));


//----------------------------------------------MONGOOSE CLIENT----------------------------------------
var  mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');//for unique url validation
mongoose.connect('mongodb://localhost:27017/OneDirectApp');
var tweetSchema = require('./schema').tweetSchema;
tweetSchema.plugin(beautifyUnique);


//----------------------------------------------HANDLE BARS----------------------------------------
const hbs = require('hbs');//handle bar
app.set('view engine','hbs');//to set the view engine to hbs

var username = '';
var tableName = "";


//getting the session
var session = require('express-session');
app.use(session({secret: 'secret',
                saveUninitialized: false,
                resave: false
                }));

                
//----------------------------------------------OAUTH-----------------------------------------------

var OAuth = require('OAuth');//to fetch the tweets using twitter api
var oauth = new OAuth.OAuth( 'https://api.twitter.com/oauth/request_token'
                          	, 'https://api.twitter.com/oauth/access_token'
                          	, 'FjT9B0QnDjdCqNX3oqZvrW6cT'
                          	, 'mupq2XqLd3QdA6KzMHFzIb8VVRAvY9vPxSBiCAlrMJOQs8V8wS'
                          	, '1.0A'
                          	, null
                          	, 'HMAC-SHA1' );


//----------------------------------------------PASSPORT -----------------------------------------------

//getting the user authentication to access the data through passport                           
var passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy;


  passport.use(new TwitterStrategy({
    consumerKey: 'FjT9B0QnDjdCqNX3oqZvrW6cT',
    consumerSecret: 'mupq2XqLd3QdA6KzMHFzIb8VVRAvY9vPxSBiCAlrMJOQs8V8wS',
    callbackURL: "http://localhost:3000/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, cb) {
    if (profile) {
      if(profile.username.toLowerCase() !== username.toLowerCase())//making username case insensitive
        { errorMessage  = "You are not authorized to access this account. Please login with the given account on Twitter.";
          console.log("Error");
        
      }
      else {
      console.log(profile.username);
        var screen_name = username;
        console.log(screen_name);
        var Tweet = mongoose.model(profile.username, tweetSchema, profile.username);
        var count = 100;
        tableName = Tweet;
        oauth.get( 'https://api.twitter.com/1.1/statuses/home_timeline.json?tweet_mode=extended&count=200'
                  , token
                  , tokenSecret
                  , function (e, data, result){
                      if (e) console.error(e); 
                      var data_size = JSON.parse(data).length;
                       for(i=0;i<data_size;i++)
                       {
                        //SAVING THE TWEET IN MONGODB IF IT CONTAINS URL
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


//----------------------------------------------PASSPORT-MIDDLEWARE-----------------------------------------------

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});



//---------------------------------------------- ROUTES -----------------------------------------------

app.get('/', (req,res) => {
  res.render("home.hbs");
});

//to redirect to authentication page of twitter
app.get('/auth/twitter',
  passport.authenticate('twitter'));


//on completion of authentication
app.get('/auth/twitter/callback', 
passport.authenticate('twitter', { failureRedirect: '/login'}),
function(req, res) {
  res.redirect('/showDB');
});

app.get('/showDB', function (req,res) {
  if(tableName==null)//Not Working
  {
    res.redirect('/');
    return;
  }
  tableName.find({}, function(err,tweets) {
    if(err)
      {
        console.log(err);
      }

    res.render("show.hbs", {tweetList: tweets});

  })
});

app.get('/error',(req,res) => {
  res.send("ERROR");
})



app.post('/',(req, res) => {
  username = req.body.username;
   console.log(username);
   res.redirect('/auth/twitter');
 
 });


app.listen(3000, () => {
      console.log("Connection Successful");
  });



 
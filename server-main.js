require('dotenv').config();
const express = require('express');
// Bring in our database (db) connection and models
const db = require('./models');
require('dotenv').config();
const app = express();
const axios = require('axios');
const qs = require('qs');
const randomstring = require("randomstring");
var spotifyWebApi = require('spotify-web-api-node');
const bcrypt = require('bcrypt');
const saltRounds = 6;

const PORT = process.env.PORT

app.set('view engine', 'ejs');
app.set('views', 'views');

// Setting up middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded());

/*
// Insert router as middleware
app.use(require('./routes'));
*/

let configString = process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET;
let accessToken = "";
let clientTokenObj = {};

var spotifyApi = new spotifyWebApi();


getAppAccessToken()
    .then(()=> {app.listen(PORT, function(req, res, next) {
        console.log('Server started on port:' + PORT);
    })})

// Initial test-route to check if we can get songs pulled from spotify down and rendered to page
// app.get('/pull-song', (req,res) => {
    
// })
    
app.get('/ping', (req,res,next) => {
    res.send('PONG')
});

// New registration route with connection to users table in database
app.get('/registration2', (req,res,next) => {
    res.render('registration2', {
        pageTitle: 'GTL-Registration'
    })
})

// New registration post route which will bcrypt-hash the users password input, then create
// that user in our users database table
app.post('/registration2', (req,res,next) => {
    console.log('This is the req.body:' + req.body)
    const username = req.body.username
    const email = req.body.email

    bcrypt.hash(req.body.password, saltRounds)
        .then(hashedPass => {
            db.Users.create({ username: username, email: email, password: hashedPass })
                .then(newDbUser => {
                    res.render('regSuccess', {
                        pageTitle: 'Success!'
                    })

                })
        })
})


app.get('/', function(req, res, next) {
    // renders home
    res.render('home');
});

app.get('/testaxios', function(req, res, next) {
    let randomState = randomstring.generate();
    res.redirect(`https://accounts.spotify.com/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3002%2Flogin%2Fcallback&scope=user-read-private%20user-read-email&state=${randomState}&show_dialog=true`);
});

app.get('/testrefresh', function(req, res, next) {
    refreshToken();
    res.send('testing refresh token');
})

app.get('/login', function(req, res, next) {
    res.render('login');
})

app.get('/login/callback', function(req, res, next) {
    //req.query.code = code(if user accepts) req.query.error = error(if user does not accept or error occurs)
    console.log('callback called');
    if(!req.query.error) {
        axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            data: 
                `grant_type=authorization_code&code=${req.query.code}&redirect_uri=http%3A%2F%2Flocalhost%3A3002%2Flogin%2Fcallback`,
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
            auth: {
                username: process.env.CLIENT_ID,
                password: process.env.CLIENT_SECRET
            }
        })
        .then((response) => {
            console.log(response.data);
            clientTokenObj = response.data;
            res.send('received access token');
        })
        .catch((err) => {
            console.error(err);
        })
    } else {
        res.send('You clicked cancel or error occured');
    }
    
})

app.post('/login', function(req, res, next) {
    res.send('Login route');
    // should have authentication
    // redirects to profile
});

app.get('/registration', function(req, res, next) {
    // renders registration
    res.render('registration');
});

app.post('/registration', function(req, res, next) {
    res.send('Registration post route');
    // redirects to /
    
});

app.get('/dashboard', function(req, res, next) {
    // var scope = 'user-read-private user-read-email playlist-modify-private';
    // res.redirect('https://accounts.spotify.com/authorize?' +
    // qs.stringify({
    //   response_type: 'code',
    //   client_id: process.env.CLIENT_ID,
    //   scope: scope,
    //   redirect_uri: process.env.REDIRECT_URI
    // }));
    res.render('dashboard', {
    //Connected Dashboard ejs to page (JQ 5.19)
    });
    // res.send('Profile route');
    // render profile
});

app.get('/display', function(req, res, next) {
    axios({
        url: 'https://api.spotify.com/v1/tracks/?ids=6BvtitRX5lQC87YlA6rq0n,2mtLGVN6xZm93wDG9nvviS,66flQ66BQfCl1yJsaPRNrN,6H0AwSQ20mo62jGlPGB8S6,2rmq49FcJ4U3wh1Z7C9UxE',
        method: 'get',
        params: {
          grant_type: 'client_credentials'
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
      }).then(function(response) {
          //console.log(response.data.tracks)
          res.render('display', {
            pageTitle: "GTL-Test-Song-Pull",  
            songs: response.data.tracks
        });
      }).catch(function(error) {
          console.error(error);
      });
});

app.get('/logout', function(req, res, next) {
    res.send('logout');
    // redirects to /
});




/*=====================================================================================================================================*/
// FUNCTIONS (temporary location)
/*=====================================================================================================================================*/

// Use axios request to get access token from spotify api to make requests for home 
// and display page when user is not logged in
function getAppAccessToken() {
    
return axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    data: qs.stringify({
        grant_type: 'client_credentials'
    }),
    headers: {
        'content-type': 'application/x-www-form-urlencoded',
    },
    auth: {
        username: process.env.CLIENT_ID,
        password: process.env.CLIENT_SECRET
    }
})
.then((result) => {
    accessToken = result.data.access_token;

})
.catch((err) => {
    console.log(err);    
});
}

function clientAccessToken() {

}

function refreshToken() {
    axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        data: 
            `grant_type=refresh_token&refresh_token=${clientTokenObj.refresh_token}`,
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
        auth: {
            username: process.env.CLIENT_ID,
            password: process.env.CLIENT_SECRET
        }
    })
    .then((response) => {
        console.log(response.data);
    })
    .catch((err) => {
        console.error(err);
    })
}
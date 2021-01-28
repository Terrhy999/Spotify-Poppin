const express = require('express'); // Express web server framework
// const { request } = require('http');
const axios = require('axios');
const querystring = require('querystring');
const app = express();

const client_id = config.CLIENT_ID; // Your client id
const client_secret = config.CLIENT_SECRET; // Your secret
const redirect_uri = config.REDIRECT_URI; // Your redirect uri
let access_token;
let refresh_token;

app.listen(8888, () => console.log('Spotify Poppin listening at https://localhost:8888'));
app.use(express.static('public'));

var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

app.get('/login', (req, res) => {

    // your application requests authorization
    const state = generateRandomString(16);
    const scope = 'user-read-private user-read-email';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));


});

app.get('/callback', (req, res) => {

    const code = req.query.code;
    const state = req.query.state;

    axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        params: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code'
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
        }
    })
    .then(res => {
        access_token = res.data.access_token;
        refresh_token = res.data.refresh_token;
        })    
});

app.get('/tokens', (req, res) => {
    console.log(req);
    res.send(access_token);
})

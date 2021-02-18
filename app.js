const express = require('express'); // Express web server framework
// const { request } = require('http');
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const { config } = require('./config.js');
const querystring = require('querystring');
const app = express();

const client_id = config.CLIENT_ID; // Your client id
const client_secret = config.CLIENT_SECRET; // Your secret
const redirect_uri = config.REDIRECT_URI; // Your redirect uri

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
    const scope = 'user-read-private user-read-email playlist-read-private';
    let queryString = querystring.stringify({
                response_type: 'code',
                client_id: client_id,
                scope: scope,
                redirect_uri: redirect_uri,
                state: state
            })
    // res.redirect('https://accounts.spotify.com/authorize?' + queryString);
    res.json({'redirect' : 'https://accounts.spotify.com/authorize?' + queryString});
});

app.get('/callback', async (req, res) => {

    const code = req.query.code;
    const state = req.query.state;

    const params = new URLSearchParams({
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
    });

    const body = {
        method: 'post',
        body: params,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
        }
    };

    const fetch_response = await fetch('https://accounts.spotify.com/api/token', body);
    const json = await fetch_response.json();
    access_token = json.access_token;
    refresh_token = json.refresh_token;

    // res.json({
    //     'access_token': access_token, 
    //     'response_token': refresh_token
    // });

    res.redirect('/playlists.html?' + 
        querystring.stringify({
            access_token: json.access_token,
            refresh_token: json.refresh_token
        }));

    // res.redirect('/playlists.html');
    // .then(res => res.json())
    // .then(json => {
    //     console.log(json);
    //     access_token = json.access_token;
    //     refresh_token = json.refresh_token;
    // }).then(res.redirect('/playlists.html'))
    // res.redirect('/playlists.html');
});

app.get('/userInfo/:tokens', async (req, res) => {
    const tokens = req.params.tokens.split(',');
    const user_access_token = tokens[0];
    const user_refresh_token = tokens[1];

    let userInfo;

    const body = {
        method: 'get',
        headers: {
            'Authorization' : 'Bearer ' + user_access_token
        }
    };

    const fetch_response = await fetch('https://api.spotify.com/v1/me', body);
    const json = await fetch_response.json();
    res.json(json);

})

app.get('/userPlaylists/:tokens', async (req, res) => {
    const tokens = req.params.tokens.split(',');
    const user_access_token = tokens[0];
    const user_refresh_token = tokens[1];

    const body = {
        method: 'get',
        headers: {
            'Authorization' : 'Bearer ' + user_access_token
        }
    };

    const fetch_response = await fetch('https://api.spotify.com/v1/me/playlists', body);
    const json = await fetch_response.json()
    res.json(json);
})

app.get('/playlistTracks/:tokens/:playlistID', async (req, res) => {
    const tokens = req.params.tokens.split(',');
    const user_access_token = tokens[0];
    const user_refresh_token = tokens[1];
    const playlistID = req.params.playlistID;

    const body = {
        method: 'get',
        headers: {
            'Authorization' : 'Bearer ' + user_access_token
        }
    };

    const fetch_response = await fetch(`https://api.spotify.com/v1/playlists/${playlistID}/tracks?market=US&fields=items(track(id))`, body);
    const json = await fetch_response.json()
    res.json(json);
})

app.get('/trackInfo/:tokens/:tracks', async (req, res) => {
    const tokens = req.params.tokens.split(',');
    const user_access_token = tokens[0];
    const user_refresh_token = tokens[1];
    const tracks = req.params.tracks;

    const body = {
        method: 'get',
        headers: {
            'Authorization' : 'Bearer ' + user_access_token
        }
    };

    const fetch_response = await fetch(`https://api.spotify.com/v1/tracks?ids=${tracks}`, body);
    const json = await fetch_response.json();
    res.json(json);
})

app.get('/trackFeatures/:tokens/:tracks', async (req, res) => {
    const tokens = req.params.tokens.split(',');
    const user_access_token = tokens[0];
    const user_refresh_token = tokens[1];
    const tracks = req.params.tracks;

    const body = {
        method: 'get',
        headers: {
            'Authorization' : 'Bearer ' + user_access_token
        }
    };

    const fetch_response = await fetch(`https://api.spotify.com/v1/audio-features?ids=${tracks}`, body);
    const json = await fetch_response.json();
    res.json(json);
})

const express = require('express'); // Express web server framework
// const { request } = require('http');
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
// const { config } = require('./config.js');
require('dotenv').config();
const querystring = require('querystring');
const app = express();
const bodyParser = require('body-parser');

const client_id = process.env.CLIENT_ID; // Your client id
const client_secret = process.env.CLIENT_SECRET; // Your secret
const redirect_uri = process.env.REDIRECT_URI; // Your redirect uri

const PORT = process.env.PORT || 8889

app.listen(PORT, () => console.log('Spotify Poppin listening at http://localhost:8889'));
app.use(express.static('public'));
app.use(bodyParser.text());    

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


    res.redirect('/playlists.html?' + 
        querystring.stringify({
            access_token: json.access_token,
            refresh_token: json.refresh_token
        }));

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

app.get('/userPlaylists/:tokens/:offset', async (req, res) => {
    let offset = req.params.offset;
    const tokens = req.params.tokens.split(',');
    const user_access_token = tokens[0];
    const user_refresh_token = tokens[1];


    const body = {
        method: 'get',
        headers: {
            'Authorization' : 'Bearer ' + user_access_token
        }
    };


    const fetch_response = await fetch(`https://api.spotify.com/v1/me/playlists?limit=50&offset=${offset}`, body);
    const json = await fetch_response.json()
    res.json(json);
})

app.get('/playlistTracks/:tokens/:playlistID', async (req, res) => {
    const tokens = req.params.tokens.split(',');
    const user_access_token = tokens[0];
    const user_refresh_token = tokens[1];
    const playlistID = req.params.playlistID;

    let tracks;

    const body = {
        method: 'get',
        headers: {
            'Authorization' : 'Bearer ' + user_access_token
        }
    };

    const fetch_response = await fetch(`https://api.spotify.com/v1/playlists/${playlistID}/tracks?market=US&fields=items(track(id)),total,offset,limit`, body);
    const json = await fetch_response.json()

    tracks = json;


    const total = json.total;
    
    for (let i = 1; i < Math.ceil(total/100); i++) {
        let offset = i*100;
        const new_fetch_response = await fetch(`https://api.spotify.com/v1/playlists/${playlistID}/tracks?market=US&fields=items(track(id))&offset=${offset}`, body);
        const json = await new_fetch_response.json();
        const new_tracks = json.items;
        tracks.items.push(...new_tracks);
    }


    res.json(tracks);


})

app.post('/trackInfo/:tokens', async (req, res) => {
    const tokens = req.params.tokens.split(',');
    const user_access_token = tokens[0];
    const user_refresh_token = tokens[1];
    let tracksString = req.body;

    let tracksArray = tracksString.split(',');

    let requestNumber = Math.ceil((tracksArray.length/50));
    
    let tracks = [];

    const fetch_body = {
        method: 'get',
        headers: {
            'Authorization' : 'Bearer ' + user_access_token
        }
    };

    for (let i = 0; i < requestNumber; i++) {
        let fetch_array = tracksArray.slice(i*50, (i+1)*50);
        // console.log(fetch_array);
        let fetch_tracks = fetch_array.toString();
        const fetch_response = await fetch(`https://api.spotify.com/v1/tracks?ids=${fetch_tracks}`, fetch_body);
        const json = await fetch_response.json();
        const response_tracks = json.tracks;
        tracks.push(...response_tracks);
    }
    res.json(tracks);

})

app.post('/trackFeatures/:tokens', async (req, res) => {
    const tokens = req.params.tokens.split(',');
    const user_access_token = tokens[0];
    const user_refresh_token = tokens[1];
    let tracksString = req.body;

    let tracksArray = tracksString.split(',');
    
    let requestNumber = Math.ceil((tracksArray.length/100));

    let tracks = [];

    const fetch_body = {
        method: 'get',
        headers: {
            'Authorization' : 'Bearer ' + user_access_token
        }
    };

    for (let i = 0; i < requestNumber; i++) {
        let fetch_array = tracksArray.slice(i*100, (i+1)*100);
        let fetch_tracks = fetch_array.toString();
        const fetch_response = await fetch(`https://api.spotify.com/v1/audio-features?ids=${fetch_tracks}`, fetch_body);
        const json = await fetch_response.json();
        const response_tracks = json.audio_features;
        tracks.push(...response_tracks);
    }

    res.json(tracks);
})

app.get('/refreshToken/:refreshToken', async (req, res) => {
    const refreshToken = req.params.refreshToken;

    const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    });

    const fetch_body = {
        method: 'post',
        body: params,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
        }
    };

    const fetch_response = await fetch('https://accounts.spotify.com/api/token', fetch_body);
    const json = await fetch_response.json();
    res.json(json);

})

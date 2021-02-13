// const { default: fetch } = require("node-fetch");

let access_token = '';
let refresh_token = '';
let playlists;

const getTokens = async () => {
    const fetch_response = await fetch('/tokens');
    const json = await fetch_response.json();
        access_token = json.access_token;
        refresh_token = json.refresh_token;
}

const getUserInfo = async () => {
   
    const fetch_response = await fetch(`/userInfo/${access_token},${refresh_token}`);
    const json = await fetch_response.json();
    console.log(json);
}

const getUserPlaylists = async () => {
    const fetch_response = await fetch(`/userPlaylists/${access_token},${refresh_token}`);
    const json = await fetch_response.json();
    console.log(json);
    playlists = json.items;
}

// function onLoad() {
//     getTokens();
//     console.log(access_token);
//     console.log(refresh_token);
//     getUserInfo();
// }

const onLoad = async() => {
    await getTokens();
    console.log(access_token);
    console.log(refresh_token);
    await getUserInfo();
    await getUserPlaylists();
    populatePlaylists(playlists);
    await trackInfo(await getTracks('37i9dQZF1EuS8nwZ2VdXCQ'));
}

function populatePlaylists(list) {
    let element = document.getElementById('playlists');
    for (let i = 0; i < list.length; i++) {
        let li = document.createElement('li');
        li.appendChild(document.createTextNode(list[i].name));
        element.appendChild(li);
    } 
}

const getTracks = async (playlistID) => {
    const fetch_response = await fetch(`/playlistTracks/${access_token},${refresh_token}/${playlistID}`);
    const json = await fetch_response.json();
    const tracks = json.items
    // console.log(getTrackIDs(tracks));
    return getTrackIDs(tracks);
}

const trackInfo = async (tracks) => {
    const tracksString = tracks.toString();
    const fetch_response = await fetch(`/trackInfo/${access_token},${refresh_token}/${tracksString}`);
    const json = await fetch_response.json();
    console.log(json);
}

function getTrackIDs(tracks) {
    let trackArray = [];
    for(let i =0; i < tracks.length; i++) {
        trackArray.push(tracks[i].track.id);
    }
    return trackArray;
}


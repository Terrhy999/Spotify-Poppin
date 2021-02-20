

let access_token;
let refresh_token;

let playlistTrackInfo = {};

const login = async () => {
    const fetch_response = await fetch('/login');
    const json = await fetch_response.json();
    const redirect = await json.redirect;
    window.location.assign(redirect);
}

function getURLParams() {
    if(localStorage.getItem("access_token") === null) {
        let params = new URLSearchParams(window.location.search.substring(1));
        let user_access_token = params.get("access_token");
        let user_refresh_token = params.get("refresh_token");
        localStorage.setItem('access_token', user_access_token);
        localStorage.setItem('refresh_token', user_refresh_token);
    }
    
    access_token = localStorage.getItem('access_token');
    refresh_token = localStorage.getItem('refresh_token');
}

const getUserInfo = async () => {
   
    const fetch_response = await fetch(`/userInfo/${access_token},${refresh_token}`);
    const json = await fetch_response.json();
    return json;
}

const getUserPlaylists = async (offset) => {
    const fetch_response = await fetch(`/userPlaylists/${access_token},${refresh_token}/${offset}`);
    const json = await fetch_response.json();
    return json;
}

// function onLoad() {
//     getTokens();
//     console.log(access_token);
//     console.log(refresh_token);
//     getUserInfo();
// }

const onLoad = async() => {
    getURLParams();
    let playlists = await getUserPlaylists(0);
    playlists = playlists.items;
    populatePlaylists(playlists);
}

function getTrackURLParams() {
    let params = new URLSearchParams(window.location.search.substring(1));
    let playlistID = params.get('playlistID');
    access_token = localStorage.getItem('access_token');
    refresh_token = localStorage.getItem('refresh_token');
    return playlistID;
}

const onLoadTracks = async() => {
    const playlistID = getTrackURLParams();
    const trackIDs = await getTracks(playlistID);
    const filteredTrackIDs = trackIDs.filter(track => track != null);
    const currentTrackInfo = await trackInfo(filteredTrackIDs);
    const currentTrackFeatures = await trackFeatures(filteredTrackIDs);
    playlistTrackInfo.tracks = currentTrackInfo;
    playlistTrackInfo.audio_features = currentTrackFeatures;
    const tracks = playlistTrackInfo.tracks;
    populateTracks(tracks);
}

function populatePlaylists(list) {
    let element = document.getElementById('playlists');
    for (let i = 0; i < list.length; i++) {
        let li = document.createElement('li');
        li.appendChild(document.createTextNode(list[i].name));
        li.id = list[i].id;
        li.addEventListener('click', () => tracksRedirect(li.id));
        element.appendChild(li);
    } 
}

const tracksRedirect = (playlistID) => {
    const redirect = `/tracks.html?playlistID=${playlistID}`;
    window.location.assign(redirect);
}

function populateTracks(list) {
    let element = document.getElementById('tracks');
    for (let i = 0; i < list.length; i++) {
        let li = document.createElement('li');
        li.appendChild(document.createTextNode(list[i].name));
        element.appendChild(li);
    }
}

const getTracks = async (playlistID) => {
    const fetch_response = await fetch(`/playlistTracks/${access_token},${refresh_token}/${playlistID}`);
    const json = await fetch_response.json();
    const tracks = json.items;
    return getTrackIDs(tracks);
}

const trackInfo = async (tracksArray) => {
    const tracksString = tracksArray.toString();
    const fetch_response = await fetch(`/trackInfo/${access_token},${refresh_token}`, {
        method: 'post',
        'content-type': 'text/plain',
        body: tracksString 
    });
    const json = await fetch_response.json();
    return json;
}

const trackFeatures = async (tracks) => {
    const tracksString = tracks.toString();
    const fetch_response = await fetch(`/trackFeatures/${access_token},${refresh_token}`, {
        method: 'post',
        'content-type': 'text/plain',
        body: tracksString
    });
    const json = await fetch_response.json();
    return json;
}

// const trackFeatures = async (tracks) => {
//     const tracksString = tracks.toString();
//     const fetch_response = await fetch(`/trackFeatures/${access_token},${refresh_token}/${tracksString}`);
//     const json = await fetch_response.json();
//     console.log(json);
// }

function getTrackIDs(tracks) {
    let trackArray = [];
    for(let i =0; i < tracks.length; i++) {
        trackArray.push(tracks[i].track.id);
    }
    return trackArray;
}

function sortTracks(category, object) {
    let trackInfo = [];
    let tracks = playlistTrackInfo[object];
    let trackNames = playlistTrackInfo.tracks;

    for (let i = 0; i < tracks.length; i++) {
        trackInfo.push([trackNames[i].name ,tracks[i][category]]);
    }

    trackInfo.sort((a, b) => b[1] - a[1]);

    console.log(trackInfo);

    changeTrackOrder(trackInfo);
}

function changeTrackOrder(sortedTracks) {
    let element = document.getElementById('tracks');
    let trackElements = element.children;
    for (let i = 0; i < element.childElementCount; i++) {
        trackElements[i].childNodes[0].textContent = sortedTracks[i][0];
    }
}


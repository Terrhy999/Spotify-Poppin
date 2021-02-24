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
    if (localStorage.getItem("access_token") === null) {
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


const onLoad = async () => {
    getURLParams();
    let playlists = await getUserPlaylists(0);

    if (playlists.hasOwnProperty('error')) {
        if (playlists.error.status == 401) {
            let newTokens = await refreshToken(refresh_token);
            localStorage.setItem('access_token', newTokens.access_token);
            onload();
        }
    }

    populatePlaylists(playlists.items);
}

const refreshToken = async (token) => {
    const fetch_response = await fetch(`/refreshToken/${token}`);
    const json = fetch_response.json();
    return json;
}

function getTrackURLParams() {
    let params = new URLSearchParams(window.location.search.substring(1));
    let playlistID = params.get('playlistID');
    access_token = localStorage.getItem('access_token');
    refresh_token = localStorage.getItem('refresh_token');
    return playlistID;
}

const onLoadTracks = async () => {
    const playlistID = getTrackURLParams();
    const tracks = await getTracks(playlistID);

    if(tracks.hasOwnProperty('error')) {
        if(tracks.error.status == 401) {
            let newTokens = await refreshToken(refresh_token);
            localStorage.setItem('access_token', newTokens.access_token);
            onLoadTracks();
        }
    }

    const trackIDs = getTrackIDs(tracks.items);
    const filteredTrackIDs = trackIDs.filter(track => track != null);
    const currentTrackInfo = await trackInfo(filteredTrackIDs);
    const currentTrackFeatures = await trackFeatures(filteredTrackIDs);
    playlistTrackInfo.tracks = currentTrackInfo;
    playlistTrackInfo.audio_features = currentTrackFeatures;
    populateTracksTable(playlistTrackInfo);
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


function populateTracksTable(list) {
    let table = document.getElementById('tracksTable');
    for (let i = 0; i < list.tracks.length; i++) {
        let tr = document.createElement('tr');
        table.appendChild(tr);

        let tdName = document.createElement('td');
        tdName.dataset.sortOrder = "";
        tdName.appendChild(document.createTextNode(list.tracks[i].name));
        tr.appendChild(tdName);

        let tdEnergy = document.createElement('td');
        tdEnergy.dataset.sortOrder = "";
        tdEnergy.appendChild(document.createTextNode(list.audio_features[i].energy));
        tr.appendChild(tdEnergy);

        let tdValence = document.createElement('td');
        tdValence.dataset.sortOrder = "";
        tdValence.appendChild(document.createTextNode(list.audio_features[i].valence));
        tr.appendChild(tdValence);

        let tdDanceability = document.createElement('td');
        tdDanceability.dataset.sortOrder = "";
        tdDanceability.appendChild(document.createTextNode(list.audio_features[i].danceability));
        tr.appendChild(tdDanceability);

        let tdInstrumentalness = document.createElement('td');
        tdInstrumentalness.dataset.sortOrder = "";
        tdInstrumentalness.appendChild(document.createTextNode(list.audio_features[i].instrumentalness));
        tr.appendChild(tdInstrumentalness);

        let tdPopularity = document.createElement('td');
        tdPopularity.dataset.sortOrder = "";
        tdPopularity.appendChild(document.createTextNode(list.tracks[i].popularity));
        tr.appendChild(tdPopularity);

    }
}

const getTracks = async (playlistID) => {
    const fetch_response = await fetch(`/playlistTracks/${access_token},${refresh_token}/${playlistID}`);
    const json = await fetch_response.json();
    return json;
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


function getTrackIDs(tracks) {
    let trackArray = [];
    for (let i = 0; i < tracks.length; i++) {
        trackArray.push(tracks[i].track.id);
    }
    return trackArray;
}


function changeTrackOrder(sortedTracks) {
    let element = document.getElementById('tracks');
    let trackElements = element.children;
    for (let i = 0; i < element.childElementCount; i++) {
        trackElements[i].childNodes[0].textContent = sortedTracks[i][0];
    }
}

function trackSort(sortIndex) {
    let table = document.getElementById('tracksTable');
    let rows = table.rows;
    let rowsArray = Array.from(rows);
    rowsArray.shift();





    if (rowsArray[0].cells[sortIndex].dataset.sortOrder) {

        if(sortIndex == 0) {
            rowsArray.sort((a,b) => b.cells[sortIndex].innerText.localeCompare(a.cells[sortIndex].innerText));
            rowsArray.forEach(row => {
                row.cells[sortIndex].dataset.sortOrder = '';
                table.appendChild(row);
            });
            return;
        }

        rowsArray.sort((a, b) => b.cells[sortIndex].innerText - a.cells[sortIndex].innerText);
        rowsArray.forEach(row => {
            row.cells[sortIndex].dataset.sortOrder = '';
            table.appendChild(row);
        });
        return;
    }

    if (!rowsArray[0].cells[sortIndex].dataset.sortOrder) {

        if(sortIndex == 0) {
            rowsArray.sort((a,b) => a.cells[sortIndex].innerText.localeCompare(b.cells[sortIndex].innerText));
            rowsArray.forEach(row => {
                row.cells[sortIndex].dataset.sortOrder = 'asc';
                table.appendChild(row);
            });
            return;
        }
        
        rowsArray.sort((a, b) => a.cells[sortIndex].innerText - b.cells[sortIndex].innerText);
        rowsArray.forEach(row => {
            row.cells[sortIndex].dataset.sortOrder = "asc";
            table.appendChild(row);
        });
        return;
    }



}


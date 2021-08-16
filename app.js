const request = require("request");
const fs = require('fs');
const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');
const TradeOfferManager = require('steam-tradeoffer-manager');
const SteamTotp = require('steam-totp');
const readline = require('readline-sync');
const opn = require('opn');



let checkInterval = 10;
let sent = 0;
let missedRequests = 0;

const community = new SteamCommunity();
const client = new SteamUser();
const toTurbo = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=E8011197F1051606539EBE123179C537&steamids=76561198286915214,76561198797936825"

const manager = new TradeOfferManager({
    "steam": client,
    "language": "en",
    "pollInterval": "2000",
    "cancelTime": "900000" // 15 minutes in ms
});


client.logOn({
    accountName: "",
    password: ""
});

// client.setOption("promptSteamGuardCode", false);

// client.on('steamGuard', function(domain, callback) {
// 	var code = SteamTotp.generateAuthCode("")
// 	callback(code);
// });

client.on('loggedOn', () => {
    console.log('Successfully Logged On.');
})

client.on('webSession', (sessionid, cookies) => {
    manager.setCookies(cookies, (err) => {
		if (err) return console.log("There was an error grabbing cookies" + err);
        console.log(cookies)
        loadURLs((urls) => {
            var turbo = setInterval(() => {checkStatus(urls,turbo)}, checkInterval)
        });
    });

});



function loadURLs(callback) {
    request(toTurbo, (error, response, body) => {
        if (error) return console.log("Error loading the page: " + error),missedRequests++;
		try {
            let parsed = JSON.parse(body);
            let urls = {};
            for (let i = 0; i < parsed.response.players.length; i++) {
                let b = parsed.response.players[i].profileurl;
                let a = parsed.response.players[i].steamid;
                urls[i] = {"steamid":a,"profileurl":b}
                // urls[i].profileurl = b
            }
            callback(urls)
		}
		catch (e) {
            console.log(e);
        }
    });
}

function checkStatus(urls,turbo) {
	request(toTurbo, (error, response, body) => {
		if (error) return console.log("Error loading the page: " + error),missedRequests++;
		try {
            let parsed = JSON.parse(body);
            for (let i = 0; i < parsed.response.players.length; i++) {
                let steamid = urls[i].steamid;
                let oldurl = urls[i].profileurl;
                let playersteamid = parsed.response.players[i].steamid;
                let url = parsed.response.players[i].profileurl;
                let id = oldurl.slice(29)
                if (steamid == playersteamid && url != oldurl) {
                    clearInterval(turbo);
                    claim(id);
                    return;
                }
                // urls[i].profileurl = b
            }
            
		}
		catch (e) {
            console.log(e);
        }
        
        sent++;
        console.log("Sent "+sent+" requests with "+missedRequests+" missed requests!\033[0G");
	});
}





var claim = (function(id) {
    var hasclaimed = false;
    return function(id) {
        if (!hasclaimed ) {
            hasclaimed = true;
            console.log("Turboing");
            setClaim(id); 
        }
    };
})();

function setClaim(id) {
    let update = id.replace(/\//g, '');
    community.httpRequestPost({
        "uri": "https://steamcommunity.com/id_1234567/edit/",
        "form": { "type": "profileSave" }
    }, function (err, response, body) {
        if (err) console.log(err)
        console.log("body"+body);
        // console.log(response)
    }, "steamcommunity");

}


// ==UserScript==
// @name         Pluralsight
// @author       Mike Vickers
// @namespace    http://vespersoft.net/
// @description  Uploads and maintains pluralsight data
// @downloadURL  https://github.com/vickersm/TamperMonkey/raw/master/Pluralsight.user.js
// @version      1.51
// @match        https://app.pluralsight.com/*
// @grant        GM_xmlhttpRequest
// @run-at       document-body
// ==/UserScript==

// Script Constants
var scriptName = "Pluralsight";
var SESSION_LOG = "TM_PS_Log";
var USER_NAME = "TM_PS_User";
var basePath = "https://app.pluralsight.com/";
var pollInMs = 500;
var debug = false;

// Slack Channels
var dbg = "BGMT2260M/4ZUUezTftWxSA7xBBRF2r8Kv";
var plu = "BHBB9APDY/PJN8CgYnNPigIUKPuvzrBW2X";
function Send_SlackBotMessage(channel, msg) {
	if (debug) channel = dbg;
	log("Send_SlackBotMessage", {"message": msg, "channel":channel});

	GM_xmlhttpRequest({
	  method: "POST",
	  url: "https://hooks.slack.com/services/TGKSD3YSG/"+channel,
	  data: JSON.stringify({"text": msg}),
	  headers: {
		"Content-Type": "application/json"
	  },
	  onload: function(response) {
		console.log(response);
	  }
	});
}

// Log functions
function log(message) {
	var preamble = "[TM: "+scriptName+"]";
	if (typeof arguments[0] === "string") {
		arguments[0] = preamble+' '+message;
	} else {
		Array.prototype.unshift.call(arguments, preamble);
	}
	console.log.apply(null, arguments);
}
function logU(message) {
	var suffix = "for: " + document.URL;
	if (typeof arguments[0] === "string") {
		arguments[0] = message+' '+suffix;
	} else {
		Array.prototype.unshift.call(arguments, suffix);
	}
	log.apply(null, arguments);
}

// Storage functions
var valueCache = {};
function getValue(name, toJson) { //GM_getValue(name);
	var value = localStorage[name];
	if (!value && toJson) return null;
	return toJson ? JSON.parse(value) : value;
}
function setValue(name, value) { //GM_setValue(name, value);
	if (typeof value === "object")
		value = JSON.stringify(value);
	localStorage.setItem(name, value);
}
function addValueChangeListener(name, callback) { //GM_addValueChangeListener(name, callback);
	var new_value = getValue(name);
	if (!valueCache[name]) valueCache[name] = new_value;
	var old_value = valueCache[name];
	if (old_value != new_value) {
		valueCache[name] = new_value;
		callback(name, old_value, new_value, false);
	}
	setTimeout(function() {addValueChangeListener(name, callback)}, pollInMs);
}
function valueChanged(name, old_value, new_value, remote) {
	if (debug) log("value changed:", arguments);
}

// Helper functions
function getRequestParams() {
	var search = location.search.substring(1); if (search === "") return {};
	var obj = '{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}';
	if (debug) log("RequestParamParser", {"params": search, "string": obj});
	function decode(key, value) {return key===""?value:decodeURIComponent(value)};
	return JSON.parse(obj, decode);
}
function getElem(selectors, root) {
	if (!root) root = document;
	var val = root.querySelectorAll(selectors);
	return val;
}
var sessLog = {
	user: function() {
		var firstName = "firstName---3WiEb";
		var email = "email---1vkoh";

		// Grab username from session, shortcircuit if not an email
		var user = getValue(USER_NAME);
		if (user && user.length > 0 && !user.includes("@")) return user;

		// Try and find username div, and default to email if not present
		var divs = document.getElementsByClassName(firstName);
		if (divs.length == 0 || divs[0].innerText.length == 0) divs = document.getElementsByClassName(email);
		if (divs.length == 0 || divs[0].innerText.length == 0) return user;

		user = divs[0].innerText;
		if (debug) log("TryGetUser", {"session":getValue(USER_NAME), "divs": divs, "text":user});

		setValue(USER_NAME, user);
		return user;
	},
	isDirty: function(root) {
		if (arguments.length == 0) root = sessLog;
		if (!root) return false;

		var test = JSON.stringify(root);
		return test.indexOf("isDirty") > 0;
	},
	sendDiffs: function() {
		var array = [];
		var changed = false;

		try	{
			// Saved Scores
			var scores = [];
			if (this.isDirty(sessLog.Scores)) {
				Object.keys(sessLog.Scores).sort().forEach(function(name) {
					if (sessLog.Scores.hasOwnProperty(name) && sessLog.Scores[name].isDirty) {
						var cur = sessLog.Scores[name];
						var prev = (cur.Prev && cur.Prev != cur.Score) ? " (previously _" + cur.Prev + "_)" : "";
						var date = (cur.Date) ? cur.Date : "";
						date = (date == new Date().toLocaleDateString()) ? "" : " on _"+date+"_";
						var msg = "• <" + basePath + cur.Link + "|" + name + "> - *"+cur.Score+"*" + prev + date;

						// Queue message and unset dirty flag
						scores.push(msg); delete cur.isDirty; changed = true;
					}
				});

				if (scores.length > 0) {
					if (scores.length > 1) scores.unshift("*New Assessment Scores:*");
					else scores[0] = "New Assement: " + scores[0].replace("• ", "");
					array = array.concat(scores);
				}
			}

			// Saved Courses

		}
		catch(err) {
			// Notify debug channel the error
			Send_SlackBotMessage(dbg, "Error in sendDiffs: "+err);
		}

		// Message slack if any messages to send
		if (array.length > 0) {
			// Prepend user
			if (array.length == 1) array[0] = this.user()+"'s "+array[0];
			else array.unshift(this.user()+" has the following changes:");

			var msg = array.join("\r\n");
			Send_SlackBotMessage(plu, msg);

		} else {
			logU("Found no new data to ingest during sessLog.sendDiffs()");
		}

		return changed;
	},
	save: function() {
		var changed = this.sendDiffs();
		setValue(SESSION_LOG, sessLog);
	},
	load: function() {
		var data = getValue(SESSION_LOG, true);
		if (!data) return;
		Object.assign(sessLog, data);
	},
};

// Pluralsight Functions
function monitorCourse(type, params) {
	// URL Example: player?course=front-end-web-app-html5-javascript-css&author=shawn-wildermuth&name=front-end-web-app-html5-javascript-css-m01&clip=1&mode=live

	// Grab video start (if not present)

	// Record video finish

	// Save any work done
	sessLog.save();
}
function monitorSkill(type, params) {
	// URL Example: paths/skill/python

	// Elements
	var LINK	= "p._3vqCgZkZ a";
	var TITLE = "h1._2tRFl44w";
	var SCORE = "span._2ttjtNXi";

	// Jump out if no results on page yet
	if (getElem(SCORE).length == 0) {
		log("On a Skills page, but no score found");
		return;
	}


	// Acquire relevant elements
	var link = getElem(LINK)[0].href;
	var name = getElem(TITLE)[0].innerText;
	var rank = getElem(SCORE)[0].innerText;
	var date = "";

	// Save extracted data (if newer)
	LogTestResult(name, link, rank, date);

	// Save any work done
	sessLog.save();
}
function monitorScore(type, params) {
	// URL Example: score/skill-assessment/python?context=paths&path_type=skill&path_url=python

	// Elements
	var TITLE = "h2.assessmentTitle__hlB2e"
	var SCORE = "div.score__2Ui_L";
	var TAKEN = "h3.assessmentDate__Oy0SV";
	var BADGE = "div.skillBadge__2Z4_p";

	// Jump out if no results on page yet
	if (getElem(BADGE).length == 0) {
		log("On a Score page, but no results found");
		return;
	}

	// Acquire relevant elements
	var link = location.href;
	var name = getElem(TITLE)[0].firstChild.nodeValue;
	var rank = getElem(SCORE)[0].innerText;
	var date = getElem(TAKEN)[0].innerText;

	// Massage results
	name = name.trim().slice(0,-1);
	date = date.trim().split(" ")[1];

	// Save extracted data (if newer)
	LogTestResult(name, link, rank, new Date(date));

	// Save any work done
	sessLog.save();
}
function monitorProfile(type, params) {
	// URL Example: profile/vghazard

	// Elements
	var CARDS	 = "div.skillMeasurementCard---3fa8s";
	var DETAIL = "div.detailsHover---rhxOw a";
	var HEADER = "div.skillMeasurementHeader---C3xkX h3";
	var RESULT = "div.level---2yI1B";
	var SCORED = "div.verifiedDate---26MdF";

	// Select out existing courses
	var cards = getElem(CARDS);
	var msg = "";

	// Parse out data
	for (var c = 0; c < cards.length; c++)
	{
		var card = cards[c];

getElem("div.skillMeasurementCard---3fa8s div.detailsHover---rhxOw a", document)
		// Acquire relevant elements
		var link = getElem(DETAIL, card)[0].href;
		var name = getElem(HEADER, card)[0].innerText;
		var rank = getElem(RESULT, card)[0].innerText;
		var date = getElem(SCORED, card)[0].innerText;

		// Massage results
		rank = rank.trim().split(" ")[1];
		date = date.trim().split(" ")[1];

		// Save extracted data (if newer)
		LogTestResult(name, link, rank, new Date(date));
	}

	// Save any work done
	sessLog.save();
}

// Session Logging functions
function LogTestResult(name, link, rank, date) {
	// Initializations
	link = link.replace(basePath, "").split("?")[0];
	sessLog.Scores = sessLog.Scores || {};
	var cur = sessLog.Scores[name] || {};

	// Check to see if repo is already current for given vals
	if (debug) debugger;
	if ((date == "" || date <= new Date(cur.Date)) && cur.Score == rank) return;

	// Update current element
	if (cur.Score) cur.Prev = cur.Score;
	cur.Score = rank;
	if (date) cur.Date = date.toLocaleDateString();
	cur.Name = name;
	cur.Link = link;

	cur.isDirty = true;
	sessLog.Scores[name] = cur;
}
// functions: LogPath, LogCourse, LogRole?

// Main function
function Main() {
	// Declarations
	var type = document.URL.replace(basePath, "");
	var params = getRequestParams();
	if (debug) log("Main function start", {"URL": type, "params": params});

	// Load values from persistant storage
	sessLog.load();

	if (debug) {
		addValueChangeListener(SESSION_LOG, valueChanged);
		addValueChangeListener(USER_NAME, valueChanged);
	}

	try {
		// Monitor progress based on route
		if (type.startsWith("profile/")) monitorProfile(type, params);
		if (type.startsWith("player/")) monitorCourse(type, params);
		if (type.startsWith("paths/skill/")) setTimeout(function() {monitorSkill(type, params)}, 2000);
		if (type.startsWith("score/skill-assessment/")) monitorScore(type, params);
	}
	catch(err) {
		// Notify debug channel
		Send_SlackBotMessage(dbg, "Error while monitoring: "+err);
	}
}

// Wait until doc loaded
document.onreadystatechange = function () {
    if (document.readyState == "complete") {
		setTimeout(Main, 200);
    }
}

// (function() {
//     'use strict';

//     main();
// })();

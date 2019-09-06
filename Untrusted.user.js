// ==UserScript==
// @name		Untrusted
// @author		Mike Vickers
// @namespace	http://vespersoft.net/
// @description	Watches for level changes in Untrusted.js game
// @downloadURL	http://createthebehavior.com/tm/Untrusted.user.js
// @version		1.2
// @match		https://alexnisnevich.github.io/untrusted/
// @grant		GM_xmlhttpRequest
// @run-at		document-body
// ==/UserScript==

// Script Constants
const scriptName = "Untrusted";
const BASE_PATH = "https://alexnisnevich.github.io/untrusted";
const CUR_LEVEL = "levelReached";
const USER_NAME = "curUser";
const POLLINGMS = 200;
const debug = false;

// Slack Channels
var dbg = "BGMT2260M/4ZUUezTftWxSA7xBBRF2r8Kv";
var rnd = "BHVSXJWVB/OGUEF549H6cOddggGYTohXua";
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
function TryGetUser() {
	// Grab username from session, shortcircuit if not an email
	var user = getValue(USER_NAME);
	if (user && user.length) return user;

	// Try and find username div, and default to email if not present
	user = prompt("Enter your name");
	if (debug) log("TryGetUser", {"session":getValue(USER_NAME), "text":user});

	setValue(USER_NAME, user);
	return user;
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

// Storage functions (Replaces: GM_getValue, GM_setValue, GM_addValueChangeListener)
var valueCache = {};
function getValue(name, toJson) {
	var value = localStorage[name];
	if (!value && toJson) return null;
	return toJson ? JSON.parse(value) : value;
}
function setValue(name, value) {
	if (typeof value === "object") value = JSON.stringify(value);
	localStorage.setItem(name, value);
}
function addValueChangeListener(name, callback) {
	var new_value = getValue(name);
	if (!valueCache.hasOwnProperty(name)) valueCache[name] = new_value;
	var old_value = valueCache[name];
	if (old_value != new_value) {
		valueCache[name] = new_value;
		callback(name, old_value, new_value, false);
	}
	setTimeout(function() {addValueChangeListener(name, callback)}, POLLINGMS);
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

// Main functions
function valueChanged(name, old_value, new_value, remote) {
	if (debug) log("value changed:", arguments);

	var msg = "["+scriptName+"] "+TryGetUser() + " has ";
	msg += (new_value < 22)
		? "reached level `" + new_value + "`"
		: "beat the game!";

	Send_SlackBotMessage(rnd, msg);
}
function Main() {
	try {
		// Declarations
		TryGetUser();
		var type = document.URL.replace(BASE_PATH, "");
		var params = getRequestParams();
		if (debug) log("Main function start", {"URL": type, "params": params});

		addValueChangeListener(CUR_LEVEL, valueChanged);
	}
	catch(err) {
		// Notify debug channel
		Send_SlackBotMessage(dbg, "Main Error: "+err);
	}
}

// Wait until doc loaded
document.onreadystatechange = function () {
    if (document.readyState == "complete") {
		setTimeout(Main, 200);
    }
}
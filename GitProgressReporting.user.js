// ==UserScript==
// @name        Git Progress Reporting
// @namespace   https://devinsight.slack.com/team/UGKTP5KNE
// @version     1.6.2
// @downloadURL http://www.createthebehavior.com/tm/GitProgressReporting.user.js
// @description Sends progress updates from interactive Git to Slack
// @author      Mike Vickers
// @include     https://learngitbranching.js.org/*
// @grant       GM_xmlhttpRequest
// @connect     hooks.slack.com
// ==/UserScript==


// Script Constants
const scriptName = "GitProgress";
const STORAGEKEY = "solvedMap";
const CMDHISTORY = "lgb_CommandHistory";
const FIRST_NAME = "firstName"
const resendLast = "?resend";
const pollInMs = 1000;
const debug = false;

// Slack Channels
var dbg = "BGMT2260M/4ZUUezTftWxSA7xBBRF2r8Kv";
var git = "BGLTCS89E/nhyW5WBpaxsOQX0GH7OYNR0z";

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
function getValue(name, toJson) {
    // Alternative: GM_getValue(name);
	var value = localStorage[name];
	if (!value && toJson) return null;
	return toJson ? JSON.parse(value) : value;
}
function setValue(name, value) {
    // Alternative: GM_setValue(name, value);
	if (typeof value === "object")
		value = JSON.stringify(value);
	localStorage.setItem(name, value);
}
function addValueChangeListener(name, callback) {
    // Alternative: GM_addValueChangeListener(name, callback);
	var new_value = getValue(name);
	if (!valueCache.hasOwnProperty(name)) valueCache[name] = new_value;
	var old_value = valueCache[name];
	if (old_value != new_value) {
		valueCache[name] = new_value;
		callback(name, old_value, new_value, false);
	}
	setTimeout(function() {addValueChangeListener(name, callback)}, pollInMs);
}

// Monitoring functions
function testChanged(name, old_value, new_value, remote)
{
    if (name == STORAGEKEY) valChanged(new_value);
}
function valChanged(e)
{
	var levels = Object.keys(JSON.parse(e));
	var lastLvl = levels[levels.length-1];
	var history = getValue(CMDHISTORY, true);
	var commands = []; // Array log of commands used
	var resetLine = 0; // which line, if any, did reset happen on?
	var loggedIssue = false; // only log once

	for (var x = 0; x < history.length; x++) {
		var curLine = history[x];
		if (curLine.includes("hint") || curLine.includes("help")) continue;

		// Potential bug if levels done out of order perhaps?
		if (curLine.includes("level "))
		{
			// found the start of most recent completed level
		    if (curLine == "level "+lastLvl)
		    {
				var moves = commands.length;
				if (resetLine>0) moves = resetLine;
    			var msg = currentUser+" just finished `"+lastLvl+"` in *"+moves+"* move"+((moves>1)?"s":"");
    			if (resetLine>0) msg += " ("+commands.length+" lines w/ reset)";
				logU(lastLvl+" completed. Sending details to Slack");

				if (!currentUser.startsWith("Mike")) {
    				var newLine = '\n$ ';
					var curHist = commands.slice(0, moves).reverse();
    				msg += ':```'+newLine+curHist.join(newLine)+'```';
    			} else {msg += "."}

                // Commit status change to channel history
    			Send_SlackBotMessage(git, msg);
    			break;
    		}
    		else
    		{
    		    // Wrong level?
    		    if (!loggedIssue)
    		    {
        		    var trace = '`'+STORAGEKEY+'` level mechanism issue:```'+e+'```\n```'+getValue(CMDHISTORY)+'```';
    		        logDebug(trace);
    		        loggedIssue = true;
    		    }

    		    commands = [];
    		    resetLine = 0;
    		    continue;
    		}
		}
		// Save where reset happened
		if (curLine.trim() === "reset") resetLine = commands.length;

        // Store commands
		commands.push(curLine.trim());
	}
}

var currentUser = null;
var getUserName = function() {
    var name = getValue(FIRST_NAME);
    if (!name) {
        name = prompt("[TamperMonkey] Please enter your first name.\n\nThis information will be saved in the browsers localStorage\nfrom here on out and used in all future slack communications:");
        if (!name) name = prompt("Are you sure you want to leave it blank?\nWe really need a name to save...\n\nAny name will do!\n");
        if (!name) return null;
        setValue(FIRST_NAME, name.trim());
    }
    return name;
};

(function() {
    'use strict';
    
    // Populate username from storage (or ask)
    currentUser = getUserName();
    logU("Watching for changes", {user: currentUser});

	if (debug)
	{
		// kickoff debug testing
		logU("Running in debug mode");
		currentUser = "Tester";
		git = dbg;
		valChanged(getValue(STORAGEKEY));
		return;
	}

	// Check for resend param
	if (document.URL.includes(resendLast)) {
	    logU("Attempting to retry last sent slack")
		valChanged(getValue(STORAGEKEY));
	}

	// Kick off watch poller for value change
	addValueChangeListener(STORAGEKEY, testChanged);
})();


/* Slack AJAX Messaging calls/webhooks */
function logDebug(message) {
    message = "["+scriptName+": "+currentUser+"]: "+message
    Send_SlackBotMessage(dbg, message);
}

function Send_SlackBotMessage(channel, msg) {
	log("Send_SlackBotMessage", {"message": msg, "channel":channel});
	if (currentUser === "Tester") debugger;

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
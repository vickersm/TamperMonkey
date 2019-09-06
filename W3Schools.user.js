// ==UserScript==
// @name		W3Schools
// @author		Evan Hergert
// @namespace	http://vespersoft.net/
// @description	Watches for changes in W3Schools
// @downloadURL	http://createthebehavior.com/tm/W3Schools.user.js
// @version		1.1
// @match		https://www.w3schools.com/*/exercise*
// @require		http://www.createthebehavior.com/tm/Common.js
// @grant		GM_xmlhttpRequest 
// @run-at		document-body
// ==/UserScript==

// POTENTIAL TO-DOs:
// Only send one message when multiple tabs are open
// Batch sends in [X] min chunks
// Print Username on first capture to Slack
// Report progress on Starting course/finishing
// Exclude script from running on certain sub-paths

// Script Constants
const scriptName = "W3Schools";
const BASE_PATH = "https://www.w3schools.com/";
const USER_NAME = "curUser";
const POLLING_MS = 200;
const debug = false;

// Slack Channels
var w3s = "BHUR4MK41/8wXKvRFD2R097oFlHNWF2Prc";

// Main functions
function valueChanged(key, old_value, new_value, remote) {
	if (debug) log("value changed:", arguments);

	if (!new_value.includes("0")) {
		var core = key.replace("w3exerciseanswers_", "").toUpperCase().split("_");

		var course = core.shift();
		var level = core.join(" ");

		var msg = "<" + document.URL + "|" + course + " Course>: "+GM_getUser() + " has completed the `" + level + "` excercise";


		Send_SlackBotMessage(w3s, msg);
	}
}

/*
https://www.w3schools.com/html/exercise.asp
https://www.w3schools.com/css/exercise.asp
https://www.w3schools.com/js/exercise_js.asp?filename=exercise_js_variables1
https://www.w3schools.com/sql/exercise.asp
https://www.w3schools.com/php/exercise.asp
https://www.w3schools.com/python/exercise.asp?filename=exercise_syntax1
*/

function Main() {
	try {
		// Declarations
		GM_getUser();
		var type = document.URL.replace(BASE_PATH, "");
		var params = GM_getRequestParams();
		dbg_log("Main function start", {"URL": type, "params": params});

        Object.keys(localStorage).map(function (key) {
            addValueChangeListener(key, valueChanged);
        });
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
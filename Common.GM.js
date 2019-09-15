// Script Variables
var USER_NAME = "curUser";

// Implement these in your script:
// @require      https://github.com/vickersm/TamperMonkey/raw/master/Common.GM.js

/* globals GM_getRequestParams, GM_getUser, GM_loaded, GM_wait, GM_clearWait, GM_clearWaits, GM_Debugging */


// GM functions
function GM_getRequestParams() {
	var search = location.search.substring(1); if (search === "") return {};
	var obj = '{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}';
	if (window.debug) log("RequestParamParser", {"params": search, "string": obj});
	function decode(key, value) {return key===""?value:decodeURIComponent(value);}
	return JSON.parse(obj, decode);
}

function GM_getUser() {
	// Grab username from session, short-circuit if not an email
	var user = getValue(USER_NAME);
	if (user && user.length) return user;

	// Try and find username div, and default to email if not present
	user = prompt("Enter your name");
	if (window.debug) log("TryGetUser", {"session":getValue(USER_NAME), "text":user});

	setValue(USER_NAME, user);
	return user;
}

function GM_loaded(func) {
	// Wait until doc loaded
	document.onreadystatechange = function () {
	    if (document.readyState == "complete") {
	    	var recur = (repeat != null && a > 0);
	    	if (!recur) repeat = 200;
	    	GM_wait(func, repeat, recur);
	    }
	};
}

var listenerIDs = [];
function GM_wait(func, timeout, recur) {
	var id = -1;

	if (recur) {
		id = setInterval(func, timeout);
	} else {
		id = setTimeout(func, timeout);
	}

	listenerIDs.push(id);
	return id;
}

function GM_clearWait(id) {
	// Remove from registered id's
	var x = listenerIDs.indexOf(id);
	if (x > -1) listenerIDs = listenerIDs.splice(x, 1);

	clearInterval(id);
}
function GM_clearWaits() {
	for (var x = 0; x < listenerIDs.length; x++)
	{
		var id = listenerIDs[x];
		GM_clearWait(id);
	}
}

function GM_Debugging() {
	var params = GM_getRequestParams();
	if (params.hasOwnProperty("debug")) {
		return (window.debug = true);
	}

	if (window.debug) {
		return true;
	} else {
		return (window.debug = false);
	}
}

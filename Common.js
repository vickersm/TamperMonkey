// Script Variables:
const USER_NAME = "curUser";
const POLLINGMS = 200;
const SLACK_DBG = "BGMT2260M/4ZUUezTftWxSA7xBBRF2r8Kv";
var SLACK_WRKSP = "TGKSD3YSG";

// Implement these in your script:
// @require      https://github.com/vickersm/TamperMonkey/raw/master/Common.js
// @grant        GM_xmlhttpRequest
//	const scriptName = "";

// globals
//	log, logU, dbg_log, dbg_error,
//	xhr_get, xhr_post, Send_SlackBotMessage,
//	getValue, setValue, addValueChangeListener, clearValueChangeListener,
//	getDate, getElems, removeElems, trim,
//	GM_getRequestParams, GM_getUser, GM_loaded, GM_wait, GM_clearWait, GM_clearWaits, GM_RegisterDebugging


//TODO: apply updates from this file into split out files

// Log functions
function log(message) {
	// Declarations
	var preamble = "[TM: "+scriptName+"]";
	var args = arguments;

	// Insert preamble before any args
	if (typeof args[0] === "string") {
		args[0] = preamble+' '+message;
	} else {
		Array.prototype.unshift.call(args, preamble);
	}

	// Pass along logging arguments
	console.log.apply(null, args);
}
function logU(message) {
	// Declarations
	var suffix = "for: " + document.URL;
	var args = arguments;

	// Insert suffix after any args
	if (typeof args[0] === "string") {
		args[0] = message+' '+suffix;
	} else {
		Array.prototype.unshift.call(args, suffix);
	}

	// Pass along logging arguments
	log.apply(null, args);
}
function dbg_log(message) {
	if (window.debug) log(arguments);
}
function dbg_error(funcName, err) {
	// Log error
	dbg_log(funcName+" error", err);

	// Notify debug channel
	Send_SlackBotMessage(dbg, "Error in "+scriptName+"."+funcName+": "+err);

	// Allow chrome debugging
	if (window.debug) debugger;
}

// XHR Requests
function xhr_get(url, callback) {
	dbg_log("xhr_get() called", {"url": url});

	GM_xmlhttpRequest({
	  method: "GET",
	  url: url,
	  onload: function(response) {
		dbg_log("xhr_get.onload", response);
		if (callback) callback(response);
	  }
	});
}
function xhr_post(url, body, callback) {
	dbg_log("xhr_post() called", {"url": url, "body": body});

	GM_xmlhttpRequest({
	  method: "POST",
	  url: url,
	  data: JSON.stringify(body),
	  headers: {
		"Content-Type": "application/json"
	  },
	  onload: function(response) {
		dbg_log("xhr_post.onload() called", {"response": response});
		if (callback) callback(response);
	  }
	});
}


// Slack Messages
function Send_SlackBotMessage(channel, msg) {
	dbg_log("Send_SlackBotMessage() called", {"message": msg, "channel": channel});

	if (window.debug) channel = SLACK_DEBUGCHAN;

	var url = "https://hooks.slack.com/services/"+SLACK_WORKSPACE+"/"+channel;
	var body = {"text": msg};
	xhr_post(url, body);
}

// Storage functions (Replaces: GM_getValue, GM_setValue, GM_addValueChangeListener)
var valueCache = {};
function getValue(name, toJson) {
	dbg_log("getValue() called", {"name": name, "toJson": toJson});

	var value = localStorage[name];

	if (!value && toJson) {
		dbg_log("getValue() returned: EMPTY");
		return null;
	}

	if (toJson) value = JSON.parse(value);
	dbg_log("getValue() found", value);
	return value;
}
function setValue(name, value) {
	dbg_log("setValue() called", {"name": name, "value": value});
	if (typeof value === "object") value = JSON.stringify(value);
	localStorage.setItem(name, value);
}

function addValueChangeListener(name, callback) {
	dbg_log("addValueChangeListener() called", {"name": name});

	var updateIfChanged = function() {
		dbg_log("updateIfChanged() fired");
		var new_value = getValue(name);
		if (!valueCache.hasOwnProperty(name)) valueCache[name] = new_value;
		var old_value = valueCache[name];
		dbg_log("updateIfChanged() values:", new_value, old_value);
		if (old_value != new_value) {
			valueCache[name] = new_value;
			dbg_log("updateIfChanged() firing callback");
			callback(name, old_value, new_value, false);
		}
	};

	return GM_wait(updateIfChanged, POLLINGMS, true);
}

// Helper functions
function getDate() {
	var val = new Date().toLocaleString().replace(",","").replace(/:.. /," ");
	dbg_log("getDate() called", val);
	return val;
}
function getElems(selectors, root) {
	dbg_log("getElems() called", {"selectors": selectors, "root": root});

	if (!root) root = document;
	var val = root.querySelectorAll(selectors);
	dbg_log("getElems() found: ", val);
	return val;
}
function removeElems(elemArray) {
	dbg_log("removeElems() called", {"elemArray": elemArray});

	Array.prototype.forEach.call(elemArray, function(child, x){
		child.parentNode.removeChild(child);
	});
}
function trim(stringToTrim, trimChar) {
  if (trimChar === "]") trimChar = "\\]";
  if (trimChar === "\\") trimChar = "\\\\";
  return stringToTrim.replace(new RegExp(
    "^[" + trimChar + "]+|[" + trimChar + "]+$", "g"
  ), "");
}

// GM functions
function GM_getRequestParams() {
	dbg_log("GM_getRequestParams() called");

	// polyfill: https://cdnjs.cloudflare.com/ajax/libs/url-search-params/1.1.0/url-search-params.js
	//return new URLSearchParams(location.search);

	var search = location.search.substring(1); if (search === "") return {};
	var obj = '{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}';
	dbg_log("RequestParamParser", {"params": search, "string": obj});
	function decode(key, value) {return key===""?value:value===""?key:decodeURIComponent(value);}
	return JSON.parse(obj, decode);
}

function GM_getUser() {
	// Grab username from session, short-circuit if not an email
	var user = getValue(USER_NAME);
	if (user && user.length) return user;

	// Try and find username div, and default to email if not present
	user = prompt("Enter your name");
	dbg_log("GM_getUser", {"session":getValue(USER_NAME), "text":user});

	setValue(USER_NAME, user);
	return user;
}

function GM_hasSkipLink() {
	var params = new URLSearchParams(location.search);
	var skip = "tmSkip";
	var val = params.get(skip) || "";

	if (params.has(skip) && val.includes(scriptName)) {
		dbg_log("Skip present, aborting");
		return true;
	}

	val += "."+scriptName;
	params.set(skip, trim(val, "."));

	var newLink = location.pathname+"?"+params;
	log("See unmodified version here: "+newLink);

	return false;
}
function GM_loaded(func, repeat) {
	GM_RegisterDebugging();
	dbg_log("GM_loaded() called", {"repeat": repeat});

	try {
		// Handle for Skip link
		if (GM_hasSkipLink()) return;

		// Wait until doc loaded
		document.onreadystatechange = function () {
		    if (document.readyState == "complete") {
		    	dbg_log("document.readyState() complete");
		    	var recur = (repeat != null && repeat > 0);
		    	if (!recur) repeat = 200;
		    	GM_wait(func, repeat, recur); // Todo: quick hit first?
		    }
		};
	}
	catch(err) {
		dbg_error("GM_loaded()", err);
	}
}

var listenerIDs = [];
function GM_wait(func, timeout, recur) {
	dbg_log("GM_wait() called", {"timeout": timeout, "recur": recur});
	var id = -1;

	var doWork = function() {
		try {
			func();
		}
		catch(err) {
			dbg_error("GM_wait()", err);
		}
	};

	if (recur) {
		id = setInterval(doWork, timeout);
	} else {
		id = setTimeout(doWork, timeout);
	}

	// Criticial error that should never happen
	if (id < 0) dbg_error("GM_wait()", "id is < 0 and should never happen");

	listenerIDs.push(id);
	dbg_log("GM_wait() registered", {"listenerID": id});
	return id;
}

function GM_clearWait(id) {
	dbg_log("GM_clearWait() called", {"id": id});

	// Remove from registered id's
	var x = listenerIDs.indexOf(id);
	if (x > -1) listenerIDs = listenerIDs.splice(x, 1);

	clearInterval(id);
}
function GM_clearWaits() {
	if (!listenerIDs) return;

	dbg_log("GM_clearWaits() called", {"before": listenerIDs});

	for (var x = 0; x < listenerIDs.length; x++)
	{
		var id = listenerIDs[x];
		GM_clearWait(id);
	}
}

function GM_RegisterDebugging() {
	var params = new URLSearchParams(location.search);
	if (params.has("debug")) {
		window.debug = true;
	}

	if (window.debug) {
		dbg_log("GM_RegisterDebugging() enabled", {"params": location.search});
	} else {
		// handle for unhandled
		window.debug = false;
	}

	return window.debug;
}

// Script Variables
var SLACK_DEBUGCHAN = "BGMT2260M/4ZUUezTftWxSA7xBBRF2r8Kv";
var SLACK_WORKSPACE = "TGKSD3YSG";

// Implement these in your script:
// @require      https://github.com/vickersm/TamperMonkey/raw/master/Common.Logging.js
// @require      https://github.com/vickersm/TamperMonkey/raw/master/Common.XHR.js
// @grant        GM_xmlhttpRequest

/* globals xhr_get, xhr_post, xhr_post_auth */


// common operations
function xhr_get(url, callback) {
	GM_xmlhttpRequest({
	  method: "GET",
	  url: url,
	  onload: function(response) {
		if (window.debug) log(response);
		if (callback) callback(response);
	  }
	});
}
function xhr_post(url, body, callback) {
	GM_xmlhttpRequest({
	  method: "POST",
	  url: url,
	  data: JSON.stringify(body),
	  headers: {
		"Content-Type": "application/json; charset=UTF-8"
	  },
	  onload: function(response) {
		if (window.debug) log(response);
		if (callback) callback(response);
	  }
	});
}
function xhr_post_auth(url, body, token, callback) {
	GM_xmlhttpRequest({
	  method: "POST",
	  url: url,
	  data: JSON.stringify(body),
	  headers: {
		  "Content-Type": "application/json; charset=UTF-8",
		  "Authorization": "Bearer " + token
	  },
	  onload: function(response) {
		if (window.debug) log(response);
		if (callback) callback(response);
	  }
	});
}

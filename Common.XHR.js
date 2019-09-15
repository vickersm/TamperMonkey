// Last modified: 5/25/2019 8:25 PM
// Script Variables
const SLACK_DEBUGCHAN = "BGMT2260M/4ZUUezTftWxSA7xBBRF2r8Kv";
const SLACK_WORKSPACE = "TGKSD3YSG";

// Implement these in your script:
// @require		 http://www.createthebehavior.com/tm/Common.Logging.js
// @require		 http://www.createthebehavior.com/tm/Common.XHR.js
// @grant		 GM_xmlhttpRequest 

/* globals xhr_get, xhr_post */


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
		"Content-Type": "application/json"
	  },
	  onload: function(response) {
		if (window.debug) log(response);
		if (callback) callback(response);
	  }
	});
}
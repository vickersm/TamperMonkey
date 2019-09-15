// Script Variables
var SLACK_DEBUGCHAN = "BGMT2260M/4ZUUezTftWxSA7xBBRF2r8Kv";
var SLACK_WORKSPACE = "TGKSD3YSG";

// Implement these in your script:
// @require      https://github.com/vickersm/TamperMonkey/raw/master/Common.Logging.js
// @require      https://github.com/vickersm/TamperMonkey/raw/master/Common.XHR.js
// @require      https://github.com/vickersm/TamperMonkey/raw/master/Common.Slack.js
// @grant        GM_xmlhttpRequest

/* globals Send_SlackBotMessage */


// Slack Messages
function Send_SlackBotMessage(channel, msg) {
	if (window.debug) channel = SLACK_DEBUGCHAN;
	log("Send_SlackBotMessage", {"message": msg, "channel": channel});

	var url = "https://hooks.slack.com/services/"+SLACK_WORKSPACE+"/"+channel;
	var body = {"text": msg};
	xhr_post(url, body);
}

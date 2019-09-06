// Last modified: 5/25/2019 8:25 PM
// Script Variables
const SLACK_DEBUGCHAN = "BGMT2260M/4ZUUezTftWxSA7xBBRF2r8Kv";
const SLACK_WORKSPACE = "TGKSD3YSG";

// Implement these in your script:
// @require		 http://www.createthebehavior.com/tm/Common.Logging.js
// @require		 http://www.createthebehavior.com/tm/Common.XHR.js
// @require		 http://www.createthebehavior.com/tm/Common.Slack.js
// @grant		 GM_xmlhttpRequest 

/* globals Send_SlackBotMessage */


// Slack Messages
function Send_SlackBotMessage(channel, msg) {
	if (window.debug) channel = SLACK_DEBUGCHAN;
	log("Send_SlackBotMessage", {"message": msg, "channel": channel});

	var url = "https://hooks.slack.com/services/"+SLACK_WORKSPACE+"/"+channel;
	var body = {"text": msg};
	xhr_post(url, body);
}
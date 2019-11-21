// ==UserScript==
// @name         Slack Deleter
// @description  Removes social media boxes from various websites
// @downloadURL  https://github.com/vickersm/TamperMonkey/raw/master/SlackDeleter.user.js
// @version      1.0
// @author       Mike Vickers
// @namespace    http://vespersoft.net/
// @require      https://github.com/vickersm/TamperMonkey/raw/master/Common.js
// @include      https://app.slack.com/client/TGDKNKKC1/*
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==
/* globals log, logU, xhr_get, xhr_post, Send_SlackBotMessage,
	getValue, setValue, addValueChangeListener, clearValueChangeListener,
	getDate, getElems, removeElems, trim,
	GM_getRequestParams, GM_getUser, GM_runAfterInit, GM_wait, GM_clearWait, GM_clearWaits, GM_RegisterDebugging
*/

// Upsize these into GM_runAfterInit, with exclusion links generated, and collapse into excludeScripts requestParam (GM_addRequestParam func?)
// Also, centralize debug-flag such that if a script doesnt work, it enables the equiv mode across the board

// Script Constants
var scriptName = "SlackDeleter";

GM_runAfterInit(AddDeleteButton, 100);

function AddDeleteButton() {
	dbg_log("AddDeleteButton() called");

	var hover = ".c-message__actions";

	// Test for and remove any of the above selectors.
	var results = getElems(hover);

	if (results && results[0] && results[0].lastChild) {
		if (results[0].innerHTML.includes("Delete")) return;

		GenerateDeleteButton(results[0]);
	}

	//	logU(results.length+" tags found and removed", trim(matched.trim(), ","));
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

function DeleteMessage(channel, timestamp) {
	// Ha-nee tampermonkey token
	var url = "https://slack.com/api/chat.delete";
	var body = {channel: channel, ts: timestamp};
	var token = "xoxp-557668665409-557494386816-831723258147-b166e1f36dc93eadb9aab2953d01fb77";
	//debugger;

	//xhr_post
	xhr_post_auth(url, body, token);
}

function GenerateDeleteButton(nodeGroup) {
	var parent = nodeGroup.parentNode.parentNode;
	if (!parent.id) parent = parent.parentNode.parentNode;

	var ts = parent.id.split("_").pop();
	var channel = location.href.split("/")[5];

	var html = '<button id="deleteme" class="c-button-unstyled c-message_actions__button" type="button" aria-label="Delete Message" aria-haspopup="true" data-qa="delete_message" delay="60" aria-describedby="slack-kit-tooltip"><i class="c-icon c-icon--clear" type="small-reaction" aria-hidden="true"></i></button>';
	nodeGroup.lastChild.insertAdjacentHTML('beforebegin', html);

	document.getElementById("deleteme").addEventListener("click", function() {DeleteMessage(channel, ts)});
}


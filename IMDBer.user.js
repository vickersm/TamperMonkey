// ==UserScript==
// @name         IMDBer
// @description  Make looking up Parental Advisory much more simplistic
// @version      0.61
// @author       Mike Vickers
// @downloadURL  https://github.com/vickersm/TamperMonkey/raw/master/IMDBer.user.js
// @namespace    http://vespersoft.net/
// @match        https://www.imdb.com/title/*
// @exclude      https://www.imdb.com/title/*/parentalguide*
// @exclude      https://www.imdb.com/title/*/videoplayer*
// @exclude      https://www.imdb.com/title/*/mediaviewer*
// @require      https://github.com/vickersm/TamperMonkey/raw/master/Common.js
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==
/* globals log, logU,
	xhr_get, xhr_post, Send_SlackBotMessage,
	getValue, setValue, addValueChangeListener, clearValueChangeListener,
	getElems, GM_getRequestParams, GM_getUser, GM_runAfterInit, GM_wait, GM_clearWait, GM_clearWaits, GM_Debugging */

// Script Constants
var scriptName = "IMDBer";

GM_runAfterInit(function() {
    'use strict';

    // Your code here...
	var title = ".title_wrapper, h3[itemprop=name] a";
	var nodes = getElems(title);
	if (nodes.length > 0) {
		if (nodes.length > 1) {
			alert("multiple?");
		} else {
			//alert("found");
			//debugger;
			var a = document.createElement("A");
			var parts = window.location.href.replace(window.location.search, "").split("/");
			while (!parts[parts.length-1].includes("tt")) {parts.pop();}

			a.href = parts.join("/") + "/parentalguide?ref_=tt_stry_pg#advisory-nudity";
			a.innerText = "[Parents Guide]";
			nodes[0].parentElement.appendChild(a);
		}
	}

});

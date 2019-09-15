// ==UserScript==
// @name         Comment Box Remover
// @description  Removes social media boxes from various websites
// @downloadURL  https://github.com/vickersm/TamperMonkey/raw/master/CommentBoxRemover.user.js
// @version      3.0
// @author       Mike Vickers
// @namespace    http://vespersoft.net/
// @require      https://github.com/vickersm/TamperMonkey/raw/master/Common.js
// @include      *
// @exclude      *stackoverflow.com*
// @exclude      *google.com*
// @exclude      *qustodio.com*
// @exclude      *facebook.com*
// @exclude      *twitter.com*
// @exclude      *theoldreader.com*
// @exclude      *jsfiddle.net*
// @exclude      *superuser.com*
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==
/* globals log, logU, xhr_get, xhr_post, Send_SlackBotMessage,
	getValue, setValue, addValueChangeListener, clearValueChangeListener,
	getDate, getElems, removeElems, trim,
	GM_getRequestParams, GM_getUser, GM_loaded, GM_wait, GM_clearWait, GM_clearWaits, GM_RegisterDebugging
*/

// Upsize these into GM_loaded, with exclusion links generated, and collapse into excludeScripts requestParam (GM_addRequestParam func?)
// Also, centralize debug-flag such that if a script doesnt work, it enables the equiv mode across the board


// Script Constants
var scriptName = "CommentBox";

GM_loaded(RemoveComments, 1000);

function RemoveComments() {

	//Archived: .comment, #comment,
	// Comment-related
	var selectors = '.ep-footer, .postcomments, .commentlist, .comments, #comments, .comments-wrap, .comment-section, ' +
		'#comment-wrap, #comic-comments, #submitted-comments, .comments-text-container, #comment-form-hd, #comment-form, ' +
		'.js-responsesWrapper, .group_comments, .social-detail, .util-bar-module-comments';
	// Social media related
	selectors += ', #lower #notes-box, div#lcontent.bottom, #blogarea, .social-login, .dpsp-content-wrapper, .inline-share-tools-asset, .util-bar-module-share';
	// Miscellaneous
	selectors += ', .trending-posts, .addthis_inline_share_toolbox';

// TODO: create precedence by removing one at a time in that order until none-found, only return the ones removed
	// Test for and remove any of the above selectors.
	var results = getElems(selectors);

	var matched = "";

	var arr = selectors.split(", ");
	var display = "Breakdown of "+results.length+" Comment tags:\n";
	Array.prototype.forEach.call(arr, function(elem, i){
		if (elem.trim() == "") return;
		//if (cur_url.toLowerCase().includes(elem)) alert("found " + elem);
		var count = getElems(elem).length;
		if (count > 0) {
			if (count > 1) matched += "("+count+"x)";
			matched += elem+", ";
		}
	});

	if (results.length > 0) {
		removeElems(results);
		logU(results.length+" tags found and removed", trim(matched.trim(), ","));
	}
}

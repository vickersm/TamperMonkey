// ==UserScript==
// @name         Matrix Portal
// @description  Adds needed functionality to the portal page
// @downloadURL  https://github.com/vickersm/TamperMonkey/raw/master/MatrixPortal.user.js
// @version      0.95
// @author       Mike Vickers
// @namespace    http://vespersoft.net/
// @match        https://matrix.ntreis.net/Matrix/Public/Portal.aspx*
// @require      https://github.com/vickersm/TamperMonkey/raw/master/Common.js
// @grant        GM_xmlhttpRequest
// @run-at       document-end

// ==/UserScript==
/* globals log, logU, xhr_get, xhr_post, Send_SlackBotMessage,
	getValue, setValue, addValueChangeListener, clearValueChangeListener,
	getDate, getElems, removeElems, trim,
	GM_getRequestParams, GM_getUser, GM_runAfterInit, GM_wait, GM_clearWait, GM_clearWaits, GM_RegisterDebugging */

// Script Constants
var scriptName = "MatrixPortal";

GM_runAfterInit(StartLookup, 700);

function StartLookup() {
	var elems = getElems(".d-wrapperTable");
	AddLookups(elems);
}

function AddLookups(elems) {
	dbg_log("AddLookups() called", {"elems": elems});

	var i = 0;
	for (var x = 0; x < elems.length; x++) {
		var cur = elems[x];
		if (cur.classList.contains("done")) continue;

		var link = getElems(".d-fontSize--largest a", cur)[0];
		var rest = getElems(".d-fontSize--small.d-textSoft", cur)[0];
		var MLS = getElems("span.d-fontSize--small.d-fontWeight--bold", cur)[0];
		var setText = function(elem, mls, addr, rest) {
			return function(url) {
				elem.innerHTML = "<a href='" + url + "' target='redfin'>" + mls + "</a>";
				var google = "https://www.google.com/maps/place/" + addr.replace(" ", "+");
				rest.innerHTML += " <a href='" + google + "' target='maps'><img height='14' width='14' src='//www.google.com/images/branding/product/ico/maps_32dp.ico' /></a>";
			};
		};

		var mlsNum = MLS.innerText;
		var addr = link.innerText +", "+ rest.innerText;
		lookupRedfin(mlsNum, setText(MLS, mlsNum, addr, rest));
		cur.classList.add("done"); i++;
	}
	if (i > 0) log(getDate()+" Looked up "+i+" elements");
}
function lookupRedfin(mlsNum, next) {
	var prefix = "{}&&";
	var base = "https://www.redfin.com";
	var request = "/stingray/do/query-location?al=3&location=" + mlsNum + "&market=dallas&num_homes=1000&ooa=true&v=2";
	xhr_get(base+request, function(response) {
		var result = JSON.parse(response.responseText.replace(prefix, ""));
		if (result.errorMessage != "Success") {log("Redfin Error", response); return;}

		var payload = result.payload;
		var house = payload.exactMatch;
		if (!house || house.invalidMRS) house = payload.sections[0].rows[0];

		var link = house.url;
		next(base+link);
	});
}

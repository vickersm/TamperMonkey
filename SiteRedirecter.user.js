// ==UserScript==
// @name         Site Redirecter
// @namespace    http://vespersoft.com/
// @description  Fix certain urls
// @version      0.9
// @downloadURL  https://github.com/vickersm/TamperMonkey/raw/master/SiteRedirecter.user.js
// @author       Mike Vickers
// @include      *
// @exclude      https://www.camelbak.com/*
// @grant        none
// @run-at   document-start
// ==/UserScript==

// Script Constants
const scriptName = "SiteRedirecter";
const suffix = "script=GMscript";

function log(message, skipAppend) {
	message = "[TM: "+scriptName+"] "+message;
	if (!skipAppend) message += " for: " + document.URL;
	console.log(message);
}

(function() {
    'use strict';

	// include      /site\.com\/thread.+?\.html\b/
    var cur_url = document.URL;

	if (cur_url.includes(suffix)) {
		log("already redirected, aborting script");
		return;
	}

	String.prototype.replaceAll = function(strReplace, strWith) {
		// See http://stackoverflow.com/a/3561711/556609
		var esc = strReplace.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
		var reg = new RegExp(esc, 'ig');
		return this.replace(reg, strWith);
	};

    // Create a new url based on replacement pattern
    function RedirectIfFound(oldPart, newPart) {
        var youtube_re = /youtube\.com\/watch\?(v=|.+&v=)([\w_-]{11})/.exec(cur_url);
        if (youtube_re !== null) {
            var videoID = youtube_re[2];
            //var vimeo = false; // /^https?:\/\/(www\.)?vimeo\.com\/(\d)+$/.test(url.split("?")[0]);
            //var viddler = false; // /^https?:\/\/(www\.)?viddler\.com\/explore\/(.)+\/videos\//.test(url);
            //var bbc = false; // /^https?:\/\/(www\.)?bbc\.co\.uk\/iplayer\/episode\//.test(url);
            return videoID;
            //return (youtube || vimeo || viddler || bbc);
        }
        return "";
    }

    /*
    youtu.be/FdeioVndUhs    >     www.youtube.com/watch?v=FdeioVndUhs
    youtube.com/watch?v=wvZ6nB3cl1w    >    youtube.com/v/wvZ6nB3cl1w
    youtube.com/v/7RWI3-8N_-Y    >    watchkin.com/y/7RWI3-8N_-Y
    */
    // Order matters
    var prefixes = ["youtu.be/", "youtube.com/watch?v=", "youtube.com/v/"];
    var replacement = "watchkin.com/y/";

    // Testing for :: https://www.bing.com/search?q=AAAA || https://www.ask.com/web?q=AAAA -> https://www.google.com/search?q=AAAA
    //var prefixes = ["www.bing.com/search?", "www.ask.com/web?"];
	//var replacement = "www.google.com/search?";

	// Find each prefix and replace if found
    Array.prototype.forEach.call(prefixes, function(elem, i){
		//if (cur_url.toLowerCase().includes(elem)) alert("found " + elem);
		cur_url = cur_url.replaceAll(elem, replacement);
	});

	// Redirect if modified
	if (cur_url != document.URL) {
		var join = cur_url.includes("?") ? "&" : "?";
		cur_url += join + suffix;
		log("Sending to: '"+cur_url+"'");
		window.location = cur_url;
	}
	/*
    //RedirectIfFound("youtu.be/","www.youtube.com/watch?v=");
    //RedirectIfFound("youtube.com/watch?v=","youtube.com/v/");
    //RedirectIfFound("youtu.be/","www.youtube.com/watch?v=");
    if ( ! /print\.html$/i.test (location.pathname) ) {
        var printPath = location.pathname.replace (/(\.html)$/, "-print$1");
        var newURL = location.protocol + "//"
        + location.host
        + printPath
        + location.search
        + location.hash
        ;
        location.replace (newURL);
    }
	*/
})();



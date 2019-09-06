// Last modified: 5/25/2019 12:38 PM
// @require		 http://www.createthebehavior.com/tm/Common.Logging.js
/* globals log, logU */

// Needed variables: const scriptName = "";


// Log functions
function log(message) {
	var preamble = "[TM: "+scriptName+"]";
	if (typeof arguments[0] === "string") {
		arguments[0] = preamble+' '+message;
	} else {
		Array.prototype.unshift.call(arguments, preamble);
	}
	console.log.apply(null, arguments);
}
function logU(message) {
	var suffix = "for: " + document.URL;
	if (typeof arguments[0] === "string") {
		arguments[0] = message+' '+suffix;
	} else {
		Array.prototype.unshift.call(arguments, suffix);
	}
	log.apply(null, arguments);
}

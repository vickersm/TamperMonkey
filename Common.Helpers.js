// Last modified: 8/2/2019 9:32 PM
// Script Variables
const USER_NAME = "curUser";

// Implement these in your script:
// @require		 http://www.createthebehavior.com/tm/Common.Helpers.js

/* globals getDate, getElems, removeElems, trim */


// Helper functions
function getDate() {
	return new Date().toLocaleString().replace(",","").replace(/:.. /," ");
}

function getElems(selectors, root) {
	if (!root) root = document;
	var val = root.querySelectorAll(selectors);
	return val;
}
function removeElems(elemArray) {
	Array.prototype.forEach.call(elemArray, function(child, x){
		child.parentNode.removeChild(child);
	});
}

function trim(stringToTrim, trimChar) {
  if (trimChar === "]") trimChar = "\\]";
  if (trimChar === "\\") trimChar = "\\\\";
  return stringToTrim.replace(new RegExp(
    "^[" + trimChar + "]+|[" + trimChar + "]+$", "g"
  ), "");
}

// Script Variables
const POLLINGMS = 200;

// @require      https://github.com/vickersm/TamperMonkey/raw/master/Common.LocalStorage.js
/* globals getValue, setValue, addValueChangeListener, clearValueChangeListener, clearValueChangeListeners */


// Storage functions (Replaces: GM_getValue, GM_setValue, GM_addValueChangeListener)
var valueCache = {};
function getValue(name, toJson) {
	var value = localStorage[name];
	if (!value && toJson) return null;
	return toJson ? JSON.parse(value) : value;
}
function setValue(name, value) {
	if (typeof value === "object") value = JSON.stringify(value);
	localStorage.setItem(name, value);
}

var listenerIDs = [];
function addValueChangeListener(name, callback) {
	var id = setInterval(function() {
		var new_value = getValue(name);
		if (!valueCache.hasOwnProperty(name)) valueCache[name] = new_value;
		var old_value = valueCache[name];
		if (old_value != new_value) {
			valueCache[name] = new_value;
			callback(name, old_value, new_value, false);
		}
	}, POLLINGMS);

	listenerIDs.push(id);
	return id;
}
function clearValueChangeListener(id) {
	// Remove from registered id's
	var x = listenerIDs.indexOf(id);
	if (x > -1) listenerIDs = listenerIDs.splice(x, 1);

	clearInterval(id);
}
function clearValueChangeListeners() {
	for (var x = 0; x < listenerIDs.length; x++)
	{
		var id = listenerIDs[x];
		clearValueChangeListener(id);
	}
}

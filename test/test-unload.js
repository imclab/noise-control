/* global exports, require */

let main = require("./main.js");

const { data } = require("sdk/self");
const tabs = require("sdk/tabs");
const windows = require("sdk/windows").browserWindows;
const { prefs } = require("sdk/simple-prefs");
const { viewFor } = require("sdk/view/core");

const { openTab, wait } = require("common.js");

exports.testUnload = function*(test) {
	let tabsToClose = [
		yield openTab(data.url("").replace("/data/", "/tests/files/audio.html")),
		yield openTab(data.url("").replace("/data/", "/tests/files/lynx.webm"))
	];

	prefs["indicator.colour"] = "#00cc00";

	yield wait();
	for (let tab of tabsToClose) {
		let xulTab = viewFor(tab);
		let chromeDocument = xulTab.ownerDocument;
		let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");

		test.notEqual(indicator, null, "indicator exists");
		test.notEqual(chromeDocument._noiseControlCSS, null);
	}
	main.onUnload();
	for (let tab of tabsToClose) {
		let xulTab = viewFor(tab);
		let chromeDocument = xulTab.ownerDocument;
		let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");

		test.equal(indicator, null, "indicator removed");
		test.equal(chromeDocument._noiseControlCSS, null);
		tab.close();
	}

	for (let sdkWindow of windows) {
		let chromeWindow = viewFor(sdkWindow);
		let chromeDocument = chromeWindow.document;

		test.ok(!Array.some(
			chromeDocument.childNodes,
			n => n.data && n.data.indexOf("noise-control.css") >= 0
		));
	}
};

require("sdk/test").run(exports);

/* global exports, require */

let main = require("./main.js");

const { data } = require("sdk/self");
const tabs = require("sdk/tabs");
const { viewFor } = require("sdk/view/core");

const { openTab, wait } = require("common.js");

exports.testUnload = function*(test) {
	let tabsToClose = [
		yield openTab(data.url("").replace("/data/", "/tests/files/audio.html")),
		yield openTab(data.url("").replace("/data/", "/tests/files/lynx.webm"))
	];

	yield wait();
	for (let tab of tabsToClose) {
		let xulTab = viewFor(tab);
		let chromeDocument = xulTab.ownerDocument;
		let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");

		test.notEqual(indicator, null, "indicator exists");
	}
	main.onUnload();
	for (let tab of tabsToClose) {
		let xulTab = viewFor(tab);
		let chromeDocument = xulTab.ownerDocument;
		let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");

		test.equal(indicator, null, "indicator removed");
		tab.close();
	}
};

require("sdk/test").run(exports);

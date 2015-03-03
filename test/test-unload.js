/* global exports, require */

let main = require("../lib/main.js");

const tabs = require("sdk/tabs");
const windows = require("sdk/windows").browserWindows;
const { viewFor } = require("sdk/view/core");

const { openTab, url, wait } = require("./common.js");

exports.testUnload = function*(test) {
	let tabsToClose = [
		yield openTab(url("/test/files/audio.html")),
		yield openTab(url("/test/files/lynx.webm"))
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

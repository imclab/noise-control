let main = require("./main.js");

const { data } = require("sdk/self");
const { Cu } = require("chrome");
const { setTimeout } = require("sdk/timers");
const tabs = require("sdk/tabs");
const { Task } = Cu.import("resource://gre/modules/Task.jsm", {});
const { viewFor } = require("sdk/view/core");

exports.testUnload = function*(test) {
	let tabsToClose = [];

	tabs.open({
		url: data.url("").replace("/data/", "/tests/files/audio.html"),
		onPageShow: function(tab) {
			tabsToClose.push(tab);
		}
	});
	tabs.open({
		url: data.url("").replace("/data/", "/tests/files/lynx.webm"),
		onPageShow: function(tab) {
			tabsToClose.push(tab);
		}
	});

	yield wait();
	for (let tab of tabsToClose) {
		let xulTab = viewFor(tab);
		let chromeDocument = xulTab.ownerDocument;
		let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");

		test.notEqual(indicator, null, "indicator exists");
		tab.close();
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

function wait() {
	return new Promise(function(resolve, reject) {
		setTimeout(resolve, 500);
	});
}

let main = require("./main.js");

const { Cu } = require("chrome");
const { setTimeout } = require("sdk/timers");
const tabs = require("sdk/tabs");
const { Task } = Cu.import("resource://gre/modules/Task.jsm", {});
const { viewFor } = require("sdk/view/core");

exports.testShutdown = function(test, done) {
	Task.spawn(function*() {
		let tabsToClose = [];

		tabs.open({
			url: "file:///home/geoff/smush.ogg",
			onPageShow: function(tab) {
				tabsToClose.push(tab);
			}
		});
		tabs.open({
			url: "file:///home/geoff/lynx.webm",
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
		done();
	});
};

require("sdk/test").run(exports);

function wait() {
	return new Promise(function(resolve, reject) {
		setTimeout(resolve, 500);
	});
}

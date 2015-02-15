require("./main.js");

const { setTimeout } = require("sdk/timers");
const tabs = require("sdk/tabs");
const { data } = require("sdk/self");
const { Cu } = require("chrome");
const { Task } = Cu.import("resource://gre/modules/Task.jsm", {});
const { viewFor } = require("sdk/view/core");

exports.testMulti = function(test, done) {
	tabs.open({
		url: data.url("").replace("/data/", "/tests/files/multi.html"),
		onPageShow: function(tab) {
			Task.spawn(function*() {
				yield wait();

				let xulTab = viewFor(tab);
				let chromeDocument = xulTab.ownerDocument;
				let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");

				test.equal(indicator, null, "indicator doesn't exist at start");

				// TODO: don't do this.
				let contentWindow = xulTab.linkedBrowser.contentWindow;
				let contentDocument = contentWindow.document;
				let audio = contentDocument.querySelector("audio");
				let video = contentDocument.querySelector("video");

				video.play();
				yield wait();
				indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");
				test.notEqual(indicator, null, "indicator exists");
				test.notEqual(indicator.getAttribute("collapsed"), "true");

				audio.play();
				yield wait();
				test.notEqual(indicator.getAttribute("collapsed"), "true");

				video.pause();
				yield wait();
				test.notEqual(indicator.getAttribute("collapsed"), "true");

				audio.pause();
				yield wait();
				test.equal(indicator.getAttribute("collapsed"), "true");

				tab.close();
				done();
			});
		}
	});
};

require("sdk/test").run(exports);

function wait() {
	return new Promise(function(resolve, reject) {
		setTimeout(resolve, 10);
	});
}

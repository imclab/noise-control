require("./main.js");

const { Cu } = require("chrome");
const { setTimeout } = require("sdk/timers");
const tabs = require("sdk/tabs");
const { Task } = Cu.import("resource://gre/modules/Task.jsm", {});
const { viewFor } = require("sdk/view/core");

exports.testBasicAudio = function(test, done) {
	tabs.open({
		url: "file:///home/geoff/smush.ogg",
		onPageShow: function(tab) {
			basicTest(tab, "video", test, done);
		}
	});
};

exports.testBasicVideo = function(test, done) {
	tabs.open({
		url: "file:///home/geoff/lynx.webm",
		onPageShow: function(tab) {
			basicTest(tab, "video", test, done);
		}
	});
};

require("sdk/test").run(exports);

function wait() {
	return new Promise(function(resolve, reject) {
		setTimeout(resolve, 10);
	});
}

function basicTest(tab, elementSelector, test, done) {
	Task.spawn(function*() {
		yield wait();

		let xulTab = viewFor(tab);
		let chromeDocument = xulTab.ownerDocument;
		let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");

		test.notEqual(indicator, null, "indicator exists");
		test.notEqual(indicator.getAttribute("collapsed"), "true", "indicator is shown");

		// TODO: don't do this.
		let contentWindow = xulTab.linkedBrowser.contentWindow;
		let contentDocument = contentWindow.document;
		let video = contentDocument.querySelector(elementSelector);

		test.equal(video.muted, false);
		indicator.click();
		yield wait();
		test.equal(indicator.classList.contains("muted"), true);
		test.ok(indicator.getAttribute("src").endsWith("muted.png"));
		test.notEqual(indicator.getAttribute("collapsed"), "true", "indicator not hidden");
		test.equal(video.muted, true);

		indicator.click();
		yield wait();
		test.equal(indicator.classList.contains("muted"), false);
		test.ok(indicator.getAttribute("src").endsWith("noisy.png"));
		test.notEqual(indicator.getAttribute("collapsed"), "true", "indicator not hidden");
		test.equal(video.muted, false);

		indicator.click();
		yield wait();
		video.muted = false;
		yield wait();
		test.equal(indicator.classList.contains("muted"), false);
		test.ok(indicator.getAttribute("src").endsWith("noisy.png"));
		test.notEqual(indicator.getAttribute("collapsed"), "true", "indicator not hidden");

		tab.close();
		done();
	});
}

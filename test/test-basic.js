require("./main.js");

const { data } = require("sdk/self");
const { Cu } = require("chrome");
const { setTimeout } = require("sdk/timers");
const tabs = require("sdk/tabs");
const { Task } = Cu.import("resource://gre/modules/Task.jsm", {});
const { viewFor } = require("sdk/view/core");

exports.testBasicAudio = function(test, done) {
	tabs.open({
		url: data.url("").replace("/data/", "/tests/files/audio.html"),
		onPageShow: function(tab) {
			basicTest(tab, "audio", test, done);
		}
	});
};

exports.testBasicVideo = function(test, done) {
	tabs.open({
		url: data.url("").replace("/data/", "/tests/files/lynx.webm"),
		onPageShow: function(tab) {
			basicTest(tab, "video", test, done);
		}
	});
};

require("sdk/test").run(exports);

function wait() {
	return new Promise(function(resolve, reject) {
		setTimeout(resolve, 50);
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

		video.pause();
		yield wait();
		test.equal(indicator.getAttribute("collapsed"), "true");

		video.play();
		yield wait();
		test.notEqual(indicator.getAttribute("collapsed"), "true");

		video.muted = true;
		yield wait();
		test.equal(indicator.getAttribute("collapsed"), "true");

		video.muted = false;
		yield wait();
		test.notEqual(indicator.getAttribute("collapsed"), "true");

		video.volume = 0.5;
		yield wait();
		test.notEqual(indicator.getAttribute("collapsed"), "true");

		video.volume = 0;
		yield wait();
		test.equal(indicator.getAttribute("collapsed"), "true");

		video.volume = 1;
		yield wait();
		test.notEqual(indicator.getAttribute("collapsed"), "true");

		tab.close();
		done();
	});
}

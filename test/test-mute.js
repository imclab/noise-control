require("./main.js");

const { data } = require("sdk/self");
const { Cu } = require("chrome");
const { setTimeout } = require("sdk/timers");
const tabs = require("sdk/tabs");
const { Task } = Cu.import("resource://gre/modules/Task.jsm", {});
const { viewFor } = require("sdk/view/core");

exports.testMuteAudio = function*(test) {
	let tab = yield openTab(data.url("").replace("/data/", "/tests/files/audio.html"));
	yield basicTest(tab, (doc) => doc.querySelector("audio"), test);
};

exports.testMuteVideo = function*(test) {
	let tab = yield openTab(data.url("").replace("/data/", "/tests/files/lynx.webm"));
	yield basicTest(tab, (doc) => doc.querySelector("video"), test);
};

exports.testMuteVideoInFrame = function*(test) {
	let tab = yield openTab(data.url("").replace("/data/", "/tests/files/video-frame.html"));
	yield basicTest(tab, (doc) => {
		return doc.querySelector("iframe").contentWindow.document.querySelector("video");
	}, test);
};

require("sdk/test").run(exports);

function openTab(url) {
	return new Promise(function(resolve, reject) {
		tabs.open({
			url: url,
			onPageShow: resolve
		});
	});
}

function wait() {
	return new Promise(function(resolve, reject) {
		setTimeout(resolve, 50);
	});
}

function basicTest(tab, elementSelector, test) {
	return Task.spawn(function*() {
		yield wait();

		let xulTab = viewFor(tab);
		let chromeDocument = xulTab.ownerDocument;
		let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");

		test.notEqual(indicator, null, "indicator exists");
		test.notEqual(indicator.getAttribute("collapsed"), "true", "indicator is shown");

		// TODO: don't do this.
		let contentWindow = xulTab.linkedBrowser.contentWindow;
		let contentDocument = contentWindow.document;
		let video = elementSelector(contentDocument);

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
	});
}

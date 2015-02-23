require("./main.js");

const { data } = require("sdk/self");
const { viewFor } = require("sdk/view/core");

const { openTab, wait } = require("common.js");

exports.testPlugin = function*(test) {
	let tab = yield openTab(data.url("").replace("/data/", "/tests/files/embed.html"));

	yield wait();
	let xulTab = viewFor(tab);
	let chromeDocument = xulTab.ownerDocument;
	let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");
	test.ok(indicator.classList.contains("plugins"));

	tab.url = data.url("").replace("/data/", "/tests/files/audio.html");
	yield wait();
	test.ok(!indicator.classList.contains("plugins"));

	tab.close();
};

exports.testPluginRemovedFromDOM = function*(test) {
	let tab = yield openTab(data.url("").replace("/data/", "/tests/files/embed.html"));

	yield wait();
	let xulTab = viewFor(tab);
	let chromeDocument = xulTab.ownerDocument;
	let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");
	test.ok(indicator.classList.contains("plugins"));

	// TODO: don't do this.
	let contentWindow = xulTab.linkedBrowser.contentWindow;
	let contentDocument = contentWindow.document;
	let plugin = contentDocument.querySelector("embed");
	plugin.remove();

	yield wait(100);
	test.ok(!indicator.classList.contains("plugins"));

	tab.close();
};

exports.testPluginInFrame = function*(test) {
	let tab = yield openTab(data.url("").replace("/data/", "/tests/files/embed-frame.html"));

	yield wait();
	let xulTab = viewFor(tab);
	let chromeDocument = xulTab.ownerDocument;
	let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");
	test.ok(indicator.classList.contains("plugins"));

	// TODO: don't do this.
	let contentWindow = xulTab.linkedBrowser.contentWindow;
	let contentDocument = contentWindow.document;
	let frame = contentDocument.querySelector("iframe");

	frame.src = data.url("").replace("/data/", "/tests/files/audio.html");
	yield wait(100);
	test.ok(!indicator.classList.contains("plugins"));

	tab.close();
};

exports.testPluginInFrame2 = function*(test) {
	let tab = yield openTab(data.url("").replace("/data/", "/tests/files/embed-frame.html"));

	yield wait();
	let xulTab = viewFor(tab);
	let chromeDocument = xulTab.ownerDocument;
	let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");
	test.ok(indicator.classList.contains("plugins"));

	tab.url = data.url("").replace("/data/", "/tests/files/audio.html");
	yield wait();
	test.ok(!indicator.classList.contains("plugins"));

	tab.close();
};

require("sdk/test").run(exports);

require("./main.js");

const { Cu } = require("chrome");
const { setTimeout } = require("sdk/timers");
const tabs = require("sdk/tabs");
const { Task } = Cu.import("resource://gre/modules/Task.jsm", {});
const { viewFor } = require("sdk/view/core");

exports["test main async"] = function(test, done) {
	tabs.open({
		url: "file:///home/geoff/smush.ogg",
		onPageShow: function(tab) {
			test.pass("onPageShow");

			Task.spawn(function*() {
				yield wait();
				test.pass("timeout");

				let xulTab = viewFor(tab);
				let chromeDocument = xulTab.ownerDocument;
				let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");

				test.notEqual(indicator, null);
				test.notEqual(indicator.getAttribute("collapsed"), "true");

				// TODO: don't do this.
				let contentWindow = xulTab.linkedBrowser.contentWindow;
				let contentDocument = contentWindow.document;
				let video = contentDocument.querySelector("video");

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
			});
		},
		onClose: function() {
			test.pass("onClose");
			done();
		}
	});
};

require("sdk/test").run(exports);

function wait() {
	return new Promise(function(resolve, reject) {
		setTimeout(resolve, 10);
	});
}

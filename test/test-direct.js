const { data } = require("sdk/self");
const { setTimeout } = require("sdk/timers");
const { Cu } = require("chrome");
const { Task } = Cu.import("resource://gre/modules/Task.jsm", {});
const { viewFor } = require("sdk/view/core");

exports.testDirect = function*(test) {
	let worker = yield startup();
	test.notEqual(worker, null, "attached");

	let expected1, expected2, gotMessage;
	function* waitForMessage(arg1, arg2) {
		expected1 = arg1;
		expected2 = arg2;
		gotMessage = false;
		yield wait();
		test.ok(gotMessage);
	}

	worker.port.on("*", function(arg1, arg2) {
		test.equal(arg1, expected1, "arg1 okay");
		test.equal(arg2, expected2, "arg2 okay");
		gotMessage = true;
	});

	let xulTab = viewFor(worker.tab);
	let chromeDocument = xulTab.ownerDocument;

	// TODO: don't do this.
	let contentWindow = xulTab.linkedBrowser.contentWindow;
	let contentDocument = contentWindow.document;
	let video = contentDocument.querySelector("video");

	video.play();
	yield waitForMessage("hasNoise", true);

	video.pause();
	yield waitForMessage("hasNoise", false);

	worker.tab.close();
};

require("sdk/test").run(exports);

function startup() {
	return new Promise(function(resolve, reject) {
		require("sdk/page-mod").PageMod({
			include: ["resource://*"],
			contentScriptFile: data.url("content-top.js"),
			onAttach: function(worker) {
				resolve(worker);
			}
		});

		require("sdk/tabs").open({
			url: data.url("").replace("/data/", "/tests/files/multi.html"),
		});
	});
}

function wait() {
	return new Promise(function(resolve, reject) {
		setTimeout(resolve, 50);
	});
}

const XULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

let { data } = require("sdk/self");
let { viewFor } = require("sdk/view/core");

require("sdk/page-mod").PageMod({
	attachTo: ["existing", "top"],
	include: ["*", "file://*", "resource://*"],
	contentScriptFile: "./content-top.js",
	contentScriptWhen: "ready",
	onAttach: function(worker) {
		console.log("attach top");
		viewFor(worker.tab)._topWorker = worker;
		worker.port.on("hasNoise", hasNoise => {
			console.log("hasNoise", hasNoise);
			if (worker.tab) {
				getIndicatorForTab(worker.tab).setAttribute("collapsed", hasNoise ? "false" : "true");
			}
		});
		// worker.port.on("unmuted", () => {
		// 	let indicator = getIndicatorForTab(worker.tab);
		// 	indicator.classList.remove("muted");
		// 	indicator.setAttribute("src", data.url("noisy.png"));
		// });
	}
});

require("sdk/page-mod").PageMod({
	attachTo: ["existing", "frame"],
	include: ["*", "file://*", "resource://*"],
	contentScriptFile: "./content-frame.js",
	contentScriptWhen: "ready",
	onAttach: function(worker) {
		console.log("attach frame");
		worker.port.on("hasNoiseFrame", hasNoise => {
			console.log("hasNoiseFrame", hasNoise);
			if (worker.tab) {
				if (hasNoise) {
					getIndicatorForTab(worker.tab).setAttribute("collapsed", hasNoise ? "false" : "true");
				} else {
					viewFor(worker.tab)._topWorker.port.emit("checkNoiseTop");
				}
			}
		});
	}
});

exports.onUnload = function() {
	let tabs = require("sdk/tabs");
	for (let tab of tabs) {
		let xulTab = viewFor(tab);
		let chromeDocument = xulTab.ownerDocument;
		let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");
		if (indicator) {
			indicator.remove();
		}
	}
};

function getIndicatorForTab(tab) {
	let xulTab = viewFor(tab);
	let chromeDocument = xulTab.ownerDocument;
	let indicator = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "noise-indicator");
	if (!indicator) {
		indicator = chromeDocument.createElementNS(XULNS, "image");
		indicator.setAttribute("anonid", "noise-indicator");
		indicator.className = "tab-icon-image";
		indicator.setAttribute("src", data.url("noisy.png"));
		indicator.style.display = "-moz-box";
		indicator.style.marginLeft = indicator.style.marginRight = "0";
		indicator.style.pointerEvents = "auto";
		indicator.addEventListener("click", function() {
			xulTab._topWorker.port.emit("mute", indicator.classList.toggle("muted"));
			let src = data.url(indicator.classList.contains("muted") ? "muted.png" : "noisy.png");
			indicator.setAttribute("src", src);
		});

		let closeButton = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "close-button");
		closeButton.parentNode.insertBefore(indicator, closeButton);
	}
	return indicator;
}

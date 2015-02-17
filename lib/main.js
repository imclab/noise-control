const XULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

let { data } = require("sdk/self");
let { viewFor } = require("sdk/view/core");

require("sdk/page-mod").PageMod({
	attachTo: ["existing", "top"],
	include: ["*", "file://*", "resource://*"],
	contentScriptFile: "./content-top.js",
	contentScriptWhen: "ready",
	onAttach: function(worker) {
		viewFor(worker.tab)._topWorker = worker;
		worker.port.on("hasNoise", hasNoise => {
			if (worker.tab) {
				getIndicatorForTab(worker.tab).setAttribute("collapsed", hasNoise ? "false" : "true");
			}
		});
		worker.port.on("unmuted", () => {
			let indicator = getIndicatorForTab(worker.tab);
			indicator.classList.remove("muted");
			indicator.setAttribute("src", data.url("noisy.png"));
		});
	}
});

require("sdk/page-mod").PageMod({
	attachTo: ["existing", "frame"],
	include: ["*", "file://*", "resource://*"],
	contentScriptFile: "./content-frame.js",
	contentScriptWhen: "ready",
	onAttach: function(worker) {
		worker.port.on("hasNoiseFrame", hasNoise => {
			if (worker.tab) {
				if (hasNoise) {
					getIndicatorForTab(worker.tab).setAttribute("collapsed", hasNoise ? "false" : "true");
				} else {
					viewFor(worker.tab)._topWorker.port.emit("checkNoiseTop");
				}
			}
		});
		worker.port.on("unmutedFrame", () => {
			let indicator = getIndicatorForTab(worker.tab);
			indicator.classList.remove("muted");
			indicator.setAttribute("src", data.url("noisy.png"));
		});
	}
});

exports.onUnload = function() {
	let tabs = require("sdk/tabs");
	for (let tab of tabs) {
		let xulTab = viewFor(tab);
		delete xulTab._topWorker;
		xulTab.style.backgroundColor = null;
		xulTab.removeEventListener("TabMove", updateOnRearrange, false);
		xulTab.removeEventListener("TabAttrModified", fixBinding, false);
		xulTab.removeEventListener("TabPinned", fixBinding, false);
		xulTab.removeEventListener("TabUnpinned", fixBinding, false);
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
		indicator.addEventListener("click", function(event) {
			// Check there's only one click of the left button.
			if (event.which != 1 || event.detail != 1) {
				return;
			}
			xulTab._topWorker.port.emit("mute", indicator.classList.toggle("muted"));
			let src = data.url(indicator.classList.contains("muted") ? "muted.png" : "noisy.png");
			indicator.setAttribute("src", src);
		});

		let closeButton = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "close-button");
		closeButton.parentNode.insertBefore(indicator, closeButton);

		xulTab.addEventListener("TabMove", updateOnRearrange, false);
		xulTab.addEventListener("TabAttrModified", fixBinding, false);
		xulTab.addEventListener("TabPinned", fixBinding, false);
		xulTab.addEventListener("TabUnpinned", fixBinding, false);
	}
	return indicator;
}

function fixBinding(event) {
	let xulTab = event.target;
	let chromeDocument = xulTab.ownerDocument;
	let closeButton = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "close-button");

	if (xulTab.pinned) {
		closeButton.setAttribute("pinned", "true");
	} else {
		closeButton.removeAttribute("pinned");
	}

	if (xulTab.selected) {
		closeButton.setAttribute("selected", "true");
	} else {
		closeButton.removeAttribute("selected");
	}
}

function updateOnRearrange(event) {
	let xulTab = event.target;
	xulTab._topWorker.port.emit("checkNoiseTop");
	xulTab._topWorker.port.emit("checkPluginsTop");
}

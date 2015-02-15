const XULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

let { data } = require("sdk/self");
let { viewFor } = require("sdk/view/core");

require("sdk/page-mod").PageMod({
	attachTo: ["existing", "top", "frame"],
	include: ["*", "file://*"],
	contentScriptFile: "./content.js",
	contentScriptWhen: "ready",
	onAttach: function(worker) {
		worker.port.on("hasNoise", hasNoise => {
			getIndicatorForWorker(worker).setAttribute("collapsed", hasNoise ? "false" : "true");
		});
		worker.port.on("unmuted", () => {
			let indicator = getIndicatorForWorker(worker);
			indicator.classList.remove("muted");
			indicator.setAttribute("src", data.url("noisy.png"));
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

function getIndicatorForWorker(worker) {
	let xulTab = viewFor(worker.tab);
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
			worker.port.emit("mute", indicator.classList.toggle("muted"));
			let src = data.url(indicator.classList.contains("muted") ? "muted.png" : "noisy.png");
			indicator.setAttribute("src", src);
		});

		let closeButton = chromeDocument.getAnonymousElementByAttribute(xulTab, "anonid", "close-button");
		closeButton.parentNode.insertBefore(indicator, closeButton);
	}
	return indicator;
}

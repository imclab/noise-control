/* global addMessageListener, removeMessageListener, sendAsyncMessage, content */

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

let muting = false;
let tabMuted = false;
let previous = false;

addEventListener("emptied", checkNoise, true);
addEventListener("loadeddata", checkNoise, true);
addEventListener("play", checkNoise, true);
addEventListener("pause", checkNoise, true);
addEventListener("volumechange", checkUnmuted, true);
addMessageListener("NoiseControl:checkNoise", forceCheckNoise);
addMessageListener("NoiseControl:checkPlugins", checkPlugins);
addMessageListener("NoiseControl:mute", muteListener);
addMessageListener("NoiseControl:disable", disableListener);
checkNoise();

let s = new Set();
let observer = {
	observe: function(subject, topic, data) {
		if (!subject) {
			// console.log("eh?!");
			return;
		}
		// console.log("this script: " + (subject.top == content) + ", is top:" + (subject == content));
		if (subject.top == content) {
			// console.log(topic, data);
			if (data == "active") {
				s.add(subject);
				subject.addEventListener("unload", this.windowUnload);
			} else {
				s.delete(subject);
			}
			try {
				sendAsyncMessage("NoiseControl:testMessage", s.size);
			} catch(ex) {
				// console.error(ex);
			}
		}
	},
	windowUnload: function(event) {
		s.delete(event.currentTarget);
		try {
			sendAsyncMessage("NoiseControl:testMessage", s.size);
		} catch(ex) {
			// console.error(ex);
		}
	},
	QueryInterface: XPCOMUtils.generateQI([
		Components.interfaces.nsIObserver,
		Components.interfaces.nsISupportsWeakReference,
		Components.interfaces.nsISupports
	])
};
Services.obs.addObserver(observer, "media-playback", true);
// console.log("observer added");

function checkNoise() {
	if (muting) {
		return;
	}
	let hasNoise = checkWindowAndFrames(content);
	if (hasNoise != previous) {
		sendAsyncMessage("NoiseControl:hasNoise", hasNoise);
		previous = hasNoise;
	}
	if (hasNoise) {
		addEventListener("pagehide", checkUnloaded, true);
	}
}

function checkUnloaded(event) {
	let targetWindow = event.target.ownerGlobal;
	if (targetWindow == targetWindow.top) {
		sendAsyncMessage("NoiseControl:unloaded");
		previous = false;
		tabMuted = false;
	}
}

function checkUnmuted(event) {
	if (tabMuted && !event.target.muted) {
		sendAsyncMessage("NoiseControl:unmuted");
		tabMuted = false;
		previous = true;
		return;
	}
	checkNoise();
}

function checkWindowAndFrames(win) {
	let hasMedia = Array.some(
		win.document.querySelectorAll("audio, video"),
		v => !v.paused && (!("mozHasAudio" in v) || v.mozHasAudio) && ((v.muted && tabMuted) || !v.muted) && v.volume && !v.error
	);

	if (hasMedia) {
		let mediaObserver = new win.MutationObserver(onMutation);
		mediaObserver.lookFor = "audio, video";
		mediaObserver.observe(win.document.documentElement, {
			childList: true,
			subtree: true
		});

		if (win != win.top) {
			let parent = win.parent;
			let iframeObserver = new parent.MutationObserver(onMutation);
			iframeObserver.lookFor = "iframe";
			iframeObserver.observe(parent.document.documentElement, {
				childList: true,
				subtree: true
			});
		}

		return true;
	}

	return Array.some(
		win.document.querySelectorAll("iframe"),
		f => checkWindowAndFrames(f.contentWindow)
	);
}

function onMutation(mutations) {
	for (let m of mutations) {
		for (let n of m.removedNodes) {
			if (("matches" in n && n.matches(this.lookFor)) ||
					("querySelector" in n && n.querySelector(this.lookFor))) {
				checkNoise();
				return;
			}
		}
	}
}

function forceCheckNoise() {
	let hasNoise = checkWindowAndFrames(content);
	sendAsyncMessage("NoiseControl:hasNoise", hasNoise);
	previous = hasNoise;

	checkPlugins();
}

function checkPlugins() {
	setTimeout(function() {
		if (!!content) {
			let hasPlugins = checkWindowAndFramesForPlugins(content);
			sendAsyncMessage("NoiseControl:hasPlugins", hasPlugins);
		}
	}, 0);
}

function checkWindowAndFramesForPlugins(win) {
	let hasPlugins = Array.some(
		win.document.querySelectorAll("object, embed, applet"),
		p => p.activated
	);

	if (hasPlugins) {
		win.addEventListener("pagehide", checkPlugins);
	}

	return hasPlugins || Array.some(
		win.document.querySelectorAll("iframe"),
		f => checkWindowAndFramesForPlugins(f.contentWindow)
	);
}

function muteListener(message) {
	let muted = message.data;
	muting = true;
	muteWindowAndFrames(content, muted);

	setTimeout(function() {
		muting = false;
		tabMuted = muted;
	}, 0);
}

function muteWindowAndFrames(win, muted) {
	let utils = win.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsIDOMWindowUtils);
	utils.audioMuted = muted;

	Array.forEach(
		win.document.querySelectorAll("iframe"),
		f => muteWindowAndFrames(f.contentWindow, muted)
	);
}

function disableListener()  {
	removeEventListener("emptied", checkNoise, true);
	removeEventListener("loadeddata", checkNoise, true);
	removeEventListener("play", checkNoise, true);
	removeEventListener("pause", checkNoise, true);
	removeEventListener("pagehide", checkUnloaded, true);
	removeEventListener("volumechange", checkUnmuted, true);
	removeMessageListener("NoiseControl:checkNoise", forceCheckNoise);
	removeMessageListener("NoiseControl:mute", muteListener);
	removeMessageListener("NoiseControl:disable", disableListener);

	Services.obs.removeObserver(observer, "media-playback");
}

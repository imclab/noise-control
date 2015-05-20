/* global addMessageListener, removeMessageListener, sendAsyncMessage, content */

let previous = false;

addEventListener("emptied", checkNoise, true);
addEventListener("loadeddata", checkNoise, true);
addEventListener("play", checkNoise, true);
addEventListener("pause", checkNoise, true);
addEventListener("volumechange", checkNoise, true);
addMessageListener("NoiseControl:checkNoise", forceCheckNoise);
addMessageListener("NoiseControl:checkPlugins", checkPlugins);
addMessageListener("NoiseControl:setAudioState", audioStateListener);
addMessageListener("NoiseControl:disable", disableListener);
checkNoise();

function checkNoise() {
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
	}
}

function checkWindowAndFrames(win) {
	let hasMedia = Array.some(
		win.document.querySelectorAll("audio, video"),
		v => !v.paused && (!("mozHasAudio" in v) || v.mozHasAudio) && !v.muted && v.volume && !v.error
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

function audioStateListener(message) {
	let state = message.data;
	setAudioStateWindowAndFrames(content, state);
}

function setAudioStateWindowAndFrames(win, state) {
	let utils = win.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsIDOMWindowUtils);
	if (typeof state == "boolean") {
		utils.audioMuted = state;
	} else {
		utils.audioVolume = state;
	}

	Array.forEach(
		win.document.querySelectorAll("iframe"),
		f => setAudioStateWindowAndFrames(f.contentWindow, state)
	);
}

function disableListener()  {
	removeEventListener("emptied", checkNoise, true);
	removeEventListener("loadeddata", checkNoise, true);
	removeEventListener("play", checkNoise, true);
	removeEventListener("pause", checkNoise, true);
	removeEventListener("pagehide", checkUnloaded, true);
	removeEventListener("volumechange", checkNoise, true);
	removeMessageListener("NoiseControl:checkNoise", forceCheckNoise);
	removeMessageListener("NoiseControl:setAudioState", audioStateListener);
	removeMessageListener("NoiseControl:disable", disableListener);
}

/* global addMessageListener, removeMessageListener, sendAsyncMessage, content */

let muting = false;
let tabMuted = false;
let previous = false;

addEventListener("emptied", checkNoise, true);
addEventListener("play", checkNoise, true);
addEventListener("pause", checkNoise, true);
addEventListener("volumechange", checkUnmuted, true);
addMessageListener("NoiseControl:checkNoise", forceCheckNoise);
addMessageListener("NoiseControl:checkPlugins", checkPlugins);
addMessageListener("NoiseControl:mute", muteListener);
addMessageListener("NoiseControl:disable", disableListener);
checkNoise();

function checkNoise() {
	if (muting) {
		return;
	}
	let hasNoise = checkWindowAndFrames(content);
	if (hasNoise != previous) {
		sendAsyncMessage("NoiseControl:hasNoise", hasNoise);
		previous = hasNoise;
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
	return Array.some(
		win.document.querySelectorAll("audio, video"),
		v => !v.paused && /*v.mozHasAudio &&*/ ((v.muted && tabMuted) || !v.muted) && v.volume
	) || Array.some(
		win.document.querySelectorAll("iframe"),
		f => checkWindowAndFrames(f.contentWindow)
	);
}

function forceCheckNoise() {
	let hasNoise = checkWindowAndFrames(content);
	sendAsyncMessage("NoiseControl:hasNoise", hasNoise);
	previous = hasNoise;
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
	Array.forEach(
		win.document.querySelectorAll("audio, video"),
		v => v.muted = muted
	);
	Array.forEach(
		win.document.querySelectorAll("iframe"),
		f => muteWindowAndFrames(f.contentWindow, muted)
	);
}

function disableListener()  {
	removeEventListener("emptied", checkNoise, true);
	removeEventListener("play", checkNoise, true);
	removeEventListener("pause", checkNoise, true);
	removeEventListener("volumechange", checkUnmuted, true);
	removeMessageListener("NoiseControl:checkNoise", forceCheckNoise);
	removeMessageListener("NoiseControl:mute", muteListener);
	removeMessageListener("NoiseControl:disable", disableListener);
}

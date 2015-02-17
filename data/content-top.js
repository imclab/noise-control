document.addEventListener("emptied", checkNoise, true);
document.addEventListener("play", checkNoise, true);
document.addEventListener("pause", checkNoise, true);
document.addEventListener("volumechange", checkNoise, true);

self.on("detach", () => {
	document.removeEventListener("emptied", checkNoise, true);
	document.removeEventListener("play", checkNoise, true);
	document.removeEventListener("pause", checkNoise, true);
	document.removeEventListener("volumechange", checkNoise, true);
});
self.port.on("checkNoiseTop", () => {
	self.port.emit("hasNoise", checkWindowAndFrames(window));
});
self.port.on("mute", muted => {
	muteWindowAndFrames(window, muted);
	tabMuted = muted;
});

let tabMuted = false;
let previous = false;
checkNoise();

function checkNoise() {
	let elements = document.querySelectorAll("audio, video");
	if (tabMuted && Array.some(elements, v => !v.muted)) {
		tabMuted = false;
		self.port.emit("unmuted");
	}

	let hasNoise = checkWindow(window);
	if (!hasNoise) {
		hasNoise = checkFrames(window);
	}
	if (hasNoise != previous) {
		self.port.emit("hasNoise", hasNoise);
		previous = hasNoise;
	}
}

function checkWindow(win) {
	return Array.some(
		win.document.querySelectorAll("audio, video"),
		v => !v.paused && /*v.mozHasAudio &&*/ (v.muted == tabMuted) && v.volume
	);
}

function checkFrames(win) {
	return Array.some(
		win.document.querySelectorAll("iframe"),
		f => checkWindowAndFrames(f.contentWindow)
	);
}

function checkWindowAndFrames(win) {
	return checkWindow(win) || checkFrames(win);
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

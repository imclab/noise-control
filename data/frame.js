addEventListener("emptied", checkNoise, true);
addEventListener("play", checkNoise, true);
addEventListener("pause", checkNoise, true);
addEventListener("volumechange", checkNoise, true);

// self.on("detach", () => {
// 	removeEventListener("emptied", checkNoise, true);
// 	removeEventListener("play", checkNoise, true);
// 	removeEventListener("pause", checkNoise, true);
// 	removeEventListener("volumechange", checkNoise, true);
// });

addMessageListener("mute", message => {
	let muted = message.data;
	muting = true;
	muteWindowAndFrames(content, muted);

	setTimeout(function() {
		muting = false;
		tabMuted = muted;
	}, 0);
});

let muting = false;
let tabMuted = false;
let previous = false;
checkNoise();

function checkNoise() {
	if (muting) {
		return;
	}
	let hasNoise = checkWindowAndFrames(content);
	if (hasNoise && tabMuted) {
		sendAsyncMessage("unmuted", hasNoise);
		tabMuted = false;
		previous = true;
		return;
	}
	if (hasNoise != previous) {
		sendAsyncMessage("hasNoise", hasNoise);
		previous = hasNoise;
	}
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

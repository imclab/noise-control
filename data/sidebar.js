/* globals addon */

let windowsList = document.getElementById("windows");

addon.port.on("everything", function(windows) {
	windowsList.innerHTML = "";
	for (let tabs of windows) {
		let tabsList = document.createElement("ul");
		for (let tab of tabs) {
			let listItem = document.createElement("li");
			listItem.setAttribute("id", tab.id);
			listItem.innerHTML =
				'<div><img class="tabicon" /><span class="tabtitle"></span></div>' +
				'<div><label><input type="checkbox" /> Mute</label></div>';
			listItem.querySelector("input[type=\"checkbox\"]").onclick = onMuteClick;
			updateTab(listItem, tab);
			tabsList.appendChild(listItem);
		}
		windowsList.appendChild(tabsList);
	}
});

addon.port.on("tabchanged", function(tab) {
	let listItem = document.getElementById(tab.id);
	updateTab(listItem, tab);
});

function onMuteClick() {
	let listItem = this.parentNode;
	while (listItem && listItem.localName != "li") {
		listItem = listItem.parentNode;
	}

	addon.port.emit("mutechanged", {
		id: listItem.id,
		muted: this.checked
	});
}

function updateTab(listItem, tab) {
	listItem.querySelector(".tabicon").src = tab.icon ? tab.icon : "chrome://mozapps/skin/places/defaultFavicon.png";
	listItem.querySelector(".tabtitle").textContent = tab.title;
	listItem.querySelector("input[type=\"checkbox\"]").checked = tab.noisy.indexOf("muted") >= 0;
}

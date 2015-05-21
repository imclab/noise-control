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
				'<div><label><input type="checkbox" /> Mute</label><input type="range" /></div>';
			listItem.querySelector("input[type=\"checkbox\"]").onclick = onMuteClick;
			listItem.querySelector("input[type=\"range\"]").onchange = onVolumeChange;
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

function getListItem(element) {
	let listItem = element.parentNode;
	while (listItem && listItem.localName != "li") {
		listItem = listItem.parentNode;
	}
	return listItem;
}

function onMuteClick() {
	let listItem = getListItem(this);

	addon.port.emit("audioStateChanged", {
		id: listItem.id,
		state: this.checked
	});
}

function onVolumeChange() {
	let listItem = getListItem(this);

	addon.port.emit("audioStateChanged", {
		id: listItem.id,
		state: this.value / 100
	});
}

function updateTab(listItem, tab) {
	listItem.querySelector(".tabicon").src = tab.icon ? tab.icon : "chrome://mozapps/skin/places/defaultFavicon.png";
	listItem.querySelector(".tabtitle").textContent = tab.title;
	listItem.querySelector("input[type=\"checkbox\"]").checked = tab.noisy.indexOf("muted") >= 0;
	listItem.querySelector("input[type=\"range\"]").value = tab.volume * 100;
}

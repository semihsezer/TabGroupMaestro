function focusToTab(windowId, tabId, callback) {
  if (tabId) {
    chrome.tabs.update(tabId, { active: true });
  }

  chrome.windows.update(windowId, { focused: true });
  if (callback) {
    callback();
  }
}

function getLocalTabGroups(callback) {
  chrome.storage.local.get("tabGroups", function (data) {
    const tabGroups = data.tabGroups || {};
    callback(tabGroups);
  });
}

function setLocalTabGroups(tabGroups) {
  chrome.storage.local.set({ tabGroups: tabGroups });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message == "add_tab_to_group_and_focus") {
    chrome.tabs.group({ groupId: request.groupId, tabIds: [request.tabId] }, function () {
      focusToTab(request.windowId, request.tabId, request.callback);
    });
  }
});

// window.onFocusChanged
// -> Get tab in focus and its group, update their sort order
chrome.windows.onFocusChanged.addListener((windowId) => {
  console.log("window.onFocusChanged", windowId);
  // get active tab on window
  chrome.tabs.query({ active: true, windowId: windowId }, function (tabs) {
    if (tabs.length > 0) {
      const tabId = tabs[0].id;
      const groupId = tab.groupId;
      const timestamp = new Date().getTime();
      tabs[0].lastActive = timestamp;

      // get local tabGroups and insert active tab
      getLocalTabGroups(function (tabGroups) {
        if (tabGroups[groupId]) {
          let existingTabs = tabGroups[groupId];
          let existingTab = existingTabs.find((tab) => tab.id === tabId);
          if (existingTab) {
            existingTab.lastActive = timestamp;
          } else {
            existingTabs.push(tabs[0]);
          }
          // sort tabs by lastActive
          tabGroups[groupId] = existingTabs.sort((a, b) => b.lastActive - a.lastActive);
        } else {
          tabGroups[groupId] = [tabs[0]];
        }
        // update local tabGroups
        setLocalTabGroups(tabGroups);
        chrome.storage.local.set({ tabGroups: tabGroups });
      });
    }
  });
});

// window.OnRemoved
// Get groups on the window, remove them from stored tabGroups
// chrome.windows.onRemoved.addListener(
//   callback: function,
//   filters?: object,
// )

// tab.onActivated (when the active tab in a window changes.)
// Get the group of tab if exists, update its sort order
// chrome.tabs.onActivated.addListener(
//   callback: function,
// )

// tab.onMoved
// Check if it belongs to a new tabGroup, if so add it there
// Check if it belonged to a tabGroup before, if so remove it from there
// chrome.tabs.onMoved.addListener(
//   callback: function,
// )

// tab.OnRemoved
// Check if it belonged to a tabGroup before, if so remove it from there
// chrome.tabs.onRemoved.addListener(
//   callback: function,
// )

// tab.onUpdated
// Check update event to see if it was added/removed/moved to a group, if so update sort order
// chrome.tabs.onUpdated.addListener(
//   callback: function,
// )

function focusToTab(windowId, tabId, callback) {
  if (tabId) {
    chrome.tabs.update(tabId, { active: true });
  }

  chrome.windows.update(windowId, { focused: true });
  if (callback) {
    callback();
  }
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
// chrome.windows.onFocusChanged.addListener(
//   callback: function,
//   filters?: object,
// )

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

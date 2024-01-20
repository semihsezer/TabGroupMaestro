function focusToTab(windowId, tabId, callback) {
  if (tabId) {
    chrome.tabs.update(tabId, { active: true });
  }

  chrome.windows.update(windowId, { focused: true });
  if (callback){
    callback();
  }
};

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message == "add_tab_to_group_and_focus"){
      chrome.tabs.group({groupId: request.groupId, tabIds: [request.tabId]}, function(){
        focusToTab(request.windowId, request.tabId);
      });
    }
});

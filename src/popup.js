// Copyright 2022 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var allTabGroups = [];


function getTabGroupsByQuery(query) {
  var tabGroups = allTabGroups;
  var filteredTabGroups = tabGroups;
  // Filter tab groups based on the search query
  if (query){
    filteredTabGroups = tabGroups.filter(function(obj) {
      const titleLower = obj.title.toLowerCase();
      const queryLower = query.toLowerCase();
      return titleLower.startsWith(queryLower) || titleLower.includes(queryLower);
    });
  }

  return filteredTabGroups;
};

function focusToTab(windowId, tabId, callback) {
  chrome.tabs.update(tabId, { active: true });
  chrome.windows.update(windowId, { focused: true });
  if (callback){
    callback();
  }
};

var searchInput = document.getElementById('searchInput');
var suggestionsList = document.getElementById('suggestions');

function updateAutocompleteOptions(matchingTabGroups){
  matchingTabGroups.forEach(function (tabGroup) {
    var suggestionOption = document.createElement('option');
    suggestionOption.value = `${tabGroup.title}`;
    suggestionOption.dataset.windowId = tabGroup.windowId;
    suggestionOption.dataset.tabId = tabGroup.id;
    suggestionsList.appendChild(suggestionOption);
  });
};

searchInput.addEventListener('input', function (event) {
  // Clear previous suggestions
  suggestionsList.innerHTML = '';
  // Retrieve the search query from the input field
  var query = searchInput.value.toLowerCase();

  var matchingTabGroups = getTabGroupsByQuery(query);
  // Display matching tab group names as autocomplete suggestions
  matchingTabGroups.forEach(function (tabGroup) {
    var suggestionOption = document.createElement('option');
    suggestionOption.value = `${tabGroup.title}`;
    suggestionOption.dataset.windowId = tabGroup.windowId;
    suggestionOption.dataset.tabId = tabGroup.id;
    suggestionsList.appendChild(suggestionOption);
  });
});

searchInput.addEventListener('change', function (event) {
  console.log(`onChange: ${event.key}`);
  handleEnterKeyPress();
});

function handleEnterKeyPress() {
  // Retrieve the selected suggestion
  var suggestionsList = document.getElementById('suggestions');
  var selectedValue = searchInput.value;
  var selectedSuggestion = suggestionsList.querySelector(`option[value='${selectedValue}']`);

  if (selectedSuggestion){
    if (selectedValue == selectedSuggestion.value) {
      // Extract windowId and tabId from the selected suggestion
      var windowId = parseInt(selectedSuggestion.dataset.windowId);
      var tabId = parseInt(selectedSuggestion.dataset.tabId);
      console.log(`Focusing to tab: ${selectedValue}`);
      focusToTab(windowId, tabId);
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  chrome.tabGroups.query({},  function (groups) {
    allTabGroups = groups;
    updateAutocompleteOptions(allTabGroups);
    suggestionsList = document.getElementById('suggestions');
    suggestionsList.style.display = 'block';
    searchInput.focus();
    console.log(allTabGroups);
  });
});

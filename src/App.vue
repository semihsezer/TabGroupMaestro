<script setup>
</script>

<template>
  <header>
  </header>

  <main>
    <div class="card flex justify-content-center">
        <AutoComplete id="autoComplete" ref="autoCompleteElement" v-model="selectedValue" :suggestions="items" optionLabel="title" @complete="search" @item-select="handleUpdate" @clear="onClear" :placeholder="placeholderValue" completeOnFocus="true" delay="100" panelClass="autofocusPanel" inputClass="autofocusInput"/>
    </div>
  </main>
</template>

<script>

import { ref } from "vue";
import FuzzySearch from 'fuzzy-search';

var searcher = null;

const autoCompleteElement = ref();

const MODES = {
  search: "groupSearch",
  group: "group"
}

const CONST = {
  search_placeholder: "Go to Tab Group...",
  group_placeholder: "Add Current Tab to Group...",
  add_to_group_prefix: "New Group: "
}

function focusToTab(windowId, tabId, callback) {
  if (tabId) {
    chrome.tabs.update(tabId, {active: false }, function() {
      chrome.tabs.update(tabId, {active: true }, function() {
        chrome.windows.update(windowId, { focused: true });
        window.close();
        if (callback){
          callback();
        }
      });
    });
  } else {
    chrome.windows.update(windowId, { focused: true });
    window.close();
    if (callback) {
      callback();
    }
  }
};

export default {
    data() {
        return {
            selectedValue: '',
            items: [],
            allItems: [],
            localTabGroups: {},
            placeholderValue: CONST.search_placeholder,
            mode: "search"
        };
    },
    methods: {
        search(event) {
            const query = event.query;
            const queryLower = query.toLowerCase();

            if (queryLower == ""){
                this.items = this.allItems;
                return;
            }

            this.items = this.allItems.filter(function(item) {
              const itemLower = item.title.toLowerCase();
              return itemLower.startsWith(queryLower) || itemLower.includes(queryLower);
            });

            this.items = searcher.search(event.query);

            if (this.mode == MODES.group){
              var itemExists = false;
              this.items.forEach(function(item){
                if (item.title.toLowerCase() == queryLower){
                  itemExists = true;
                }
              });
              if (itemExists === false){
                let firstItem = {title: `${CONST.add_to_group_prefix}${query}`, type: "new_group", group_name: query};
                this.items.unshift(firstItem);
              }
            };
        },
        onClear(event){
          setTimeout(() => {
            this.items = this.allItems;
            this.$refs.autoCompleteElement.show();
          });
        },
        handleUpdate() {
          var that = this;
          if (this.mode == MODES.group){
            // new group
            if (this.selectedValue.type && this.selectedValue.type == "new_group"){
              let groupTitle = this.selectedValue.group_name;
              chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                let currentTabId = tabs[0].id;
                chrome.tabs.group({tabIds: [currentTabId]}, function(groupId) {
                  chrome.tabGroups.update(groupId, {title: groupTitle}, function(){
                      chrome.tabGroups.get(groupId, function(group){
                        focusToTab(group.windowId, currentTabId);
                      });
                    });
                  });
                });
            } else {
              // existing group
              let groupId = this.selectedValue.id;
              let windowId = this.selectedValue.windowId;
              chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                let currentTabId = tabs[0].id;
                chrome.runtime.sendMessage({
                  message: 'add_tab_to_group_and_focus',
                  windowId: windowId,
                  tabId: currentTabId,
                  groupId: groupId,
                });
              });
            }
          } else {
            const windowId = this.selectedValue.windowId;
            const tabId = this.selectedValue.lastAccessedTabId;
            const groupId = this.selectedValue.id;
            this.updateLocalLastAccessed(groupId, tabId);
            focusToTab(windowId, tabId);
          }
        },
        getLocalTabGroups(callback) {
          chrome.storage.local.get("tabGroups", function (data) {
            const tabGroups = data.tabGroups || {};
            callback(tabGroups);
          });
        },
        updateLocalLastAccessed(groupId, tabId) {
          this.getLocalTabGroups(function (tabGroups) {
            if (tabGroups[groupId]) {
              tabGroups[groupId].lastAccessed = Date.now();
              tabGroups[groupId].lastAccessedTabId = tabId;
            } else {
              tabGroups[groupId] = {
                id: groupId,
                lastAccessed: Date.now(),
                lastAccessedTabId: tabId,
              };
            }
            
            chrome.storage.local.set({ tabGroups: tabGroups });
            });
        },
        getSortedTabGroups(){
          chrome.tabs.query({}, (tabs) => {
            let tabGroups = {}; // tabGroupId: {id: id, lastAccessed: ts, lastAccessedTabId: tabId, tabs: []}
            // Group tabs by tab group and construct lastAccessed
            tabs.forEach((tab) => {
              if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
                let tabLastAccessed = tab.lastAccessed ? tab.lastAccessed : -1;
                if (tabGroups[tab.groupId]) {
                  let tabGroup = tabGroups[tab.groupId];  
                  tabGroup.tabs.push(tab);
                  if (!tabGroup.lastAccessed){
                    tabGroup.lastAccessed = tabLastAccessed;
                    tabGroup.lastAccessedTabId = tab.id;
                  } else {
                    if (tabLastAccessed > tabGroup.lastAccessed){
                      tabGroup.lastAccessedTabId = tab.id;
                      tabGroup.lastAccessed = tabLastAccessed;
                    }
                  }
                } else {
                  tabGroups[tab.groupId] = {
                    id: tab.groupId,
                    lastAccessed: tabLastAccessed,
                    lastAccessedTabId: tab.id,
                    tabs: [tab]
                  };
                }
              }
            });

            chrome.tabGroups.query({}, (groups) => {
              groups.forEach((group) => {
                let tabGroup = tabGroups[group.id];
                if (tabGroup) {
                  group.lastAccessed = tabGroup.lastAccessed;
                  group.lastAccessedTabId = tabGroup.lastAccessedTabId;
                }
              });

              // update values with tab access stored in local storage
              this.getLocalTabGroups((localTabGroups) => {
                for (let groupId in localTabGroups) {
                  if (tabGroups[groupId]) {
                    let localLastAccessed = localTabGroups[groupId].lastAccessed;
                    if (localLastAccessed > tabGroups[groupId].lastAccessed) {
                      tabGroups[groupId].lastAccessed = localLastAccessed;
                      tabGroups[groupId].lastAccessedTabId = localTabGroups[groupId].lastAccessedTabId;
                    }
                  }
                }

                // remove current tab group
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                  let currentTab = tabs[0];
                  let currentGroupId = currentTab.groupId;
                  // find index of currentTab in groups
                  let index = groups.findIndex((group) => group.id == currentGroupId);
                  if (index > -1) {
                    groups.splice(index, 1);
                  }

                  // Sort groups by last accessed
                  this.allItems = groups.sort((a, b) => - tabGroups[a.id].lastAccessed + tabGroups[b.id].lastAccessed);
                  this.items = this.allItems;
                  searcher = new FuzzySearch(this.allItems, ['title'], { sort: true });
                });
              });
            });
        });
      }
    },
    mounted() {
      this.getSortedTabGroups();

      var that = this;
      this.$refs.autoCompleteElement.onEscapeKey = function(){
        if (that.mode == MODES.group){
          that.selectedValue = "";
          that.mode = MODES.search;
          that.placeholderValue = CONST.search_placeholder;
          if (that.items && that.items.length > 0 && that.items[0].type == "new_group"){
            that.items.shift();
          }
          that.items = this.allItems;
          event.preventDefault();
        } else {
          if (that.selectedValue){
            that.selectedValue = "";
            that.items = this.allItems;
            event.preventDefault();
          } else {
            this.$refs.focusInput.blur();
          }
        }
      }
      this.$nextTick(() => {
        this.$refs.autoCompleteElement.$refs.focusInput.focus();
      });

      chrome.commands.onCommand.addListener((command) => {
        setTimeout(() => {
          if (this.mode == MODES.group){
            this.placeholderValue = CONST.search_placeholder;
            this.mode = MODES.search;
          } else {
            this.placeholderValue = CONST.group_placeholder;
            this.mode = MODES.group;
          }
        }, 100);
      });
    }
};

</script>

<style scoped>
  .container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }
</style>


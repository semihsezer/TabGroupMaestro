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
        if (callback){
          callback();
        }
      });
    });
  } else {
    chrome.windows.update(windowId, { focused: true });
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
            placeholderValue: CONST.search_placeholder,
            mode: "search"
        };
    },
    methods: {
        search(event) {
            const query = event.query;
            const queryLower = query.toLowerCase();

            if (queryLower == ""){
              this.items = allItems;
              return;
            }

            this.items = allItems.filter(function(item) {
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
            this.items = allItems;
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
            var windowId = this.selectedValue.windowId;
            var tabId = this.selectedValue.lastAccessedTabId;
            focusToTab(windowId, tabId);
          }
        },
        getSortedTabGroups() {
          chrome.tabs.query({}, function (tabs) {
            let tabGroups = {}; // tabGroupId: {id: id, lastAccessed: ts, tabs: []}
            // Group tabs by tab group and construct lastAccessed
            tabs.forEach(function (tab) {
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
                    tabs: [tab]
                  };
                }
              }
            });

            chrome.tabGroups.query({}, function (groups) {
              // add last accessed to each group object
              groups.forEach(function(group){
                let tabGroup = tabGroups[group.id];
                if (tabGroup){
                  group.lastAccessed = tabGroup.lastAccessed;
                  group.lastAccessedTabId = tabGroup.lastAccessedTabId;
                }
              });

              // Sort groups by last accessed
              this.allItems = groups.sort((a, b) => - tabGroups[a.id].lastAccessed + tabGroups[b.id].lastAccessed);
              this.items = this.allItems;
              searcher = new FuzzySearch(this.allItems, ['title'], { sort: true });
            });
          });
        },
    },
    getStoredTabGroups() {
      chrome.storage.local.get(['tabGroups'], function(result) {
        if (result.tabGroups){
          console.log('TabGroups retrieved from storage');
          console.log(result.tabGroups);
          // double check that all tabGroups exist in storage, if not add them to this list
        }
      });
    },
    setStoredTabGroups(tabGroups) {
      // TODO: Listen to tab and tabGroup events and update the tabGroups
      // Listen for create, delete, view, and update events
      chrome.storage.local.set({tabGroups: tabGroups}, function() {
        console.log('TabGroups stored in storage');
        console.log(tabGroups);
      });
    },
    sortTabGroups(tabGroups) {
      // TODO: sort by last accessed or update sort order
      return tabGroups.sort((a, b) => a.title.localeCompare(b.title));
    },
    onTabEvent(event) {
      // new tabGroup is created
      // tabGroup is deleted
      // tabGroup renamed (this could mean deleted and recreated)
      // tab is added to tab group
      // tab is removed from tab group
      // tab is moved from one group to another
      // Tab is viewed
      // Tabgroup is viewed (this could mean tab is viewed in that group)
    },
    mounted() {
      this.getSortedTabGroups();
      // chrome.tabGroups.query({}, function (groups) {
      //   this.allItems = groups.sort((a, b) => a.title.localeCompare(b.title));
      //   this.items = this.allItems;
      //   searcher = new FuzzySearch(this.allItems, ['title'], { sort: true });
      // });

      var that = this;
      this.$refs.autoCompleteElement.onEscapeKey = function(){
        if (that.mode == MODES.group){
          that.selectedValue = "";
          that.mode = MODES.search;
          that.placeholderValue = CONST.search_placeholder;
          if (that.items && that.items.length > 0 && that.items[0].type == "new_group"){
            that.items.shift();
          }
          that.items = allItems;
          event.preventDefault();
        } else {
          if (that.selectedValue){
            that.selectedValue = "";
            that.items = allItems;
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


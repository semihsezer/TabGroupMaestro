<script setup>
</script>

<template>
  <header>
  </header>

  <main>
    <div class="card flex justify-content-center">
        <AutoComplete id="autoComplete" ref="autoCompleteElement" v-model="selectedValue" :suggestions="items" optionLabel="title" @complete="search" @item-select="handleUpdate" @clear="onClear" :placeholder="placeholderValue" completeOnFocus="true" delay="100" panelClass="autofocusPanel" style="width: 100%"/>
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

const PLACEHOLDERS = {
  search: "Search Tab Groups...",
  group: "Add Tab to Group: Type Group Name"
}

function focusToTab(windowId, tabId, callback) {
  if (tabId) {
    chrome.tabs.update(tabId, { active: true });
  }

  chrome.windows.update(windowId, { focused: true });
  if (callback){
    callback();
  }
};

export default {
    data() {
        return {
            selectedValue: '',
            items: [],
            allItems: [],
            placeholderValue: PLACEHOLDERS.search,
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
                let firstItem = {title: `New Group: ${query}`, type: "new_group", group_name: query};
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
                        focusToTab(group.windowId, null);
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
                  groupId: groupId
                });
              });
            }
          } else {
            var windowId = this.selectedValue.windowId;
            focusToTab(windowId, null);
          }
        }
    },
    mounted() {
      chrome.tabGroups.query({},  function (groups) {
        this.allItems = groups.sort((a, b) => a.title.localeCompare(b.title));
        this.items = this.allItems;
        searcher = new FuzzySearch(this.allItems, ['title'], {sort: true});
      });

      var that = this;
      this.$refs.autoCompleteElement.onEscapeKey = function(){
        if (that.mode == MODES.group){
          that.selectedValue = "";
          that.mode = MODES.search;
          that.placeholderValue = PLACEHOLDERS.search;
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
        if (this.mode == MODES.group){
          this.placeholderValue = PLACEHOLDERS.search;
          this.mode = MODES.search;
        } else {
          this.placeholderValue = PLACEHOLDERS.group;
          this.mode = MODES.group;
        }

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


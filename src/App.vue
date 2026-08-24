<template>
  <header>
  </header>

  <main>
    <div class="card flex justify-content-center">
      <input
        ref="searchInput"
        v-model="query"
        type="text"
        class="p-inputtext p-component autofocusInput"
        :placeholder="placeholderValue"
        autocomplete="off"
        @input="onInput"
        @keydown.escape="onEscapeKey"
      />
      <div v-if="items.length" class="autofocusPanel p-autocomplete-panel p-component">
        <ul class="p-autocomplete-items">
          <li
            v-for="item in items"
            :key="item.id"
            class="p-autocomplete-item"
            @click="onItemSelect(item)"
          >
            {{ item.title }}
          </li>
        </ul>
      </div>
    </div>
  </main>
</template>

<script>
import FuzzySearch from 'fuzzy-search';

var searcher = null;

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
            query: '',
            selectedValue: '',
            items: [],
            allItems: [],
            placeholderValue: CONST.search_placeholder,
            mode: "search"
        };
    },
    methods: {
        onInput() {
            this.search({ query: this.query });
        },
        onItemSelect(item) {
            this.selectedValue = item;
            this.handleUpdate();
        },
        onEscapeKey(event) {
          if (this.mode == MODES.group){
            this.selectedValue = "";
            this.mode = MODES.search;
            this.placeholderValue = CONST.search_placeholder;
            if (this.items && this.items.length > 0 && this.items[0].type == "new_group"){
              this.items.shift();
            }
            this.items = this.allItems;
            event.preventDefault();
          } else {
            if (this.selectedValue){
              this.selectedValue = "";
              this.items = this.allItems;
              event.preventDefault();
            } else {
              this.$refs.searchInput.blur();
            }
          }
        },
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
        handleUpdate() {
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
            focusToTab(this.selectedValue.windowId, null);
          }
        }
    },
    mounted() {
      chrome.tabGroups.query({}, (groups) => {
        this.allItems = groups.sort((a, b) => a.title.localeCompare(b.title));
        this.items = this.allItems;
        searcher = new FuzzySearch(this.allItems, ['title'], {sort: true});
        this.$nextTick(() => {
          this.$refs.searchInput.focus();
        });
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

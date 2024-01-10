<script setup>
</script>

<template>
  <header>
  </header>

  <main>
    <div class="card flex justify-content-center">
        <AutoComplete id="autoComplete" ref="autoCompleteElement" v-model="selectedValue" :suggestions="items" optionLabel="title" @complete="search" @item-select="handleUpdate" placeholder="Search Tab Groups..." completeOnFocus="true" delay="100" panelClass="autofocusPanel" style="width: 100%" />
    </div>
  </main>
</template>

<script>

import { ref } from "vue";
const autoCompleteElement = ref();

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
            allItems: []
        };
    },
    methods: {
        search(event) {
            const queryLower = event.query.toLowerCase();
            this.items = allItems.filter(function(item) {
              const itemLower = item.title.toLowerCase();
              return itemLower.startsWith(queryLower) || itemLower.includes(queryLower);
            });
        },
        handleUpdate() {
          var windowId = this.selectedValue.windowId;
          focusToTab(windowId, null);
        }
    },
    mounted() {
      chrome.tabGroups.query({},  function (groups) {
        this.allItems = groups.sort((a, b) => a.title.localeCompare(b.title));
        this.items = this.allItems;
      });
      this.$refs.autoCompleteElement.onEscapeKey = function(){
        this.$refs.focusInput.blur();
      }
      this.$nextTick(() => {
        this.$refs.autoCompleteElement.$refs.focusInput.focus();
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



<script>
import { onMount } from "svelte";
import PopupSection from "./components/PopupSection.svelte";

let term = "";
let suggestions = [];
let searching = false;
let loading = false;
let data = {};
const LOADING_MESSAGE = browser.i18n.getMessage("loadingMessage");
const NO_DEFINITION_MESSAGE = browser.i18n.getMessage("noDefinitionMessage");

onMount(() => {
    navigator.clipboard
             .readText()
             .then((clipText) => {
                 term = clipText.split(" ")[0] || ""
                 doSearch();
             });
})

function doSearch(){
    if(term.trim().length > 0){
        searching = true;
        loading = true;
        data = {};

        let sending = browser.runtime.sendMessage({
            type: "fetch-meaning",
            term: term,
        });

        sending.then((response) => {
            data = response || {};
            loading = false;
            searching = false;
        });
    }
}

function handleKeyUp(e){
    if(e.key == "Enter"){
        doSearch()
    }
}



</script>
<main class="p-8">
    <div class="flex">

        <input type="text" class="flex-1 border p-2 text-sm border-gray-200 rounded-lg rounded-r-none focus-visible:outline-none focus:border-blue-500"  placeholder="Gõ để tìm kiếm" bind:value={term} autocomplete="off" on:keyup={handleKeyUp} />
        <button class="inline-block px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-orange-600 rounded-lg rounded-l-none hover:bg-orange-500 focus:outline-none focus:ring" on:click={doSearch} >
          Tra từ
        </button>
      </div>

      {#if searching && suggestions.length > 0 }
      <div class="suggestions relative" >
        <nav class="flex flex-col absolute top-0 left-0 w-full shadow-md bg-white rounded-lg divide-y">
          {#each suggestions as item }
              <div class="block p-2 px-4 cursor-pointer hover:bg-blue-50">
                <div class="font-bold">{item.term}</div>
                <span class="ml-2 text-sm text-gray-500">{item.brief_meaning}</span>
                </div>
                {/each}
        </nav>
      </div>
      {/if}

      <div class="content mt-4">
          {#if data.definition}
              <div class="phonetic italic">{data.phonetic}</div>
              <div class="type">{data.type || ""}</div>
              <div class="definition">
                  {#each data.definition as section}
                      <PopupSection {section} />
                  {/each}
              </div>
      {:else if loading}
              <div class="definition">
                  {LOADING_MESSAGE}
              </div>
      {:else if data.error}
              <div class="definition">
                  Error: <div class="error">{data.error}</div>
              </div>
      {:else}
              <div class="definition">
                  {NO_DEFINITION_MESSAGE}
              </div>
          {/if}
      </div>




</main>

<style>
main{
    width: 450px;
    max-height: 600px
}
</style>

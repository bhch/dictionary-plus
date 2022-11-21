<script>
  import PopupMeaning from "./PopupMeaning.svelte";
  import PopupGroup from "./PopupGroup.svelte";
  export let section;
</script>

<section class="level-1">
  <div class="label">{section.name}</div>
  {#if section.word_classes}
  <div>
    {#each section.word_classes as item}
      <PopupGroup group={item} />
    {/each}
  </div>
  {/if}

  <ul class="mn-list">
    {#each section.meanings as meaning}
      <PopupMeaning {meaning} />
    {/each}
    <ul />
  </ul>
</section>

<style>
.level-1 {
    font-family: Tahoma, sans-serif;
    color: rgb(51, 65, 85);
    line-height: 22px;
}
.level-1 .label {
    font-weight: bold;
    color: rgb(59, 130, 246);
    margin-bottom: 6px;
}
.mn-list{
    padding-left: 15px;
    list-style-type: disc;
}
</style>

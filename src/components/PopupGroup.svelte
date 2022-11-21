<script>
  import PopupMeaning from "./PopupMeaning.svelte";
  export let group;
</script>

<section class="level-2">
  <div class="label">{group.name}</div>
  <ol class="mn-list">
    {#each group.meanings as item}
      <PopupMeaning meaning={item} />
    {/each}
  </ol>
</section>

<style>
.level-2 .label {
    font-weight: bold;
    color: rgb(249, 115, 22);
}

.level-2 > li {
    margin-bottom: 5px;
}

.mn-list{
    list-style-type: disc;
    padding-left: 15px;
}
</style>

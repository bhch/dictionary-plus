<script>
  export let meaning;
</script>

<li class="level-3">
  <div class="label">{meaning.translation}</div>
  <ul>
    {#each meaning.examples as item}
      <li>
        <span class="source">{item.source}</span> <br />
        <span class="translation">{item.translation}</span>
      </li>
    {/each}
  </ul>
</li>

<style lang="scss">
.level-3 .label {
    font-weight: 500;
    color: rgb(51, 65, 85);
    margin-bottom: 4px;
}

.level-3 ul{
    list-style-type: "-  ";
    padding-left: 15px;
}

.level-3 li {
    font-weight: normal;
    line-height: 1.3;
    margin-bottom: 3px;
}
.level-3 .source {
    color: rgb(153, 27, 27);
}

.level-3 .translation {
    color: rgb(22, 101, 52);
    font-style: italic;
}


</style>

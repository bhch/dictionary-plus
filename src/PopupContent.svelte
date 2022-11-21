<svelte:options tag="content-popup" />

<script>
  import PopupSection from "./components/PopupSection.svelte";

  import { onMount } from "svelte";
  export let placement, width, height;
  export let term = null;
  let data = {},
    loading = true;
  let SETTINGS = {};
  const LOADING_MESSAGE = browser.i18n.getMessage("loadingMessage");
  const NO_DEFINITION_MESSAGE = browser.i18n.getMessage("noDefinitionMessage");

  onMount(() => {
    let SETTINGS = {};

    browser.storage.local.get("settings").then((item) => {
      SETTINGS = item.settings || {};
    });

    let sending = browser.runtime.sendMessage({
      type: "fetch-meaning",
      term: term,
    });

    sending.then((response) => {
      data = response || {};
      loading = false;
    });
  });
</script>

<div
  class="container popup-{placement.position}"
  class:dark={SETTINGS.theme == "dark"}
  style:top={placement.top + "px"}
  style:left={placement.left + "px"}
>
  <div class="beak" />
  <div
    class="popup"
    style:min-height={height + "px"}
    style:width={width + "px"}
    style:margin-left={placement.offsetLeft + "px"}
  >
    <div class="header">
      <button class="btn btn-close" type="button" title="Close" /><button
        class="btn btn-listen hide"
        type="button"
        title="Pronunciation"
      /><span class="term">{data.term || term}</span>
    </div>
    <div class="content">
      {#if data.definition}
      <div class="phonetic">{data.phonetic}</div>
      <div class="type">{data.type}</div>
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

    <div class="footer">
      <button class="btn btn-save" title="Save word">Save</button><span
        class="btn label-save hide"
        title="Word has been saved">Saved</span
      ><a
        class="link-more"
        href="https://pawtools.org/dictionary?keyword=options"
        target="_blank"
        rel="noreferrer"
        title="Full definition">More</a
      >
    </div>
  </div>
</div>

<style lang="scss">
  * {
    line-height: 1;
    box-sizing: border-box;
    font-size: 1rem;
    letter-spacing: 0;
    text-shadow: none;
    text-align: left;
  }
  .hide {
    display: none !important;
  }
  .container {
    position: absolute;
    z-index: 2000;
    display: block;
    width: 0;
    overflow: visible;
  }

  .popup {
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 0 16px rgba(0, 0, 0, 0.3);
    display: block;
    padding: 6px 12px;
  }

  .beak {
    width: 14px;
    height: 14px;
    content: "";
    transform: rotate(45deg);
    background: #fff;
    position: absolute;
    left: 0;
    right: 0;
    margin: auto;
  }
  .popup-bottom .beak {
    top: -7px;
    border-left: 1px solid #d6d6d6;
    border-top: 1px solid #d6d6d6;
  }
  .popup-top .beak {
    bottom: -7px;
    border-right: #d6d6d6;
    border-bottom: #d6d6d6;
  }

  .header .btn {
    width: 18px;
    height: 18px;
    border: none;
    border-radius: 100%;
    float: right;
    background-color: transparent;
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
  }

  .header {
    padding-bottom: 3px;
  }

  .header .btn:hover {
    cursor: pointer;
    background-color: #eee;
  }

  .btn-listen {
    margin-right: 6px;
    background-image: url("data:image/svg+xml,%3Csvg width='1em' height='1em' viewBox='0 0 16 16' class='bi bi-volume-up' fill='%23000000' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' d='M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zM6 5.04L4.312 6.39A.5.5 0 0 1 4 6.5H2v3h2a.5.5 0 0 1 .312.11L6 10.96V5.04z'/%3E%3Cpath d='M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z'/%3E%3Cpath d='M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z'/%3E%3Cpath d='M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707z'/%3E%3C/svg%3E");
  }

  .btn-close {
    background-image: url("data:image/svg+xml,%3Csvg width='1em' height='1em' viewBox='0 0 16 16' class='bi bi-x-circle' fill='%23000000' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' d='M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z'/%3E%3Cpath fill-rule='evenodd' d='M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
  }

  .term {
    color: #000;
    font-family: sans-serif;
    font-weight: bold;
    font-size: 18px;
    line-height: 1.2;
  }

  .content {
    min-height: 80px;
    padding-bottom: 12px;
    max-height: 350px;
    overflow: scroll;
  }

  .phonetic {
    font-family: sans-serif;
    font-size: 14px;
    font-weight: normal;
    color: #777;
    padding-bottom: 6px;
  }

  .type {
    font-family: sans-serif;
    font-size: 14px;
    font-style: italic;
    font-weight: normal;
    color: #777;
    padding-bottom: 6px;
  }

  .definition {
    color: #333;
    font-family: sans-serif;
    font-size: 14px;
    font-weight: normal;
    line-height: 1.3;
  }

  .error {
    color: #c30404;
    background: #ffebeb;
    font-family: monospace;
    font-size: 13px;
    line-height: 1.1;
    padding: 5px 2px;
    margin-top: 10px;
    margin-bottom: 10px;
  }

  .report-problem {
    float: none !important;
  }
  .report-problem::after {
    display: none !important;
  }

  .link-more {
    color: blue;
    font-family: sans-serif;
    font-weight: normal;
    font-size: 13px;
    display: inline-block;
    float: right;
    margin-top: 4px;
  }

  .link-more:hover {
    background-color: #eee;
  }

  .link-more::after {
    content: " ";
    width: 14px;
    height: 14px;
    margin-left: 3px;
    display: inline-block;
    vertical-align: bottom;
    background-image: url("data:image/svg+xml,%3Csvg width='1em' height='1em' viewBox='0 0 16 16' class='bi bi-box-arrow-up-right' fill='blue' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' d='M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z'/%3E%3Cpath fill-rule='evenodd' d='M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
  }

  .footer {
    padding-top: 6px;
    display: table;
    width: 100%;
  }

  .footer .btn {
    color: #000;
    background-color: #e8e8e8;
    font-family: sans-serif;
    font-weight: normal;
    font-size: 13px;
    padding: 4px 10px;
    margin-right: 6px;
    border: none;
    border-radius: 10rem;
  }

  .footer .btn:hover {
    background-color: #ddd;
    cursor: pointer;
  }

  .footer .btn::before {
    content: " ";
    height: 14px;
    width: 14px;
    margin-right: 4px;
    display: inline-block;
    vertical-align: middle;
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
    vertical-align: top;
  }

  .btn-save::before {
    background-image: url("data:image/svg+xml,%3Csvg width='1em' height='1em' viewBox='0 0 16 16' class='bi bi-journal-plus' fill='%23000000' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z'/%3E%3Cpath d='M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z'/%3E%3Cpath fill-rule='evenodd' d='M8 5.5a.5.5 0 0 1 .5.5v1.5H10a.5.5 0 0 1 0 1H8.5V10a.5.5 0 0 1-1 0V8.5H6a.5.5 0 0 1 0-1h1.5V6a.5.5 0 0 1 .5-.5z'/%3E%3C/svg%3E");
  }

  .btn.label-save,
  .btn.label-save:hover {
    display: inline-block;
    background-color: #deffb6;
    cursor: default;
  }
  .label-save::before {
    background-image: url("data:image/svg+xml,%3Csvg width='1em' height='1em' viewBox='0 0 16 16' class='bi bi-journal-check' fill='%23000000' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z'/%3E%3Cpath d='M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z'/%3E%3Cpath fill-rule='evenodd' d='M10.854 6.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 8.793l2.646-2.647a.5.5 0 0 1 .708 0z'/%3E%3C/svg%3E");
  }

  .definition * {
    font-size: 14px;
  }

  .dark {
    .popup {
      background-color: #222;
      border: 1px solid #000;
    }

    .beak {
      background: #222;
    }

    .popup-bottom .beak {
      border-left: 1px solid #000;
      border-top: 1px solid #000;
    }
    .popup-top .beak {
      border-right: 1px solid #000;
      border-bottom: 1px solid #000;
    }

    .header .btn:hover {
      background-color: #000;
    }

    .btn-listen {
      margin-right: 6px;
      background-image: url("data:image/svg+xml,%3Csvg width='1em' height='1em' viewBox='0 0 16 16' class='bi bi-volume-up' fill='%23eeeeee' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' d='M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zM6 5.04L4.312 6.39A.5.5 0 0 1 4 6.5H2v3h2a.5.5 0 0 1 .312.11L6 10.96V5.04z'/%3E%3Cpath d='M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z'/%3E%3Cpath d='M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z'/%3E%3Cpath d='M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707z'/%3E%3C/svg%3E");
    }

    .btn-close {
      background-image: url("data:image/svg+xml,%3Csvg width='1em' height='1em' viewBox='0 0 16 16' class='bi bi-x-circle' fill='%23eeeeee' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' d='M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z'/%3E%3Cpath fill-rule='evenodd' d='M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
    }

    .term {
      color: #eee;
    }

    .phonetic {
      color: #aaa;
    }

    .type {
      color: #aaa;
    }

    .definition {
      color: #fff;
    }

    .error {
      color: #fff;
      background: #920202;
    }

    .link-more {
      color: #d9d943;
    }

    .link-more:hover {
      background-color: #000;
    }

    .link-more::after {
      background-image: url("data:image/svg+xml,%3Csvg width='1em' height='1em' viewBox='0 0 16 16' class='bi bi-box-arrow-up-right' fill='%23d9d943' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' d='M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z'/%3E%3Cpath fill-rule='evenodd' d='M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z'/%3E%3C/svg%3E");
    }

    .footer .btn {
      color: #fff;
      background-color: #444;
    }

    .footer .btn:hover {
      background-color: #000;
    }

    .btn-save::before {
      background-image: url("data:image/svg+xml,%3Csvg width='1em' height='1em' viewBox='0 0 16 16' class='bi bi-journal-plus' fill='%23ffffff' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z'/%3E%3Cpath d='M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z'/%3E%3Cpath fill-rule='evenodd' d='M8 5.5a.5.5 0 0 1 .5.5v1.5H10a.5.5 0 0 1 0 1H8.5V10a.5.5 0 0 1-1 0V8.5H6a.5.5 0 0 1 0-1h1.5V6a.5.5 0 0 1 .5-.5z'/%3E%3C/svg%3E");
    }

    .btn.label-save,
    .btn.label-save:hover {
      background-color: #2f5b34;
    }
    .label-save::before {
      background-image: url("data:image/svg+xml,%3Csvg width='1em' height='1em' viewBox='0 0 16 16' class='bi bi-journal-check' fill='%23ffffff' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z'/%3E%3Cpath d='M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z'/%3E%3Cpath fill-rule='evenodd' d='M10.854 6.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 8.793l2.646-2.647a.5.5 0 0 1 .708 0z'/%3E%3C/svg%3E");
    }
  }
</style>

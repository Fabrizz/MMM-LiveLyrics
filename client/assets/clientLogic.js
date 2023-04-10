/* THIS CODE WAS RUSHED, ITS A WORKING PREVIEW */
const source = new EventSource("./events");

let loadingMedia = true;
let loadingLyrics = true;
let noLyrics = true;
let lastName = "";
let lastLyrics = "";
let n = "MMM-LiveLyrics";
let frontendAvailable = false;
let media = null;
let search = "...";

let theme = localStorage.getItem("theme");
setTheme(theme);

let status = "HIDDEN";

console.log(
  ` ⠖ %c by Fabrizz %c ${n}`,
  "background-color: #555;color: #fff;margin: 0.4em 0em 0.4em 0.4em;padding: 5px 3px 5px 5px;border-radius: 7px 0 0 7px;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;",
  "background-color: #bc81e0;background-image: linear-gradient(90deg, #9A3412, #F97316);color: #fff;margin: 0.4em 0.4em 0.4em 0em;padding: 5px 5px 5px 3px;border-radius: 0 7px 7px 0;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;text-shadow: 0 1px 0 rgba(1, 1, 1, 0.3)",
);

source.addEventListener("message", (message) => {
  const sync = JSON.parse(message.data);

  if (sync.dataType === "STATUS") {
    let h = document.getElementById("stHide");
    let s = document.getElementById("stShow");
    let k = document.getElementById("socket");

    if (sync.frontendAvailable && !frontendAvailable) {
      frontendAvailable = true;
      document.getElementById("load").classList.add("hidden");
    }

    if (sync.moduleHidden) {
      s.classList.remove("hidden");
      h.classList.add("hidden");

      k.classList.add("hidden");
    } else {
      s.classList.add("hidden");
      h.classList.remove("hidden");

      k.classList.remove("hidden");
    }

    document.getElementById("statusDebug").innerText = JSON.stringify(
      sync,
      null,
      "|  ",
    );

    // console.log("STATUS", sync);
  }
  if (sync.dataType === "MEDIA") {
    if (!sync.empty && media !== sync.title) {
      document.getElementById("empty").classList.add("hidden");
    }
    media = sync.title;

    document.getElementById(
      "socket",
    ).innerHTML = `<span class="badge text-bg-primary" style="font-size: 0.88em">${search}</span>`;

    if (!sync.title) {
      document.getElementById("none").classList.remove("hidden");
      document.getElementById("media").classList.add("hidden");
    } else {
      document.getElementById("none").classList.add("hidden");
      document.getElementById("media").classList.remove("hidden");
    }

    if (loadingMedia) {
      document.getElementById("mainLoader").classList.add("hidden");
      document.getElementById("cardLoader").classList.remove("hidden");
      loadingMedia = false;
    }

    document.getElementById("mediaDebug").innerText = JSON.stringify(
      sync,
      null,
      "|  ",
    );

    if (!sync.empty && sync.title) {
      document.getElementById("media").classList.remove("hidden");
      document.getElementById("title").innerText = sync.title;
      document.getElementById("subtitle").innerText = sync.artists;
      document.getElementById("img").src = sync.image;

      lastName = sync.title;
    } else {
      document.getElementById("media").classList.add("hidden");
    }

    // console.log("MEDIA", sync);
  }
  if (sync.dataType === "LYRICS") {
    if (loadingLyrics) {
      document.getElementById("lyLoader").classList.add("hidden");
      loadingLyrics = false;
    }

    document.getElementById("responseDebug").innerText = JSON.stringify(
      { ...sync, lyrics: sync.lyrics ? "[HIDDEN HERE]" : null },
      null,
      "|  ",
    );

    if (!sync.empty) this.frontendAvailable = true;

    if (!sync.empty && sync.successful && sync.title === lastName) {
      if (noLyrics) {
        document.getElementById("empty").classList.add("hidden");
        document.getElementById("socket").classList.remove("hidden");
        noLyrics = false;
      }

      document.getElementById("socket").innerText = sync.lyrics;
      lastLyrics = sync.title;
    } else {
      if (frontendAvailable) {
        noLyrics = true;
        lastLyrics = null;
        document.getElementById("empty").classList.remove("hidden");
        document.getElementById("socket").classList.add("hidden");
      }
    }

    // console.log("LYRICS", sync);
  }
  if (sync.dataType === "TRANSLATIONS") {
    // console.log("TRANSLATIONS", sync);

    document.getElementById("transalationDebug").innerText = JSON.stringify(
      sync,
      null,
      "|  ",
    );

    search = sync.SEARCHING_LYRICS;

    document.getElementById("stHideT").innerText = sync.BUTTON_HIDE;
    document.getElementById("stShowT").innerText = sync.BUTTON_SHOW;
    document.getElementById("emptyText").innerText = sync.NO_LYRICS;

    document.getElementById("dialogClose").innerText = sync.CONFIG_CLOSE;
    document.getElementById("dialogTitle").innerText = sync.CONFIG_TITLE;
    document.getElementById("dialogTheme").innerText = sync.CONFIG_THEME;

    document.getElementById("debugLabel").innerText = sync.CONFIG_DEBUG;
    document.getElementById("statusLabel").innerText = sync.CONFIG_STATUS;
    document.getElementById("mediaLabel").innerText = sync.CONFIG_MEDIA;
    document.getElementById("responseLabel").innerText = sync.CONFIG_RESPONSE;
    document.getElementById("transalationLabel").innerText =
      sync.CONFIG_TRANSLATIONS;
  }
});

/**
 * Rudimaentary theme support
 *
 * @param {string} t light/dark
 */
function setTheme(t) {
  const r = document.querySelector(":root");
  localStorage.setItem("theme", t);
  if (t === "dark") {
    r.style.setProperty("--white", "var(--b)");
    r.style.setProperty("--white-m", "var(--bm)");
    r.style.setProperty("--black", "var(--w)");
    r.style.setProperty("--black-m", "var(--wm)");
    r.style.setProperty("--overlay", "black");
  }
  if (t === "light") {
    r.style.setProperty("--white", "var(--w)");
    r.style.setProperty("--white-m", "var(--wm)");
    r.style.setProperty("--black", "var(--b)");
    r.style.setProperty("--black-m", "var(--bm)");
    r.style.setProperty("--overlay", "var(--bm)");
  }
}

/**
 * Rudimaentary theme support
 */
function toggle() {
  let a = localStorage.getItem("theme");
  if (!a) a = "light";
  a === "light" ? setTheme("dark") : setTheme("light");
}

/**
 * Toggle module
 */
function module() {
  fetch("./api/toggle", {
    method: "post",
    cache: "no-cache",
  });
}

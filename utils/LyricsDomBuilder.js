class LyricsDomBuilder {
  constructor(pathPrefix, config, translator) {
    this.pathPrefix = pathPrefix;
    this.translate = translator;
    this.config = config;
    this.root = document.querySelector(":root");
    this.backgroundColors = ["V", "DV", "LV", "M", "DM", "LM"];

    this.icons = {
      icon: "M21,3V15.5A3.5,3.5 0 0,1 17.5,19A3.5,3.5 0 0,1 14,15.5A3.5,3.5 0 0,1 17.5,12C18.04,12 18.55,12.12 19,12.34V6.47L9,8.6V17.5A3.5,3.5 0 0,1 5.5,21A3.5,3.5 0 0,1 2,17.5A3.5,3.5 0 0,1 5.5,14C6.04,14 6.55,14.12 7,14.34V6L21,3Z",
      load: "M2 12C2 16.97 6.03 21 11 21C13.39 21 15.68 20.06 17.4 18.4L15.9 16.9C14.63 18.25 12.86 19 11 19C4.76 19 1.64 11.46 6.05 7.05C10.46 2.64 18 5.77 18 12H15L19 16H19.1L23 12H20C20 7.03 15.97 3 11 3C6.03 3 2 7.03 2 12Z",
      warning:
        "M13,2V4C17.39,4.54 20.5,8.53 19.96,12.92C19.5,16.56 16.64,19.43 13,19.88V21.88C18.5,21.28 22.45,16.34 21.85,10.85C21.33,6.19 17.66,2.5 13,2M11,2C9.04,2.18 7.19,2.95 5.67,4.2L7.1,5.74C8.22,4.84 9.57,4.26 11,4.06V2.06M4.26,5.67C3,7.19 2.24,9.04 2.05,11H4.05C4.24,9.58 4.8,8.23 5.69,7.1L4.26,5.67M2.06,13C2.26,14.96 3.03,16.81 4.27,18.33L5.69,16.9C4.81,15.77 4.24,14.42 4.06,13H2.06M7.06,18.37L5.67,19.74C7.18,21 9.04,21.79 11,22V20C9.58,19.82 8.23,19.25 7.1,18.37H7.06M13,13V7H11V13H13M13,17V15H11V17H13Z",
      search:
        "M15.5,12C18,12 20,14 20,16.5C20,17.38 19.75,18.21 19.31,18.9L22.39,22L21,23.39L17.88,20.32C17.19,20.75 16.37,21 15.5,21C13,21 11,19 11,16.5C11,14 13,12 15.5,12M15.5,14A2.5,2.5 0 0,0 13,16.5A2.5,2.5 0 0,0 15.5,19A2.5,2.5 0 0,0 18,16.5A2.5,2.5 0 0,0 15.5,14M5,3H19C20.11,3 21,3.89 21,5V13.03C20.5,12.23 19.81,11.54 19,11V5H5V19H9.5C9.81,19.75 10.26,20.42 10.81,21H5C3.89,21 3,20.11 3,19V5C3,3.89 3.89,3 5,3M7,7H17V9H7V7M7,11H12.03C11.23,11.5 10.54,12.19 10,13H7V11M7,15H9.17C9.06,15.5 9,16 9,16.5V17H7V15Z",
      nolyrics:
        "M2,5.27L3.28,4L20,20.72L18.73,22L16,19.26C15.86,21.35 14.12,23 12,23A4,4 0 0,1 8,19V18H7L6.16,9.82C5.82,9.47 5.53,9.06 5.33,8.6L2,5.27M9,3A4,4 0 0,1 13,7H8.82L6.08,4.26C6.81,3.5 7.85,3 9,3M11.84,9.82L11.82,10L9.82,8H12.87C12.69,8.7 12.33,9.32 11.84,9.82M11,18H10V19A2,2 0 0,0 12,21A2,2 0 0,0 14,19V17.27L11.35,14.62L11,18M18,10H20L19,11L20,12H18A2,2 0 0,0 16,14V14.18L14.3,12.5C14.9,11 16.33,10 18,10M8,12A1,1 0 0,0 9,13C9.21,13 9.4,12.94 9.56,12.83L8.17,11.44C8.06,11.6 8,11.79 8,12Z",
    };

    this.types = {
      style: `internal-style-${this.config.lyricsFillType.toLowerCase()}`,
      scroll: `internal-scroll-${this.config.scrollType.toLowerCase()}`,
      theme: `internal-theme-${this.config.lyricsStyleTheme.toLowerCase()}`,
    };

    this.assets = {
      unknown: "./assets/unknown.png",
    };

    if (typeof this.config.lyricsFontName === "string") {
      this.root.style.setProperty(
        "--LILY-LYRICS-FONT",
        this.config.lyricsFontName,
      );
    }
    if (typeof this.config.lyricsFontSize === "string") {
      this.root.style.setProperty(
        "--LILY-LYRICS-SIZE",
        this.config.lyricsFontSize,
      );
    }
    if (typeof this.config.lyricsTextAlign === "string") {
      this.root.style.setProperty(
        "--LILY-TOPMDLS-ZINDEX",
        this.config.lyricsFontSize,
      );
    }

    if (
      this.config.lyricsStyleTheme === "DynamicblobsFull" &&
      (this.config.lyricsFillType.toLowerCase().includes("calctopmodules") ||
        this.config.lyricsCustomFixedDimentions)
    ) {
      this.root.style.setProperty("--LILY-TOPMDLS-ZINDEX", 21);
    }

    this.root.style.setProperty(
      "--LILY-NOTICE-HELP-TIMEOUT",
      `${this.config.connectionQrDuration * 1000}ms`,
    );
    if (this.config.lyricsContainerBackdropStyle === "blurred") {
      this.root.style.setProperty("--LILY-BACKDROP-BGCOLOR", "transparent");
      this.root.style.setProperty("--LILY-BACKDROP-FILTER", "blur(1em)");
    } else {
      this.root.style.setProperty(
        "--LILY-BACKDROP-BGCOLOR",
        `${
          this.config.lyricsContainerBackdropStyle === "opaque"
            ? "#0000005e"
            : this.config.lyricsContainerBackdropStyle
        }`,
      );
    }
  }

  /* eslint-disable no-undef */

  globalWrapper() {
    const wrapper = document.createElement("div");
    const version = document.createComment(
      ` MMM-LILY Version: ${this.config.version} `,
    );
    const code = document.createComment(
      ` MMM-LiveLyrics by Fabrizz | https://github.com/Fabrizz/MMM-LiveLyrics `,
    );

    wrapper.classList.add("LILY-Base", "LILY-Custom");
    wrapper.id = "LILY-WRAPPER";
    wrapper.appendChild(version);
    wrapper.appendChild(code);
    return wrapper;
  }

  loading() {
    const wrapper = this.globalWrapper();
    const content = document.createElement("div");

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("fill", "currentColor");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.classList.add("icon");
    const state = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    state.setAttribute("fill", "currentColor");
    state.setAttribute("viewBox", "0 0 24 24");
    state.classList.add("icon");

    const pa = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pa.setAttribute("d", this.icons.icon);

    const pb = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pb.setAttribute("d", this.icons.load);

    icon.appendChild(pa);
    state.appendChild(pb);
    content.appendChild(icon);
    content.appendChild(state);

    content.classList.add("loading");
    content.id = "LILY-LOADING";
    wrapper.appendChild(content);
    return wrapper;
  }

  hideLoading() {
    const el = document.getElementById("LILY-LOADING");
    if (el) el.innerHTML = "";
  }

  warning(title, subtitle, url) {
    const wrapper = this.globalWrapper();
    wrapper.appendChild(
      this.noticeCreator(
        title,
        subtitle,
        this.icons.warning,
        "warning",
        this.generateQR(url),
      ),
    );
    return wrapper;
  }

  help(title, subtitle, url) {
    const wrapper = this.globalWrapper();
    wrapper.appendChild(
      this.noticeCreator(
        title,
        subtitle,
        this.icons.icon,
        "help",
        this.generateQR(url),
      ),
    );
    return wrapper;
  }

  paint(current, lyrics) {
    const wrapper = this.globalWrapper();
    const main = document.createElement("div");
    const gridOnBackdrop = this.config.lyricsStyleTheme === "DynamicblobsFull";
    main.classList.add(
      "main",
      this.types.style,
      this.types.scroll,
      this.types.theme,
      this.config.hideStrategy
        ? `internal-visibility-${this.config.hideStrategy.toLowerCase()}`
        : "internal-visibility-unknown",
      this.config.lyricsCustomFixedDimentions
        ? "internal-custom-reset"
        : "internal-default-reset",
      this.config.blurToBlackOnFull
        ? "internal-use-blackout"
        : "internal-no-blackout",
      current
        ? lyrics
          ? lyrics.lyrics
            ? "found"
            : "missing"
          : "searching"
        : "unknown",
      current
        ? current.playerIsEmpty
          ? "upstream-empty"
          : "upstream-playing"
        : "upstream-unknown",
    );

    const backdrop = document.createElement("div");
    backdrop.classList.add("backdrop");
    const sub = document.createElement("div");
    sub.classList.add("sub");
    const view = document.createElement("div");
    view.classList.add("view");
    const blobs = document.createElement("div");
    blobs.classList.add("blobs");
    const grid = this.getGridOfBlobs();

    const media = document.createElement("div");
    media.classList.add("media");
    const cover = document.createElement("div");
    cover.classList.add("cover");
    cover.style.backgroundImage = `url(${
      current
        ? current.playerIsEmpty
          ? `/${this.pathPrefix}${this.assets.unknown}`
          : current.image
        : `/${this.pathPrefix}${this.assets.unknown}`
    })`;
    const info = document.createElement("div");
    info.classList.add("info");
    const title = document.createElement("div");
    title.classList.add("title");
    title.innerText = current
      ? current.playerIsEmpty
        ? this.translate("UNKNOWN_TOP")
        : current.name
      : this.translate("UNKNOWN_TOP");
    const subtitle = document.createElement("div");
    subtitle.classList.add("subtitle");
    subtitle.innerText = current
      ? current.playerIsEmpty
        ? this.translate("UNKNOWN_SUB")
        : current.artists
      : this.translate("UNKNOWN_SUB");

    media.appendChild(cover);
    info.appendChild(title);
    info.appendChild(subtitle);
    media.appendChild(info);

    const container = document.createElement("div");
    container.classList.add("container");
    container.id = "LILY-CONTAINER";
    const ly = document.createElement("div");
    ly.classList.add("ly");
    ly.id = "LILY-LYRICS";

    if (lyrics) {
      if (lyrics.lyrics) {
        ly.innerText = lyrics.lyrics;
      } else {
        /* media.classList.add("extended"); */

        const nolyrics = document.createElement("div");
        nolyrics.classList.add("nolyrics");
        const constructor = document.createElement("div");
        constiner.classList.add("container");

        const ico = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg",
        );
        ico.setAttribute("fill", "currentColor");
        ico.setAttribute("viewBox", "0 0 24 24");
        ico.classList.add("icon");
        const path = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path",
        );
        path.setAttribute("d", this.icons.nolyrics);
        ico.appendChild(path);
        nolyrics.appendChild(ico);

        view.appendChild(nolyrics);
        view.appendChild(media);
        blobs.appendChild(grid);
        sub.appendChild(blobs);
        sub.appendChild(view);
        main.appendChild(sub);
        if (gridOnBackdrop) backdrop.appendChild(grid);
        main.appendChild(backdrop);
        wrapper.appendChild(main);
        return wrapper;
      }
    } else {
      if (current) {
        const search = document.createElement("div");
        search.classList.add("search");
        search.innerText = current
          ? current.playerIsEmpty
            ? "NOTHING PLAYING"
            : "SEARCHING"
          : "NOTHING PLAYING";
        ly.appendChild(search);
      }
    }

    /*view.appendChild(header);*/
    container.appendChild(ly);
    view.appendChild(container);
    view.appendChild(media);
    blobs.appendChild(grid);
    sub.appendChild(blobs);
    sub.appendChild(view);
    main.appendChild(sub);
    if (gridOnBackdrop) backdrop.appendChild(grid);
    main.appendChild(backdrop);
    wrapper.appendChild(main);
    return wrapper;
  }

  /* GENERAL */
  noticeCreator(title, subtitle, icon, name, qr) {
    const main = document.createElement("div");
    const content = document.createElement("div");
    const spacer = document.createElement("div");
    spacer.classList.add("spacer");

    const progress = document.createElement("div");
    progress.classList.add("progress");
    const bar = document.createElement("span");
    bar.classList.add("bar");
    progress.appendChild(bar);

    const left = document.createElement("div");
    left.classList.add("mainc");

    const ico = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    ico.setAttribute("fill", "currentColor");
    ico.setAttribute("viewBox", "0 0 24 24");
    ico.classList.add("icon");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", icon);
    ico.appendChild(path);
    const titl = document.createElement("span");
    titl.classList.add("title");
    titl.innerText = title;
    const sub = document.createElement("span");
    sub.classList.add("subtitle");
    sub.innerText = subtitle;

    left.appendChild(ico);
    left.appendChild(spacer);
    left.appendChild(titl);
    left.appendChild(sub);
    left.appendChild(progress);

    const right = document.createElement("div");
    right.classList.add("qrContainer");
    if (qr) {
      qr.classList.add("qr");
      right.appendChild(qr);
    }

    main.classList.add("notice");
    content.classList.add(name, "content");
    content.appendChild(left);
    content.appendChild(right);
    main.appendChild(content);
    return main;
  }

  /* UTILS */
  generateQR(url) {
    const container = document.createElement("div");
    container.classList.add("qrcode");
    if (!("QRCode" in window)) {
      console.warn("QRCode library (vendor) not loaded correctly!");
      container.classList.add("qrcodeError");
      return container;
    }
    container.innerHTML = new QRCode({
      content: url,
      join: true,
      container: "svg-viewbox",
      xmlDeclaration: false,
      ecl: "H",
      color: "currentColor",
      background: "transparent",
      padding: 0,
      width: 200,
      height: 200,
    }).svg();
    return container;
  }

  getGridOfBlobs() {
    const grid = document.createElement("div");
    grid.classList.add("grid");
    this.backgroundColors.forEach((bg) => {
      const sq = document.createElement("div");
      sq.classList.add("blob", `blob-${bg}`);
      sq.style.gridArea = bg;
      grid.appendChild(sq);
    });
    if (this.config.blurToBlackOnFull) {
      ["A", "B", "C", "D"].forEach((bo) => {
        const sq = document.createElement("div");
        sq.classList.add("blackout", `blackout-${bo}`);
        sq.style.gridArea = `B${bo}`;
        grid.appendChild(sq);
      });
    }
    return grid;
  }

  getTopModulesHeight() {
    const cs = getComputedStyle(document.body, null);
    const emsz = Number(cs.fontSize.replace(/[^\d]/g, ""));
    const padd = cs.getPropertyValue("--gap-body-top");
    const left = this.root.querySelector(".region.top.left").clientHeight;
    const right = this.root.querySelector(".region.top.right").clientHeight;
    const all = Math.max(left, right) + Number(padd.replace(/[^\d]/g, ""));

    this.root.style.setProperty("--LILY-CALC-MODULES-LT", `${left}px`);
    this.root.style.setProperty("--LILY-CALC-MODULES-RT", `${right}px`);
    this.root.style.setProperty("--LILY-CALC-GLOBAL-EM", `${emsz}px`);
    this.root.style.setProperty("--LILY-CALC-MODULES-MX", `${all}px`);
  }
}
/*
  scrollLyrics: (scroller) => {
    if (!scroller) return;
    let container = document.getElementById("sp-lry-box");
    let lyrics = document.getElementById("sp-lry-txt");
    let progressBar = document.getElementById("sp_nfo_progress");

    let containerSize = container.clientHeight;
    let lyricsSize = container.scrollHeight;

    if (containerSize === lyricsSize || lyricsSize < containerSize) return;
    let currentMs = parseInt(progressBar.getAttribute("value")) ?? 1;
    let totalMS = parseInt(progressBar.getAttribute("max")) ?? 1;
    let playingProgress = Math.round((currentMs / totalMS) * 100);
    let changeEvery = Math.round(100 / (lyricsSize / containerSize));
    let multiplyBy = Math.trunc(playingProgress / changeEvery);
    let totalTimes = Math.ceil(100 / changeEvery);

    console.log(
      `SIZING: ${containerSize}px/${lyricsSize}px (${Math.round((lyricsSize / totalTimes) * 10) / 10
      }px) | PLAY: ${playingProgress}%, moves every: ${changeEvery}% | CURRENT: ${multiplyBy} (${totalTimes}) (${(Math.round((lyricsSize / totalTimes) * 10) / 10) * multiplyBy
      })`
    );

    container.scrollTo({
      top: (Math.round((lyricsSize / totalTimes) * 10) / 10) * multiplyBy,
      behavior: "smooth"
    });
  }
});
*/
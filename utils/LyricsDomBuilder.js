class LyricsDomBuilder {
  constructor(pathPrefix, config, translator) {
    this.pathPrefix = pathPrefix;
    this.config = config;
    this.translate = translator; // Remove later as transalation is done on entry point
    this.root = document.querySelector(":root");

    this.icons = {
      icon: "M21,3V15.5A3.5,3.5 0 0,1 17.5,19A3.5,3.5 0 0,1 14,15.5A3.5,3.5 0 0,1 17.5,12C18.04,12 18.55,12.12 19,12.34V6.47L9,8.6V17.5A3.5,3.5 0 0,1 5.5,21A3.5,3.5 0 0,1 2,17.5A3.5,3.5 0 0,1 5.5,14C6.04,14 6.55,14.12 7,14.34V6L21,3Z",
      load: "M2 12C2 16.97 6.03 21 11 21C13.39 21 15.68 20.06 17.4 18.4L15.9 16.9C14.63 18.25 12.86 19 11 19C4.76 19 1.64 11.46 6.05 7.05C10.46 2.64 18 5.77 18 12H15L19 16H19.1L23 12H20C20 7.03 15.97 3 11 3C6.03 3 2 7.03 2 12Z",
      warning:
        "M13,2V4C17.39,4.54 20.5,8.53 19.96,12.92C19.5,16.56 16.64,19.43 13,19.88V21.88C18.5,21.28 22.45,16.34 21.85,10.85C21.33,6.19 17.66,2.5 13,2M11,2C9.04,2.18 7.19,2.95 5.67,4.2L7.1,5.74C8.22,4.84 9.57,4.26 11,4.06V2.06M4.26,5.67C3,7.19 2.24,9.04 2.05,11H4.05C4.24,9.58 4.8,8.23 5.69,7.1L4.26,5.67M2.06,13C2.26,14.96 3.03,16.81 4.27,18.33L5.69,16.9C4.81,15.77 4.24,14.42 4.06,13H2.06M7.06,18.37L5.67,19.74C7.18,21 9.04,21.79 11,22V20C9.58,19.82 8.23,19.25 7.1,18.37H7.06M13,13V7H11V13H13M13,17V15H11V17H13Z",
    };
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
    document.getElementById("LILY-LOADING").innerHTML = "";
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

  paint(str) {
    const wrapper = this.globalWrapper();
    const content = document.createElement("div");
    content.innerText = str;
    wrapper.appendChild(content);
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
    left.classList.add("main");

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
}

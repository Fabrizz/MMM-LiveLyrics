class LyricsDomBuilder {
  constructor(pathPrefix, config, translator) {
    this.pathPrefix = pathPrefix;
    this.config = config;
    this.translate = translator;
    this.root = document.querySelector(":root");

    this.icons = {
      icon: "M21,3V15.5A3.5,3.5 0 0,1 17.5,19A3.5,3.5 0 0,1 14,15.5A3.5,3.5 0 0,1 17.5,12C18.04,12 18.55,12.12 19,12.34V6.47L9,8.6V17.5A3.5,3.5 0 0,1 5.5,21A3.5,3.5 0 0,1 2,17.5A3.5,3.5 0 0,1 5.5,14C6.04,14 6.55,14.12 7,14.34V6L21,3Z",
      load: "M2 12C2 16.97 6.03 21 11 21C13.39 21 15.68 20.06 17.4 18.4L15.9 16.9C14.63 18.25 12.86 19 11 19C4.76 19 1.64 11.46 6.05 7.05C10.46 2.64 18 5.77 18 12H15L19 16H19.1L23 12H20C20 7.03 15.97 3 11 3C6.03 3 2 7.03 2 12Z",
      warning: "",
    };
  }

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

  warning(title, subtitle) {
    const wrapper = this.globalWrapper();
    wrapper.appendChild(
      this.noticeCreator(
        this.translate(title),
        this.translate(subtitle),
        this.icons.warning,
        "warning",
        this.generateQR("https://github.com/fabrizz/MMM-LiveLyrics"),
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
    const content = document.createElement("div");

    const left = document.createElement("div");
    left.classList.add("content");

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
    left.appendChild(titl);
    left.appendChild(sub);

    const right = document.createElement("div");
    right.classList.add("qrContainer");
    if (qr) {
      qr.classList.add("qr");
      right.appendChild(qr);
    }

    content.classList.add(name, "notice");
    content.appendChild(left);
    content.appendChild(right);
    return content;
  }

  /* UTILS */
  generateQR(url) {
    const a = document.createElement("div");
    a.innerText = "QRCODE";
    return a;
  }
}

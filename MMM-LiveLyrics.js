/*
 * MMM-LiveLyrics
 * MIT license
 *
 * By Fabrizz <3 | https://github.com/Fabrizz/MMM-LiveLyrics
 *
 * Original idea by Michael Trenkler https://github.com/shin10
 */

"use strict";

Module.register("MMM-LiveLyrics", {
  defaults: {
    name: "MMM-LiveLyrics",
    useDefaultSearchFormatter: true,
    useMultipleArtistInSearch: true,
    customRegexSearch: null,
    customRegexLyrics: null,

    startHidden: false,
    logSuspendResume: true,

    showSpotifyCodeIfEnabled: true,
    useDynamicThemeIfEnabled: true,

    showConnectionQrOnLoad: true,
    connectionQrDuration: 12,

    // TYPE * DISPLAY * MODE
    lyricsType: ["overlay", "filled", "fullscreen"],
    // TYPE * TIME
    scrollBehaivour: ["divided", 2],

    // Internal, if you want to change event mapping
    events: {
      NOW_PLAYING: "NOW_PLAYING",
      THEME_PREFERENCE: "THEME_PREFERENCE",
      DEVICE_CHANGE: "DEVICE_CHANGE",

      LYRICS_TOGGLE: "LYRICS_TOGGLE",
      LYRICS_SHOW: "LYRICS_SHOW",
      LYRICS_HIDE: "LYRICS_HIDE",

      ONSPOTIFY_NOTICE: "ONSPOTIFY_NOTICE",
      LIVELYRICS_GET: "LIVELYRICS_GET",

      ALL_MODULES_STARTED: "ALL_MODULES_STARTED",
    },
  },

  start: function () {
    this.logBadge();
    this.moduleHidden = this.config.startHidden;
    this.firstPaint = true;
    this.firstSuspend = this.config.startHidden;
    this.lyrics = null;
    this.current = null;
    this.moduleColor = "#F97316";
    this.masterFound = false;
    this.lock = false;
    this.enable = false;
    this.upstreamConfig = null;
    this.upstreamNotFound = false;

    ///////////////////////
    this.version = "1.0.0";
    ///////////////////////

    this.config.version = this.version;

    // eslint-disable-next-line no-undef
    this.builder = new LyricsDomBuilder(this.file(""), this.config, (a, b) =>
      this.translate(a, b),
    );

    this.sendSocketNotification("SET_CREDENTIALS", {
      apiKey: this.config.apiKey,
      useMultipleArtists: this.config.useMultipleArtistInSearch,
      useFormatter: this.config.useDefaultSearchFormatter,
      userRegex: this.config.customRegexSearch,
      userRegexlyrics: this.config.customRegexLyrics,
      startHidden: this.config.startHidden,
    });

    this.sendSocketNotification("GET_SERVER", {
      port: this.config.port,
      path: this.config.basePath,
      https: this.config.useHttps,
      show: this.config.showConnectionQrOnLoad,
    });

    setTimeout(() => {
      if (this.masterFound) return;
      this.enable = false;
      this.upstreamNotFound = true;
      this.moduleHidden ? this.show() : this.updateDom();
    }, 6000);
  },

  getDom: function () {
    if (this.firstPaint && !this.lyrics) {
      this.firstPaint = false;
      // Notice: Time until it its not shown even if repainted
      // Useful if the module is resumend from other module
      if (this.startHidden) return this.builder.loading();
      return this.builder.globalWrapper();
    }

    if (this.upstreamNotFound)
      // Notice: Title, Subtitle
      return this.builder.warning(
        "ONSPOTIFY_BROKEN",
        "ONSPOTIFY_STEPS",
        "https://github.com/fabrizz/MMM-OnSpotify#lyrics",
      );

    return this.builder.paint(
      `${
        this.current
          ? JSON.stringify(this.current, null, "|  ")
          : "CURRENT UNKNOWN"
      } ${
        this.lyrics
          ? JSON.stringify(
              this.lyrics.lyrics ? this.lyrics.lyrics : "LYRICS NOT FOUND",
              null,
              "|  ",
            )
          : "LYRIC DATA UNAVAILABLE"
      }`,
    );
  },

  getStyles: function () {
    return [this.file("css/included.css"), this.file("css/custom.css")];
  },
  getScripts: function () {
    let files = [
      this.file("node_modules/qrcode-svg/dist/qrcode.min.js"),
      this.file("utils/LyricsDomBuilder.js"),
    ];
    return files;
  },
  getTranslations: function () {
    return {
      en: "translations/en.json",
      es: "translations/es.json",
    };
  },

  notificationReceived: function (notification, payload) {
    this.config.events[notification]?.split(" ").forEach((e) => {
      switch (e) {
        case "NOW_PLAYING":
          this.sendSocketNotification("SYNC", payload);
          this.lyrics = null;
          this.current = payload;
          if (this.enable) this.updateDom();
          break;
        case "LYRICS_TOGGLE":
          this.moduleHidden ? this.show() : this.hide();
          break;
        case "LYRICS_SHOW":
          this.show();
          break;
        case "LYRICS_HIDE":
          this.hide();
          break;
        case "ONSPOTIFY_NOTICE":
          this.masterFound = true;
          this.enable = true;
          console.info(
            "%c· MMM-LiveLyrics %c %c[INFO]%c " +
              this.translate("ONSPOTIFY_FOUND"),
            `background-color:${this.moduleColor};color:black;border-radius:0.4em`,
            "",
            "background-color:darkcyan;color:black;border-radius:0.4em",
            "",
          );
          this.moduleHidden
            ? this.sendSocketNotification("STATUS", {
                moduleHidden: true,
                upstream: this.masterFound,
              })
            : this.sendSocketNotification("STATUS", {
                moduleHidden: false,
                upstream: this.masterFound,
              });
          this.upstreamConfig = payload;
          console.log(this.upstreamConfig);
          break;
        case "DEVICE_CHANGE":
          console.log(payload);
          break;
        case "LIVELYRICS_GET":
          this.sendNotification("LIVELYRICS_NOTICE");
          break;
        case "ALL_MODULES_STARTED":
          if (!this.config.startHidden) this.enable = true;

          this.sendNotification("ONSPOTIFY_GET");
          this.sendSocketNotification("TRANSLATIONS", {
            SEARCHING_LYRICS: this.translate("SEARCHING_LYRICS"),

            BUTTON_HIDE: this.translate("BUTTON_HIDE"),
            BUTTON_SHOW: this.translate("BUTTON_SHOW"),
            NO_LYRICS: this.translate("NO_LYRICS"),

            CONFIG_MEDIA: this.translate("CONFIG_MEDIA"),
            CONFIG_STATUS: this.translate("CONFIG_STATUS"),
            CONFIG_RESPONSE: this.translate("CONFIG_RESPONSE"),
            CONFIG_TRANSLATIONS: this.translate("CONFIG_TRANSLATIONS"),
            CONFIG_DEBUG: this.translate("CONFIG_DEBUG"),

            CONFIG_CLOSE: this.translate("CONFIG_CLOSE"),
            CONFIG_TITLE: this.translate("CONFIG_TITLE"),
            CONFIG_THEME: this.translate("CONFIG_THEME"),

            LANGUAGE: this.translate("LANGUAGE"),
          });

          if (this.config.startHidden)
            setTimeout(() => {
              this.hide();
              this.enable = true;
              this.builder.hideLoading();
            }, 500);
          break;
        default:
          break;
      }
    });
  },
  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      case "LYRICS":
        console.log(payload);
        this.lyrics = payload;
        if (this.enable) this.updateDom();
        break;
      case "GET_STATUS":
        this.moduleHidden
          ? this.sendSocketNotification("STATUS", {
              moduleHidden: true,
              upstream: this.masterFound,
            })
          : this.sendSocketNotification("STATUS", {
              moduleHidden: false,
              upstream: this.masterFound,
            });
        break;
      case "SERVER_DATA":
        console.info(
          `%c· MMM-LiveLyrics %c %c[INFO]%c ${this.translate(
            payload.title,
          )} | ${payload.url}, (${payload.draw ? "DRAW" : "HIDE"} | ${
            payload.overlay ? "OVERLAY" : "SAVE"
          })`,
          `background-color:${this.moduleColor};color:black;border-radius:0.4em`,
          "",
          "background-color:darkcyan;color:black;border-radius:0.4em",
          "",
        );
        break;
      case "SET":
        switch (payload) {
          case "TOGGLE":
            this.moduleHidden ? this.userShow() : this.userHide();
            break;
          case "SHOW":
            this.userShow();
            break;
          case "HIDE":
            this.userHide();
            break;
          default:
            break;
        }
        break;
    }
  },

  suspend: function () {
    this.moduleHidden = true;
    this.sendSocketNotification("STATUS", {
      moduleHidden: true,
      upstream: this.masterFound,
    });
    this.lyrics = null;

    if (this.config.logSuspendResume && !this.firstSuspend)
      console.info(
        "%c· MMM-LiveLyrics %c %c[INFO]%c " + this.translate("SUSPEND"),
        `background-color:${this.moduleColor};color:black;border-radius:0.4em`,
        "",
        "background-color:darkcyan;color:black;border-radius:0.4em",
        "",
      );

    if (this.firstSuspend) {
      console.info(
        "%c· MMM-LiveLyrics %c %c[INFO]%c " +
          this.translate("STARTS_SUSPENDED"),
        `background-color:${this.moduleColor};color:black;border-radius:0.4em`,
        "",
        "background-color:darkcyan;color:black;border-radius:0.4em",
        "",
      );
      this.firstSuspend = false;
    }
  },
  resume: function () {
    if (this.enable || this.upstreamNotFound) this.updateDom();
    this.moduleHidden = false;
    this.sendSocketNotification("STATUS", {
      moduleHidden: false,
      upstream: this.masterFound,
    });
    this.sendNotification("GET_PLAYING");

    if (this.config.logSuspendResume)
      console.info(
        "%c· MMM-LiveLyrics %c %c[INFO]%c " + this.translate("RESUME"),
        `background-color:${this.moduleColor};color:black;border-radius:0.4em`,
        "",
        "background-color:darkcyan;color:black;border-radius:0.4em",
        "",
      );
  },

  userHide: function () {
    this.hide(1000);
  },
  userShow: function () {
    this.show(1000);
  },

  logBadge: function () {
    console.log(
      ` ⠖ %c by Fabrizz %c ${this.name}`,
      "background-color: #555;color: #fff;margin: 0.4em 0em 0.4em 0.4em;padding: 5px 3px 5px 5px;border-radius: 7px 0 0 7px;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;",
      "background-color: #bc81e0;background-image: linear-gradient(90deg, #9A3412, #F97316);color: #fff;margin: 0.4em 0.4em 0.4em 0em;padding: 5px 5px 5px 3px;border-radius: 0 7px 7px 0;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;text-shadow: 0 1px 0 rgba(1, 1, 1, 0.3)",
    );
  },
});

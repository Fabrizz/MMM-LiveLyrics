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
    startHidden: false,
    logSuspendResume: true,
    showConnectionQrOnLoad: false,
    connectionQrDuration: 5,
    sideBySideOnLandscape: false,

    lyricsFillType: "containerCalcTopModules", // container, full, containerCalcTopModules, fullCalcTopModules
    lyricsContainerBackdropStyle: "black", // black, opaque, blurred, transparent
    lyricsStyleTheme: "DynamicblobsFull",
    // "dynamicColors": Uses the data from OnSpotify to theme the background/foregorund colors like the Spotify Lyrics.
    // "dynamicBlobs": Uses the data from OnSpotify to show a (gpu intensive) background using a full palette extracted from the cover art.
    // "DynamicblobsFull": Uses the data from OnSpotify to show a (gpu intensive) background using a full palette extracted from the cover art. (Full viewport size)
    // "normal": Uses the default white/gray shades from MM2

    lyricsCustomFixedDimentions: false,
    // Setting this option to true overrides all the module changes to main/backdrop
    // margins to 0px, so you can manually change the sizings in CSS.
    // The variables responsable of the positon of the module are:
    // --LILY-BACKDROP-MARGIN-L (margin-left)
    // --LILY-BACKDROP-MARGIN-R (margin-right)
    // --LILY-BACKDROP-MARGIN-T (margin-top)
    // --LILY-BACKDROP-MARGIN-B (margin-bottom)
    // --LILY-VIEW-MARGIN-L (margin-left)
    // --LILY-VIEW-MARGIN-R (margin-right)
    // --LILY-VIEW-MARGIN-T (margin-top)
    // --LILY-VIEW-MARGIN-B (margin-bottom)
    // You should respect MM2 default gap sizing if you want the module to look good:
    // --gap-body-top, --gap-body-left, --gap-body-right, --gap-body-bottom
    // You can use calc(<bodyVariable> + <yourSizing>)

    lyricsFontName: null,
    lyricsFontSize: null,
    lyricsTextAlign: null,

    hideSpotifyModule: true,
    updateTopModulesCalcOnData: true,
    hideStrategy: "flex",
    // false: The module is always shown.
    // "MM2": Uses the included MM2 hide/show methods to control the module. Overrides anything that is set by the user.
    // "flex": When nothing is playing the module is hidden using CSS, you can use MM2 to hide/show the module.
    // The module is not shown again if music starts playing after you set the module to hide.
    // This is the best option if you want to enable the module certain times or if you want to control it
    // using scenes or a smarthome system
    blurToBlackOnFull: false,
    // If a background that uses color and blur filters is selected, this functions allow you
    // to diffuminate the border of the screen better with the rest of the mirror that
    // is not covered with the display. If for some reason this is not enough, you
    // can change the opacity and the element positioning changing the grid-template.
    scrollStrategy: "byAnimationFrame",
    scrollUpdateEvery: 3,

    animateColorTransitions: true /* -------------------------------- */,
    animateModuleTransitions: true /* -------------------------------- */,

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
      DOM_OBJECTS_CREATED: "DOM_OBJECTS_CREATED",
    },
  },

  start: function () {
    this.logBadge();
    this.moduleHidden = this.config.startHidden;
    this.firstPaint = true;
    this.firstSuspend = this.config.startHidden;
    this.nowPlaying = false;
    this.lyrics = null;
    this.current = null;
    this.moduleColor = "#F97316";
    this.masterFound = false;
    this.lock = false;
    this.enable = false;
    this.upstreamConfig = null;
    this.upstreamNotFound = false;
    this.server = null;
    this.helpOverlay = false;
    this.helpOverlayTimeout = null;
    this.onSpotifyVersionMismatch = false;
    this.firstSync = this.config.hideSpotifyModule;

    /* Idk why using a simple .contains() does not work as its a string, but hey, I want to sleep */
    this.dynamicTheme =
      this.config.lyricsStyleTheme.toLowerCase() === "dynamicColors" ||
      this.config.lyricsStyleTheme.toLowerCase() === "dynamicBlobs" ||
      this.config.lyricsStyleTheme.toLowerCase() === "DynamicblobsFull";

    if (this.config.hideStrategy)
      this.config.hideStrategy = this.config.hideStrategy.toLowerCase();
    if (this.config.hideStrategy)
      this.config.hideStrategy = this.config.hideStrategy.toLowerCase();
    if (this.config.hideStrategy === "mm2") this.config.startHidden = true;

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
      startHidden: this.config.startHidden,
      hidesAutomatically: this.config.hideStrategy,
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

    // setInterval(() => this.builder.scroller_bySections(), 4000);
    this.selectScrollType(this.config.scrollStrategy);
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
        this.translate("ONSPOTIFY_BROKEN"),
        this.translate("ONSPOTIFY_STEPS"),
        "https://github.com/fabrizz/MMM-OnSpotify#lyrics",
      );

    if (this.onSpotifyVersionMismatch)
      return this.builder.warning(
        this.translate("ONSPOTIFY_MISMATCH"),
        `${this.translate("ONSPOTIFY_UPDATE")} V${
          this.onSpotifyVersionMismatch
        }`,
        "https://github.com/fabrizz/MMM-OnSpotify",
      );

    if (this.helpOverlay)
      return this.builder.help(
        this.translate(this.server.title),
        this.server.url,
        this.server.url,
      );
    return this.builder.paint(this.current, this.lyrics);
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
          if (payload.playerIsEmpty === true) {
            if (this.config.hideSpotifyModule)
              this.sendNotification("ONSPOTIFY_SHOW");
            if (this.config.hideStrategy === "mm2") this.hide();
          }
          if (
            payload.playerIsEmpty === false &&
            (this.moduleHidden || this.firstSync)
          ) {
            if (this.config.hideSpotifyModule)
              this.sendNotification("ONSPOTIFY_HIDE");
            if (this.config.hideStrategy === "mm2") this.show();
            this.firstSync = false;
          }

          payload.playerIsEmpty
            ? (this.nowPlaying = false)
            : (this.nowPlaying = true);

          if (payload.playerIsEmpty) this.builder.setEmpty();

          this.sendSocketNotification("SYNC", {
            ...payload,
            cache: this.current && this.current.uri === payload.uri,
          });
          if (
            this.enable &&
            !(this.current && this.current.uri === payload.uri)
          ) {
            this.current = payload;
            this.lyrics = null;
            this.updateDom();
          }
          this.lyrics = null;
          this.lastState = payload;

          if (this.config.updateTopModulesCalcOnData)
            this.builder.getTopModulesHeight();
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
              `${this.translate("ONSPOTIFY_FOUND")} | V${payload.version}`,
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

          /* Check for versions < than 2.2.X */
          if (
            payload.version &&
            Number(payload.version[0]) <= 2 &&
            Number(payload.version[3]) <= 2
          )
            this.onSpotifyVersionMismatch = payload.version;

          if (this.dynamicTheme && !payload.directColorData) {
            console.warn(
              "%c· MMM-LiveLyrics %c %c[WARN]%c " +
                this.translate("DYNAMIC_UNKNOWN"),
              `background-color:${this.moduleColor};color:black;border-radius:0.4em`,
              "",
              "background-color:orange;color:black;border-radius:0.4em",
              "",
            );
          }
          break;
        case "DEVICE_CHANGE":
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

          if (this.config.startHidden) {
            setTimeout(
              () => {
                if (!this.nowPlaying && this.config.hideStrategy === "mm2")
                  this.hide();
                this.enable = true;
                if (!this.config.showConnectionQrOnLoad)
                  this.builder.hideLoading();
              },
              this.config.showConnectionQrOnLoad
                ? this.config.connectionQrDuration * 1000
                : 500,
            );
          } else {
            this.updateDom();
          }

          break;
        case "DOM_OBJECTS_CREATED":
          setTimeout(() => this.builder.getTopModulesHeight(), 2000);
          break;
        default:
          break;
      }
    });
  },

  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      case "LYRICS":
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
        this.server = payload;
        if (payload.overlay) {
          this.helpOverlay = true;
          this.updateDom();
          this.helpOverlayTimeout = setTimeout(() => {
            this.helpOverlay = false;
            this.updateDom();
          }, this.config.connectionQrDuration * 1000);
        }
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
    this.builder.getTopModulesHeight();
    if (this.upstreamNotFound) this.updateDom();
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

  selectScrollType(name) {
    if (typeof name !== "string") name = "";
    switch (name.toLowerCase()) {
      case "byanimationframe":
        this.builder.scroller_byAnimationFrame();
        break;
      case "none":
        return;
      default:
        this.builder.scroller_bySections(
          this.config.scrollUpdateEvery
            ? this.config.scrollUpdateEvery * 1000
            : 3000,
        );
        break;
    }
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

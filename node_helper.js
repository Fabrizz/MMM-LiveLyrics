/*
 * MMM-LiveLyrics
 * MIT license
 *
 * By Fabrizz <3 | https://github.com/Fabrizz/MMM-LiveLyrics
 */

const NodeHelper = require("node_helper");
const LyricsFetcher = require("./utils/LyricsFetcher");
const express = require("express");
const EventEmitter = require("events").EventEmitter;
const eventStream = new EventEmitter();
const os = require("os");

module.exports = NodeHelper.create({
  start: function () {
    console.log("\x1b[46m%s\x1b[0m", "[Node Helper] Init >> " + this.name);
    this.fetcher = null;
    this.frontendAvailable = false;
    this.serverData = null;
    this.currentData = { empty: true, dataType: "MEDIA" };
    this.currentLyrics = { empty: true, dataType: "LYRICS" };
    this.currentStatus = {
      empty: true,
      dataType: "STATUS",
      modulehidden: true,
    };
    this.translations = { syncError: true };

    /* Configure routes for the remote control
     * Static > Included remote control
     * API > GET [lyrics, state, media] | POST [update, state, player]
     * Event-Stream > Real time sync for the included remote controller / external applications
     */
    const router = express.Router();
    router
      .route("/api/:type")
      .get((q, r) => {
        switch (q.params.type) {
          case "lyrics":
            r.send({
              data: this.currentLyrics,
              tsr: Date.now(),
              via: "MMM-LiveLyrics by Fabrizz",
            });
            break;
          case "status":
            r.send({
              data: {
                ...this.currentStatus,
                frontendAvailable: this.frontendAvailable,
              },
              tsr: Date.now(),
              via: "MMM-LiveLyrics by Fabrizz",
            });
            break;
          case "media":
            r.send({
              data: this.currentData,
              tsr: Date.now(),
              via: "MMM-LiveLyrics by Fabrizz",
            });
            break;
          default:
            break;
        }
      })
      .post((q, r) => {
        switch (q.params.type) {
          case "toggle":
            this.sendSocketNotification("SET", "TOGGLE");
            r.send({
              data: "toggle",
              tsr: Date.now(),
              via: "MMM-LiveLyrics by Fabrizz",
            });
            break;
          case "hide":
            this.sendSocketNotification("SET", "HIDE");
            r.send({
              data: "hide",
              tsr: Date.now(),
              via: "MMM-LiveLyrics by Fabrizz",
            });
            break;
          case "show":
            this.sendSocketNotification("SET", "SHOW");
            r.send({
              data: "show",
              tsr: Date.now(),
              via: "MMM-LiveLyrics by Fabrizz",
            });
            break;
          default:
            break;
        }
      });
    router.get("/events", async (req, res) => {
      res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });
      res.flushHeaders();

      res.write("retry: 10000\n\n");
      res.write(`data: ${JSON.stringify(this.translations)}\n\n`);
      res.write(`data: ${JSON.stringify(this.currentData)}\n\n`);
      res.write(`data: ${JSON.stringify(this.currentLyrics)}\n\n`);
      res.write(
        `data: ${JSON.stringify({
          ...this.currentStatus,
          frontendAvailable: this.frontendAvailable,
        })}\n\n`,
      );

      if (this.currentStatus.modulehidden)
        this.sendSocketNotification("GET_STATUS");

      const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
      const ev = eventStream.on("SSE", send);

      req.on("close", () => ev.removeListener("SSE", send));
    });
    router.use("/", express.static(this.path + "/client"));
    this.expressApp.use("/LiveLyrics", router);
  },

  socketNotificationReceived: async function (notification, payload) {
    switch (notification) {
      case "SET_CREDENTIALS":
        this.frontendAvailable = true;
        eventStream.emit("SSE", {
          ...this.currentStatus,
          dataType: "STATUS",
          frontendAvailable: true,
          blockButtons: payload.hidesAutomatically,
        });

        this.fetcher = new LyricsFetcher(payload);
        this.currentStatus = {
          empty: true,
          dataType: "STATUS",
          modulehidden: payload.startHidden,
        };
        break;
      case "GET_SERVER":
        this.serverData = this.getServerData(payload);
        this.sendSocketNotification("SERVER_DATA", this.serverData);
        break;
      case "SYNC":
        if (!payload.playerIsEmpty) {
          this.currentData = {
            title: payload.name,
            artists: payload.artists,
            image: payload.image,
            dataType: "MEDIA",
            empty: false,
          };
          eventStream.emit("SSE", {
            title: payload.name,
            artists: payload.artists,
            image: payload.image,
            dataType: "MEDIA",
            empty: false,
          });
          if (!this.currentStatus.moduleHidden) this.fetchGenius(payload);
        }
        if (payload.playerIsEmpty) {
          this.currentData = { empty: true, dataType: "MEDIA" };
          eventStream.emit("SSE", { empty: true, dataType: "MEDIA" });
        }
        break;
      case "STATUS":
        this.currentStatus = { ...payload, dataType: "STATUS" };
        eventStream.emit("SSE", {
          ...payload,
          dataType: "STATUS",
          frontendAvailable: this.frontendAvailable,
        });
        break;
      case "TRANSLATIONS":
        this.translations = { ...payload, dataType: "TRANSLATIONS" };
        eventStream.emit("SSE", { ...payload, dataType: "TRANSLATIONS" });
        break;
    }
  },

  fetchGenius: async function (payload) {
    try {
      // if (payload.cache) return this.sendSocketNotification("LYRICS", this.currentLyrics);
      let data = payload.cache
        ? this.currentLyrics
        : await this.fetcher.getLyrics(
            payload.name,
            payload.artists,
            payload.artist,
          );
      if (data instanceof Error)
        return this.sendSocketNotification("LYRICS", { error: true });
      if (this.currentData.title === data.title) {
        this.currentLyrics = {
          ...data,
          empty: false,
          dataType: "LYRICS",
          isFromCache: payload.cache,
        };
        this.sendSocketNotification("LYRICS", this.currentLyrics);
      }
      eventStream.emit("SSE", {
        ...data,
        empty: false,
        dataType: "LYRICS",
        isFromCache: payload.cache,
      });
    } catch (e) {
      console.error(
        "\x1b[41m%s\x1b[0m",
        "[MMM-LiveLyrics] [Node Helper] Get Genius data >> ",
        e,
      );
    }
  },

  getServerData: function (payload) {
    let match = Object.values(os.networkInterfaces())
      .flat()
      .filter(({ family, internal }) => family === "IPv4" && !internal)
      .map(({ address }) => address);

    if (!match)
      return {
        title: "UNKNOWN_ADDRESS",
        url: "http://mm-address:port/LiveLyrics",
        draw: false,
        overlay: payload.show,
      };

    match = `${payload.https ? "https:" : "http"}://${match[0]}:${
      payload.port ? payload.port : "8080"
    }${payload.path ? payload.path : "/"}LiveLyrics`;

    return {
      title: "SUCCESS_ADDRESS",
      url: match,
      draw: true,
      overlay: payload.show,
    };
  },
});

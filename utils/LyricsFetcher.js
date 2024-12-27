/*
 * MMM-LiveLyrics
 * MIT license
 *
 * By Fabrizz <3 | https://github.com/Fabrizz/MMM-LiveLyrics
 *
 * Inspired by Faisal Arshed https://github.com/farshed
 * 
 * This is not the best code! This module is old and needs a refactor.
 * Also web scrapping is not the best but hey, it still works after 2 years.
 */

const cheerio = require("cheerio");
const fetch = require("node-fetch");
const LILYREGEX = require("../LILYREGEX");

const baseApiURL = "https://api.genius.com";
const queryRegex =
  / *\[[^\]]*]|( - )?(\d\d\d\d )?(remastered|remasterizado|remaster)( \d\d\d\d)?( version)?|\([^)]*(feat(.)?( )?|ft(.)? |with(.)? |con )[^)]*\)|(feat(.)? |ft(.)? |with(.)? |con ) (.*)| *\(( *)?\)/gi;

/* TODO: Update regex to take in mind letter only titles (512) */

module.exports = class LyricsFetcher {
  constructor(payload) {
    this.apiKey = payload.apiKey;
    this.lang = payload.lang;
    this.regex = LILYREGEX;

    this.userRegex =
      this.regex.search instanceof RegExp ? this.regex.search : null;
    this.userRegexlyrics =
      this.regex.lyrics instanceof RegExp ? this.regex.lyrics : null;

    this.useFormatter = payload.useFormatter;
    this.useMultipleArtists = payload.useMultipleArtists;

    if (payload.userRegex && !(this.userRegex instanceof RegExp))
      console.error(
        "\x1b[41m%s\x1b[0m",
        "[MMM-LiveLyrics] [Node Helper] RegexChecker >> Malformed RegExp user input.",
      );
    if (payload.userRegexlyrics && !(this.userRegexlyrics instanceof RegExp))
      console.error(
        "\x1b[41m%s\x1b[0m",
        "[MMM-LiveLyrics] [Node Helper] RegexChecker >> Malformed RegExp user input.",
      );
  }

  async getLyrics(title, artists, artist) {
    try {
      let payload = { start: Date.now(), title, artists };

      const query = this.getQuery(title, artists);
      const web = await this.searchSong(query);
      let final = web.response.hits.find(
        // Check if artist / title match
        // Sometimes they dont match, so we try to get the first
        // lyrics in the list, sometimes there are transalations under
        // usernames that start with Genius, so if we encounter one, we skip it.
        // We also check that the url is not a charts/billboard/anniversary url
        // Check more below [getQuery()] >
        (item) => {
          let altArtist = artist.replace("&", "and").toLowerCase();
          let altNames = item.result.artist_names.toLowerCase();
          return (
            (altNames.includes(artist) ||
              altNames.includes(altArtist) ||
              item.result.full_title
                .toLowerCase()
                .includes(title.toLowerCase()) ||
              artists.includes(item.result.artist_names)) &&
            item.type === "song" &&
            !item.result.full_title.match(
              /(translation|traducci[óo]n|traduç[ãa]o|by spotify|sencillos del mes|genius of...)/gi,
            )
          );
        },
      );
      if (!final) {
        final = web.response.hits.find((item) => {
          let url = item.result.url.toLowerCase();
          return (
            url.includes("lyrics") &&
            item.type === "song" &&
            !item.result.url.includes("Genius") &&
            !url.match(/(lyrics|billboard|chart|anniversary)/gi) &&
            !item.result.full_title.match(
              /(translation|traducci[óo]n|traduç[ãa]o|by spotify|sencillos del mes|genius of...)/gi,
            )
          );
        });
      }

      if (!final)
        return {
          ...payload,
          successful: false,
          body: null,
          match: null,
          query,
          options: web,
        };

      const ly = await this.fetchLyrics(final.result.url);
      const $ = cheerio.load(ly);

      let lyrics = "";
      let $lyrics = $('div[id="lyrics-root"]').text().trim();

      if ($lyrics) {
        $('div[data-lyrics-container="true"]').each((i, e) => {
          const lyn = 
          $('<div>')
            .html($(e)
                .html()
                .replace(/<br\s*\/?>/g, "\n")
                .replace(/<(?!\s*br\s*\/?)[^>]+>/gi, "")
              )
            .text()
            .trim();
          
          lyrics += lyn + "\n\n";
        });

        // Genius changed their layout
        // lyrics = "";
        // $('div[class^="Lyrics__Container"]').each((i, elem) => {
        //   if ($(elem).text().length !== 0) {
        //     let snippet = $(elem)
        //       .html()
        //       .replace(/<br>/g, "\n")
        //       .replace(/<(?!\s*br\s*\/?)[^>]+>/gi, "");
        //     lyrics += $("<textarea/>").html(snippet).text().trim() + "\n\n";
        //   }
        // });
        
      }
      lyrics.length > 1 ? (lyrics = lyrics.trim()) : (lyrics = null);

      if (this.userRegexlyrics && lyrics)
        lyrics = lyrics.replace(this.userRegexlyrics, "");

      const end = Date.now();
      return {
        ...payload,
        match: final,
        successful: lyrics ? true : false,
        lyrics,
        end,
        time: payload.start - end,
        query,
        options: web,
      };
    } catch (error) {
      console.error(
        "\x1b[41m%s\x1b[0m",
        "[MMM-LiveLyrics] [Node Helper] LyricsProcess >> Could be: Malformed RegExp user input.",
        error,
      );
    }
  }

  /**
   * @param {string} title
   * @param {string} artists
   * @returns
   * */
  getQuery(title, artists) {
    if (!title && !artists) return null;
    const arts = artists.split(",").map((a) => a.trim());

    // Create a query with the title and 1/2 artists
    let query = `${title} ${arts[0]}${
      this.useMultipleArtists && arts[1] ? ` & ${arts[1]}` : ""
    }`;

    // Use the included regex formatter, works for ES, EN titles, user can
    // create custom regex(s) to format the query based on language or others
    // See at the top [queryRegex] >
    if (this.useFormatter) query = query.replace(queryRegex, "");
    if (this.userRegex) query = query.replace(this.userRegex, "");

    // Remove spaces at the start/end, as well as multiple spaces together
    query = query.replace(/\s+/g, " ").trim();
    return query;
  }

  /**
   * @param {string} query
   * @returns
   * */
  searchSong(query) {
    return fetch(
      new URL(
        `search?q=${encodeURIComponent(query)}&access_token=${this.apiKey}`,
        baseApiURL,
      ),
      {
        method: "GET",
        referrerPolicy: "no-referrer",
      },
    )
      .then((response) => response.json())
      .catch((error) => {
        console.log(error);
      });
  }

  /**
   * @param {string} url
   * @returns
   * */
  async fetchLyrics(url) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept-Language": `${this.lang};q=0.9,en-US,en;q=0.8`,
        },
      });
      return await await response.text();
    } catch (error) {
      return console.error(
        "\x1b[41m%s\x1b[0m",
        "[MMM-LiveLyrics] [Node Helper] LyricsFetcher >> ",
        error);
    }
  }
};

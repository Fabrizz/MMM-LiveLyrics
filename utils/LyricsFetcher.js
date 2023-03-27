/*
 * MMM-LiveLyrics
 * MIT license
 *
 * By Fabrizz <3 | https://github.com/Fabrizz/MMM-LiveLyrics
 *
 * Inspired by Faisal Arshed https://github.com/farshed
 */

// Use node fetch as most MM2 installs use older node
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const baseApiURL = "https://api.genius.com";
const queryRegex =
  / *\[[^\]]*]|( - )?(\d\d\d\d )?(remastered|remasterizado|remaster)( \d\d\d\d)?( version)?|\([^)]*(feat(.)?( )?|ft(.)? |with(.)? |con )[^)]*\)|(feat(.)? |ft(.)? |with(.)? |con ) (.*)| *\(( *)?\)/gi;

/* TODO: Update regex to take in mind letter only titles (512) */

module.exports = class SpotifyFetcher {
  constructor(payload) {
    this.apiKey = payload.apiKey;
    this.userRegex =
      // Check user defined regExp
      payload.userRegex instanceof RegExp
        ? new RegExp(payload.userRegex, "gi")
        : null;
    this.useFormatter = payload.useFormatter;
    this.useMultipleArtists = payload.useMultipleArtists;
    if (payload.userRegex && !(payload.userRegex instanceof RegExp))
      console.error(
        "\x1b[41m%s\x1b[0m",
        "[MMM-LiveLyrics] [Node Helper] LyricsFetcher >> Malformed RegExp user input.",
      );
  }

  async getLyrics(title, artists, artist) {
    console.log("GETTING LYRICS");
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
          let altArtist = artist.replace("&", "and");
          let altNames = item.result.artist_names.toLowerCase();
          let altTitle = item.result.full_title.toLowerCase();
          return (
            (altNames.includes(artist) ||
              altNames.includes(altArtist) ||
              altTitle.includes(title.toLowerCase())) &&
            item.type === "song" &&
            !altTitle.includes("translation") &&
            !altTitle.includes("traducción") &&
            !altTitle.includes("tradução") &&
            !altTitle.includes("by spotify")
          );
        },
      );
      if (!final) {
        final = web.response.hits.find((item) => {
          let url = item.result.url.toLowerCase();
          let altTitle = item.result.full_title.toLowerCase();
          return (
            url.includes("lyrics") &&
            !item.result.url.includes("Genius") &&
            !url.includes("billboard") &&
            !url.includes("chart") &&
            !url.includes("anniversary") &&
            item.type === "song" &&
            !altTitle.includes("translation") &&
            !altTitle.includes("traducción") &&
            !altTitle.includes("tradução") &&
            !altTitle.includes("by spotify")
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
      let lyrics = $('div[class="lyrics"]').text().trim();
      if (!lyrics) {
        lyrics = "";
        $('div[class^="Lyrics__Container"]').each((i, elem) => {
          if ($(elem).text().length !== 0) {
            let snippet = $(elem)
              .html()
              .replace(/<br>/g, "\n")
              .replace(/<(?!\s*br\s*\/?)[^>]+>/gi, "");
            lyrics += $("<textarea/>").html(snippet).text().trim() + "\n\n";
          }
        });
      }
      lyrics ? (lyrics = lyrics.trim()) : (lyrics = null);

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
      console.log(error);
    }
  }

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

  fetchLyrics(url) {
    return fetch(url, {
      method: "GET",
      referrerPolicy: "no-referrer",
    })
      .then((response) => response.text())
      .catch((error) => {
        console.log(error);
      });
  }
};

/*
 * MMM-LiveLyrics
 * MIT license
 *
 * By Fabrizz <3 | https://github.com/Fabrizz/MMM-LiveLyrics
 *
 * Use this file to insert regular expressions to filter the search/output of
 * the Genius service.
 *
 * The example here removes the first part of the lyrics in spanish songs,
 * as they (for some reason) include the name/author at the top.
 *
 * If you want more granular control (or you want to blacklist words/urlParams)
 * you can edit the lyrics fetcher. (utils/LyricsFetcher.js)
 */

module.exports = {
  lyrics: /\[Letra .*?\]\n?\n?/,
  search: null,
};

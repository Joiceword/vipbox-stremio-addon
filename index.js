const { addonBuilder } = require('stremio-addon-sdk');
const axios = require('axios');
const cheerio = require('cheerio');

const manifest = {
    id: 'org.daddylive.football',
    version: '1.0.0',
    name: 'DaddyLive Football Addon',
    description: 'Live Football Streams directly playable from DaddyLive.mp',
    types: ['tv'],
    catalogs: [{ type: 'tv', id: 'daddylive-football' }],
    resources: ['catalog', 'stream'],
    idPrefixes: ['daddylive'],
    logo: 'https://daddylive.mp/images/logo.png'
};

const builder = new addonBuilder(manifest);

// Scrape homepage matches
async function fetchMatches() {
    const res = await axios.get('https://daddylive.mp/');
    const $ = cheerio.load(res.data);

    const matches = [];

    $('ul.list-group li a').each((i, el) => {
        const title = $(el).text().trim();
        const href = $(el).attr('href');

        if (title && href && href.includes('/stream/')) {
            matches.push({
                id: 'daddylive_' + Buffer.from(href).toString('base64'),
                name: title,
                poster: 'https://i.imgur.com/2W9Xq4R.png',
                type: 'tv'
            });
        }
    });

    return matches;
}

// Catalog handler
builder.defineCatalogHandler(async ({ type, id }) => {
    if (id !== 'daddylive-football') return { metas: [] };

    const matches = await fetchMatches();
    return { metas: matches };
});

// Stream handler
builder.defineStreamHandler(async ({ type, id }) => {
    if (!id.startsWith('daddylive_')) return { streams: [] };

    const decodedHref = Buffer.from(id.replace('daddylive_', ''), 'base64').toString();
    const url = 'https://daddylive.mp' + decodedHref;

    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    const iframeSrc = $('iframe').attr('src');

    if (!iframeSrc) {
        return { streams: [] };
    }

    const iframeRes = await axios.get(iframeSrc.startsWith('http') ? iframeSrc : `https://daddylive.mp${iframeSrc}`);
    const iframeBody = iframeRes.data;

    const m3u8Match = iframeBody.match(/['"]([^'"]+\.m3u8[^'"]*)['"]/);

    if (m3u8Match && m3u8Match[1]) {
        return {
            streams: [{
                title: "Live Stream",
                url: m3u8Match[1]
            }]
        };
    } else {
        return { streams: [] };
    }
});

module.exports = builder.getInterface();

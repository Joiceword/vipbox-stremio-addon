const { addonBuilder } = require('stremio-addon-sdk');
const axios = require('axios');
const cheerio = require('cheerio');

const manifest = {
    id: 'org.vipbox.football',
    version: '1.0.1',
    name: 'VIPBox Football Clean',
    description: 'Football streams with multiple links per match from VIPBox',
    types: ['tv'],
    catalogs: [{ type: 'tv', id: 'vipbox-football' }],
    resources: ['catalog', 'stream'],
    idPrefixes: ['vipbox'],
    logo: 'https://www.vipbox.lc/favicon.ico'
};

const builder = new addonBuilder(manifest);

// Scrape today's football matches
async function fetchMatches() {
    const res = await axios.get('https://www.vipbox.lc/');
    const $ = cheerio.load(res.data);

    const matches = [];

    $('a').each((i, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr('href');

        if (href && text && text.toLowerCase().includes('football')) {
            matches.push({
                id: 'vipbox_' + Buffer.from(href).toString('base64'),
                name: text,
                poster: 'https://i.imgur.com/2W9Xq4R.png',
                type: 'tv'
            });
        }
    });

    return matches;
}

// CATALOG HANDLER
builder.defineCatalogHandler(async ({ type, id }) => {
    if (id !== 'vipbox-football') return { metas: [] };

    const matches = await fetchMatches();
    return { metas: matches };
});

// STREAM HANDLER
builder.defineStreamHandler(async ({ type, id }) => {
    if (!id.startsWith('vipbox_')) return { streams: [] };

    const decodedHref = Buffer.from(id.replace('vipbox_', ''), 'base64').toString();
    const url = 'https://www.vipbox.lc' + decodedHref;

    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    const streams = [];

    $('iframe').each((i, el) => {
        const src = $(el).attr('src');

        if (src && src.startsWith('http')) {
            streams.push({
                title: `Stream ${i + 1}`,
                url: src
            });
        }
    });

    return { streams };
});

module.exports = builder.getInterface();

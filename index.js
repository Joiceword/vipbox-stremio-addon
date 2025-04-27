const { addonBuilder } = require('stremio-addon-sdk');
const axios = require('axios');
const cheerio = require('cheerio');

const manifest = {
    id: 'org.soccerlive.football',
    version: '1.0.2',
    name: 'SoccerLive Football Addon',
    description: 'Multiple football streams per match from SoccerLive.app',
    types: ['tv'],
    catalogs: [{ type: 'tv', id: 'soccerlive-football' }],
    resources: ['catalog', 'stream'],
    idPrefixes: ['soccerlive'],
    logo: 'https://soccerlive.app/favicon.ico'
};

const builder = new addonBuilder(manifest);

// Scrape today's football matches from soccerlive.app
async function fetchMatches() {
    const res = await axios.get('https://soccerlive.app/');
    const $ = cheerio.load(res.data);

    const matches = [];

    $('.match-item').each((i, el) => {
        const title = $(el).find('.match-title').text().trim();
        const href = $(el).find('a').attr('href');

        if (title && href) {
            matches.push({
                id: 'soccerlive_' + Buffer.from(href).toString('base64'),
                name: title,
                poster: 'https://i.imgur.com/2W9Xq4R.png', // Placeholder poster for matches
                type: 'tv'
            });
        }
    });

    return matches;
}

// CATALOG HANDLER
builder.defineCatalogHandler(async ({ type, id }) => {
    if (id !== 'soccerlive-football') return { metas: [] };

    const matches = await fetchMatches();
    return { metas: matches };
});

// STREAM HANDLER
builder.defineStreamHandler(async ({ type, id }) => {
    if (!id.startsWith('soccerlive_')) return { streams: [] };

    const decodedHref = Buffer.from(id.replace('soccerlive_', ''), 'base64').toString();
    const url = 'https://soccerlive.app' + decodedHref;

    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    const streams = [];

    $('.stream-links a').each((i, el) => {
        const streamName = $(el).text().trim();
        const streamUrl = $(el).attr('href');

        if (streamUrl && streamName) {
            streams.push({
                title: `Stream from ${streamName}`,
                url: streamUrl
            });
        }
    });

    return { streams };
});

module.exports = builder.getInterface();

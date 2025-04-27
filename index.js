const { addonBuilder } = require('stremio-addon-sdk');
const axios = require('axios');
const cheerio = require('cheerio');

const manifest = {
    id: 'org.soccerlive.football',
    version: '1.0.3',
    name: 'SoccerLive Football Addon',
    description: 'Multiple football streams per match from SoccerLive.app',
    types: ['tv'],
    catalogs: [{ type: 'tv', id: 'soccerlive-football' }],
    resources: ['catalog', 'stream'],
    idPrefixes: ['soccerlive'],
    logo: 'https://soccerlive.app/favicon.ico'
};

const builder = new addonBuilder(manifest);

// Scrape matches
async function fetchMatches() {
    const res = await axios.get('https://soccerlive.app/');
    const $ = cheerio.load(res.data);

    const matches = [];

    $('ul.match-list li').each((i, el) => {
        const matchTitle = $(el).find('.event-name').text().trim();
        const matchHref = $(el).find('a').attr('href');

        if (matchTitle && matchHref) {
            matches.push({
                id: 'soccerlive_' + Buffer.from(matchHref).toString('base64'),
                name: matchTitle,
                poster: 'https://i.imgur.com/2W9Xq4R.png',
                type: 'tv'
            });
        }
    });

    return matches;
}

// Catalog Handler
builder.defineCatalogHandler(async ({ type, id }) => {
    if (id !== 'soccerlive-football') return { metas: [] };

    const matches = await fetchMatches();
    return { metas: matches };
});

// Stream Handler
builder.defineStreamHandler(async ({ type, id }) => {
    if (!id.startsWith('soccerlive_')) return { streams: [] };

    const decodedHref = Buffer.from(id.replace('soccerlive_', ''), 'base64').toString();
    const url = 'https://soccerlive.app' + decodedHref;

    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    const streams = [];

    $('.streams a').each((i, el) => {
        const streamName = $(el).text().trim() || `Stream ${i + 1}`;
        const streamUrl = $(el).attr('href');

        if (streamUrl) {
            streams.push({
                title: `Stream from ${streamName}`,
                url: streamUrl
            });
        }
    });

    return { streams };
});

module.exports = builder.getInterface();

const { addonBuilder } = require('stremio-addon-sdk');
const axios = require('axios');
const cheerio = require('cheerio');

const manifest = {
    id: 'org.totalsportek.football',
    version: '1.0.0',
    name: 'TotalSportek Football Addon',
    description: 'Football streams with multiple links per match from TotalSportek',
    types: ['tv'],
    catalogs: [{ type: 'tv', id: 'totalsportek-football' }],
    resources: ['catalog', 'stream'],
    idPrefixes: ['totalsportek'],
    logo: 'https://totalsportek.to/images/logo.png'
};

const builder = new addonBuilder(manifest);

async function fetchMatches() {
    const res = await axios.get('https://totalsportek.to/');
    const $ = cheerio.load(res.data);

    const matches = [];

    $('div.match-info').each((i, el) => {
        const matchTitle = $(el).find('.event-title').text().trim();
        const matchHref = $(el).find('a').attr('href');

        if (matchTitle && matchHref) {
            matches.push({
                id: 'totalsportek_' + Buffer.from(matchHref).toString('base64'),
                name: matchTitle,
                poster: 'https://i.imgur.com/2W9Xq4R.png',
                type: 'tv'
            });
        }
    });

    return matches;
}

builder.defineCatalogHandler(async ({ type, id }) => {
    if (id !== 'totalsportek-football') return { metas: [] };

    const matches = await fetchMatches();
    return { metas: matches };
});

builder.defineStreamHandler(async ({ type, id }) => {
    if (!id.startsWith('totalsportek_')) return { streams: [] };

    const decodedHref = Buffer.from(id.replace('totalsportek_', ''), 'base64').toString();
    const url = 'https://totalsportek.to' + decodedHref;

    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    const streams = [];

    $('div.livestream a').each((i, el) => {
        const streamTitle = $(el).text().trim() || `Stream ${i + 1}`;
        const streamUrl = $(el).attr('href');

        if (streamUrl) {
            streams.push({
                title: `Stream from ${streamTitle}`,
                url: streamUrl
            });
        }
    });

    return { streams };
});

module.exports = builder.getInterface();

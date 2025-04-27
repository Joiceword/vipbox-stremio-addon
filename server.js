const express = require('express');
const addonInterface = require('./index');

const app = express();
const port = process.env.PORT || 7000;

// 🚨 FIX: Allow Cross-Origin Requests
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// ✅ Serve manifest.json correctly
app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(addonInterface.manifest));
});

// ✅ Serve catalog/stream requests
app.get('/:resource/:type/:id/:extra?.json', (req, res) => {
    addonInterface.get(req).then(resp => {
        if (!resp) {
            res.status(404).send({ error: 'Not found' });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(resp));
        }
    }).catch(err => {
        res.status(500).send({ error: err.message });
    });
});

// ✅ Start the server
app.listen(port, () => {
    console.log(`Addon running at http://localhost:${port}`);
});

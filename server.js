const express = require('express');
const addonInterface = require('./index');

const app = express();
const port = process.env.PORT || 7000;

app.get('/manifest.json', (req, res) => {
    res.send(addonInterface.manifest);
});

app.get('/:resource/:type/:id/:extra?.json', (req, res) => {
    addonInterface.get(req).then(resp => {
        if (!resp) {
            res.status(404).send({ error: 'Not found' });
        } else {
            res.send(resp);
        }
    }).catch(err => {
        res.status(500).send({ error: err.message });
    });
});

// ✅ ONLY this — no '0.0.0.0' needed
app.listen(port, () => {
    console.log(`Addon running at http://localhost:${port}`);
});

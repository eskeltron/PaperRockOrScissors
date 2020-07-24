const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config();

app.use(express.static(path.join(process.env.INIT_CWD, 'src', 'routes', 'front-angular')));
app.use(express.static(path.join(process.env.INIT_CWD, 'src', 'socket')));

app.use(require('./routes/routes.js'));


module.exports = app;
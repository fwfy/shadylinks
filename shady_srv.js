require("process").chdir(__dirname)
const express = require('express');
const fs = require('fs');
const futil = require('@fwfy/futil');
const db = new futil.JSONDB("database.json",true,10000);
if(!db.urls) db.urls = {};
const app = express();

let settings = JSON.parse(fs.readFileSync("config.json"));

getRandomArr = function(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function countInArray(array, what) {
    return array.filter(item => item == what).length;
}

genURL = function() {
    let good_url = false;
    let extension,subdomain;
    while(!good_url) {
        extension = [getRandomArr(settings.extensions),getRandomArr(settings.extensions),getRandomArr(settings.extensions),getRandomArr(settings.extensions)];
        subdomain = getRandomArr(settings.subdomains);
        good_url = true;
        settings.extensions.forEach(e => {
            if(countInArray(extension,e) > 1) good_url = false;
        });
        if(db.urls[subdomain] && db.urls[subdomain][extension]) good_url = false;
    }
    extension = extension.join('-');
    return {extension,subdomain,url: `https://${subdomain}.${settings.base_domain}/${extension}`};
}

app.get('/new', (req,res) => {
    console.log(`adding new URL for ${req.query.to}`);
    try {
        if(!req.query.to) {
            res.status(400);
            return res.end("ERROR: no destination");
        } else {
            res.status(200);
            let url = genURL();
            console.log(url);
            if(!db.urls[url.subdomain]) db.urls[url.subdomain] = {};
            if(!req.query.to.indexOf("http") == 0) req.query.to = "https://"+req.query.to;
            db.urls[url.subdomain][url.extension] = req.query.to;
            return res.end(url.url);
        }
    } catch(err) {
        res.status(500);
        res.end(`ERROR: internal error, please retry.\n\nmagic text: ${btoa(err)}`);
        console.log(err);
    }
});

app.get('/index.html', (req,res) => {
    res.end(fs.readFileSync("index.html"));
});

app.get('/style.css', (req,res) => res.end(fs.readFileSync("style.css")));

app.get('/', (req,res) => {
    res.redirect("/index.html");
});

app.get('*', (req,res) => {
    let redir = false;
    try {
        redir = db.urls[req.hostname.split('.')[0]][req.url.substring(1)] || false;
    } catch(err) {
        redir = false;
    }
    if(redir) {
        res.status(200);
        res.contentType('html');
        res.end(`<meta http-equiv="refresh" content="0;URL='${redir}'"/><h6>Redirecting...<br><a href="${redir}">If you are not automatically redirected, click here.</a></h6>`);
    } else {
        res.status(404);
        res.end("404 Not Found");
    }
});

app.listen(3000);

const rp = require('request-promise');
const cheerio = require('cheerio');
const http = require('http');
const httpAgent = new http.Agent();
      httpAgent.maxSockets = 10;

exports.rl_request = function( url, data, nosocks ) {
    return new Promise((res, rej) => {
        const options = {
            uri: url,
            pool: httpAgent,
            data: data,
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
                'Accept-Encoding': 'none',
                'Accept-Language': 'en-US,en;q=0.8',
                'Connection': 'keep-alive'
            },
            resolveWithFullResponse: true,
            transform: function (body) {
                return cheerio.load(body);
            }
        };

        rp(options)
            .then(function ($) {
               res($)

            })
            .catch(function (err) {
                rej(err)
            });

    })

};

const log = console.log;

//==================================================================
const req = require('./modules/rl-req/rl-request').rl_request;
const base_path = 'DATABASE/BOATS/'; //SCIEZKA ZAPISU
let body_links = require("./DATABASE/BOATS/1.json"); //[1,2,3,4,5]
//==================================================================

const saveJSON = require('write-json-file');
time = new Date();

base = 'START_LINKS';
let log4js = require('log4js');
log4js.configure({
    appenders:
        { error: { type: 'file', filename: 'DATABASE/BOATS/'+date_to_save(time)+'/error.log' }},
    categories: {default: { appenders: ['error'], level: 'error' }}

});
let logger = log4js.getLogger('error');

let db = [];
let promis = [];

page_main_url = 'https://uk.boats.com';  //HTTPS PELNA NAZWA STRONY
no = 0;
probably_results = 0;
detail_link = 'uk.boats.com';  //KROTKA NAZWA BEZ HTTPS
let errors = 0;
let SOCKETS = 1;

module.exports = {
    scrap:function (callback) {
        _start(callback)
    },
    errors: [],
    result: []
};

function _start(callback) {

    log('---------------------------------------');
    log('-----          INIT DATA          -----');
    log('---------------------------------------');

    body_links.map((el) => {

        promis.push(req(el.url + '0', el, SOCKETS)
            .then(($) => {
                let start_index_url = el.url;
                let selector = $('#search-results > header > div > div > strong');
                let last_index_url = el.url + Math.ceil(((selector.text().split(' ')[0]) - 1) / 16); // SELEKTOR DO OSTATNIEJ STRONY
                let last_index = 1 // Math.ceil(((selector.text().split(' ')[0]) - 1) / 16); //SELEKTOR NUMERU OSTATNIEJ STRONY
                let model = el.modele;
                let etat = el.etat;
                let category = el.category;


                console.log('start_index_url: ' + start_index_url);
                console.log('last_index_url: ' + last_index_url);
                console.log('last_index: ' + last_index);
                console.log('model: ' + model);
                console.log('etat: ' + etat);
                console.log('category: ' + category);


                let results = {
                    start_index_url: start_index_url,
                    last_index_url: last_index_url,
                    last_index: last_index,
                    model: model,
                    etat: etat,
                    category: category
                };

                no++;
                probably_results += last_index * 16;

                db.push(results);

                return 1
            })
            .catch(err => {
                if (err.name) {
                    logger.error(err.name + ' -START-');
                }
                if (err.message) {
                    logger.error(err.message);
                }
                else {
                    logger.fatal('Fatality Error')
                }
            })
        )
    });

    let promis_Main = [];

    Promise.all(promis).then(function () {

        delete (promis);

        saveJSON(base_path + date_to_save(time) + '/' + base + '-' + date_to_save(time) + '.json', db).then(() => {
            console.log('SAVE :' + db.length + ' start links');
            log(' ');

        });


        console.log(no + ' - links  / minimum ' + probably_results + ' results');
        log(' ');
        log('Time: ' + (((new Date().getTime() - time) / 1000)).toFixed() + ' s');
        log('---------------------------------------');
        log('-----        GET MAIN LINKS       -----');
        log('---------------------------------------');
        log('Wait for 5-10 minutes to start and next 10 to end');

        let start_links = db;

        let base2 = 'BODY_LINKS';
        let db_body = [];

        for (let i in start_links) {
            let el = start_links[i];

            for (let r = 0; r <= (el.last_index); r += 1) {
                let _result = r;
                if (_result > el.last_index) {
                    _result = el.last_index
                }

                const link = (el.start_index_url + _result);
                // log(link);

                promis_Main.push(req(link, el, SOCKETS)
                    .then(($) => {
                        let links = $('.container'); //SELEKTOR LINKOW //.boat-listings
                        links.each(function () {
                            let short_url = $(this).find('a').attr('href');
                            let full_url = 'http://' + detail_link + short_url;
                            let photo2 = $('body').find('.img-container').find('img').attr('src');

                            db_body.push(
                                {
                                    id: full_url.replace(new RegExp("/", "g"), "-"),
                                    Url_of_the_advert: full_url,
                                    Marque: el.model,
                                    Modele: '',
                                    Annee: $(this).find('.year').text(),
                                    Etat: el.etat,
                                    Visible: 'unknown',
                                    Images_annonce: photo2,
                                    Type_de_vendeur: 'typique',
                                    Prix: ' ',
                                    Prix_Tax: "ttc",
                                    Country: ' ',
                                    Page: page_main_url,
                                    Date: new Date().toLocaleDateString(),
                                    Category: el.category
                                }
                            )
                        })

                    })
                    .catch(err => {
                        errors++;
                        if (err.name) {
                            logger.error(err.name + ' -FIRST BLOOD-');
                        }
                        if (err.message) {
                            logger.error(err.message);
                        }
                        if (err.options) {
                            if(err.options.data) {
                                logger.error(err.options.data.Url_of_the_advert + '\n========================================\n');
                            }else{
                                logger.error(err.options)
                            }
                        }else{
                            logger.fatal(' Fatality Error' + '\n=========================================\n')
                        }
                    })
                )
            }

        }

        let promis_body = [];

        Promise.all(promis_Main).then(function () {

            delete promis_Main;

            log('Time: ' + (((new Date().getTime() - time) / 1000)).toFixed() + ' sec');
            log('---------------------------------------');
            log('-----       START MAIN DATA       -----');
            log('---------------------------------------');

            let data = db_body;
            db_body = [];

            for (let i in data) {
                let url = data[i].Url_of_the_advert;
                let dat = data[i];


                promis_body.push(req(url, dat, SOCKETS)
                    .then(($) => {
                        log('działa?');
                        let model = $('#boat-details > div.collapsible.open > table > tbody > tr:nth-child(2) > td').text(); //SELEKTOR MODELU
                        let country = $('#seller-map-view').text(); //SELEKTOR KRAJU
                        let price = $('body > div.boatscom.en-gb > main > div > div.main-col > div > section > header > div > div.row > .price').text().replace(/[^0-9.]/g, ''); //SELEKTOR CENY
                        let photo = $('#detail-carousel > div.carousel > ul').html().split('data-src_w0="')[1].split('"')[0];
                        let wymiary = $('#measurements > div.collapsible > table').text();
                        let marka = $('#boat-details > div.collapsible.open > table > tbody > tr:nth-child(1) > td').text(); //SELEKTOR MARKI
                        let desc = $('.boat-description').text().replace(/\t\n/, ' ').trim();
                        let engine_l = $('#propulsion > div.collapsible > table > tbody > tr > th');
                        lewe = [];
                        try{
                            for(i in engine_l){
                                lewe.push(engine_l[i].children[0].data)
                            }
                        }catch{log('error')}

                        let engine_p = $('#propulsion > div.collapsible > table > tbody > tr > td');
                        prawe = [];
                        try{
                            for(j in engine_p){
                                prawe.push(engine_p[j].children[0].data)
                                //log(prawe)
                            }
                        }catch{log('error prawe')}

                        engine = {};
                        for(k=0; k<lewe.length; k++){
                            engine[lewe[k]] = prawe[k]
                        }
                        log('a tutaj?');
                        //<---------SELECTORS ABOUT DATA COMPANY----------->

                        let company = $('body > div.boatscom.en-gb > main > div > div.main-col > div > section > div:nth-child(3) > div > div:nth-child(1) > div.contact-info > div > h3').text().trim(); //SELEKTOR FIRMY
                        let as1 = $('body > div.boatscom.en-gb > main > div > div.main-col > div > section > div:nth-child(3) > div > div:nth-child(1) > div.contact-info > div > div:nth-child(2)').text().replace(/\t\n/, '').replace('\n', '');  //SELEKTOR ADRESU
                        let as2 = $('body > div.boatscom.en-gb > main > div > div.main-col > div > section > div:nth-child(3) > div > div:nth-child(1) > div.contact-info > div > div:nth-child(3)').text().replace(/\t\n/, '').replace('\n', '');
                        let as3 = $('body > div.boatscom.en-gb > main > div > div.main-col > div > section > div:nth-child(3) > div > div:nth-child(1) > div.contact-info > div > div.city').text().replace(/\t\n/, '').replace('\n', '');
                        let address = as1 + ' ' + as2 + ' ' + as3;
                        address = address.trim();

                        db_body.push(
                            {

                                Url_of_the_advert: url,
                                Marque: marka,
                                Modele: correct_model(model).replace(marka, ''),
                                Annee: dat.Annee,
                                Etat: dat.Etat,
                                Images_annonce: photo,
                                Type_de_vendeur: 'Professionnel',
                                Prix: price * 1,
                                Currency: "£",
                                Prix_Tax: dat.Prix_Tax,
                                Long: correct_dl(wymiary),
                                Large: correct_szer(wymiary),
                                Fond: correct_gleb(wymiary),
                                Country: country,
                                Page: 'Boats',
                                Phone: dat.Phone,
                                Date: dat.Date,
                                Category: dat.category,
                                Engine: engine,
                                Description: desc,
                                Company: company,
                                Address: address,
                                Logo: 'https://idboats-market.com/market/logos/9%20boats%20com.png'
                            });

                        console.log(db_body.length + ' : ' + url);

                    })
                    .catch(err => {
                        errors++;
                        if (err.name) {
                            logger.error(err.name + ' -SECOND HAND-');
                        }
                        if (err.message) {
                            logger.error(err.message);
                        }
                        if (err.options) {
                            if(err.options.data) {
                                logger.error(err.options.data.Url_of_the_advert + '\n========================================\n');
                            }else{
                                logger.error(err.options)
                            }
                        }else{
                            logger.fatal(' Fatality Error' + '\n=========================================\n')
                        }
                    })
                )

            }

            log('Waiting.... for ~ 60 min');

            let all_data = 0;

            Promise.all(promis_body).then(() => {
                saveJSON(base_path + date_to_save(time) + '/' + base2 + '-' + date_to_save(time) + '.json', db_body).then(() => {
                    console.log('SAVE ALL: ' + db_body.length);
                    if (errors * 10 < db_body.length) {
                        module.exports.result = db_body;
                    }
                    else {
                        module.exports.result = [];
                        module.exports.errors = errors;
                    }
                    callback();
                })
                    .catch(err => {
                        if (err.name) {
                            logger.error(err.name + ' -FINISHER-');
                        }
                        if (err.message) {
                            logger.error(err.message);
                        }
                        else {
                            logger.fatal('Fatality Error');
                        }


                    });

                let data = db_body;

                log(' ');

                for (let i in data) {
                    all_data++
                }

                log('All result  after Update ' + all_data);
                log('Time: ' + (((new Date().getTime() - time) / 1000)).toFixed() + ' sec    ' + (((new Date().getTime() - time) / 1000) / 60).toFixed() + ' min');

                log(' ');
                log('END ALL SCRIPTS YOUR DATA IS READY :)')

            })

        });
    });
}

_start(()=>{});

function date_to_save(time)
{
    return new Date().toLocaleDateString() + "-Time-" + minute_to_save(time);
}

function minute_to_save(time)
{
    return  time.getHours() + "_" + time.getMinutes();
}

function correct_model(mod){
    let result;
    if( mod*1 < 2050 && mod*1 > 1700 && mod.length == 4 ){
        if ( mod.split(' ')[1] ){
            result = mod.split(' ')[1]
        }else{
            result = 'nc'
        }
    }else{
        result = mod
    }
    return result
}

function correct_dl(wymiar){
    let result;
    if(wymiar.search('LOA') >= 0 ){
        result = wymiar.split('LOA')[1].split('/')[1].trim().split('m')[0].replace(/[^0-9.]/g, '').trim()*1;
    }else{
        result = 0;
    }
    return result;
}

function correct_szer(wymiar){
    let result;
    if(wymiar.search('Beam') >= 0 ){
        result = wymiar.split('Beam')[1].split('/')[1].trim().split('m')[0].replace(/[^0-9.]/g, '').trim()*1;
    }else{
        result = 0;
    }
    return result;
}

function correct_gleb(wymiar){
    let result;
    if(wymiar.search('Draft') >= 0 ){
        result = wymiar.split('Draft')[1].split('/')[1].trim().split('m')[0].replace(/[^0-9.]/g, '').trim()*1;
    }else{
        result = 0;
    }
    return result;
}


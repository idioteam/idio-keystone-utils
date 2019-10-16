/**
 * Created by Mat on 22/07/2016.
 */
var fs = require('fs'),
    path = require('path'),
    runningDir = path.dirname(require.main.filename),
    mainDir = path.join(runningDir,'../../../'),
    c = require('chalk'),
    info = '\t\t//-\tAggiunto da checklistProduzione ' + myTimeStamp(),
    modelli = '../lib/prod-list/modelli';

var env,
    ks,
    routes,
    packageJson = leggiFile('package.json'),
    registri = [],
    reg = function(nome){
        registri.push({
            nome: nome,
            totale:0,
            parziale:0,
            risultati: []
        });
        return registri[ registri.length-1 ];
    },
    padding = '\n\t\t',
    isTest = true,
    idioGit = function(modulo){
        return 'npm install git+ssh://git@gitlab.com/Idioteam/' + modulo + ' --save'
    };

c.enabled = true;

exports = module.exports = function(test, done){

    isTest = test;

    checklistEnv();
    checklistKeystone();
    checklistRoutes();
    checklistTemplate();
    checklistPublic();
    checklistTools();
    //checklistJade();

    var numeroRegistro = 0,
        parziale = 0,
        totale = 0,
        pathRisultato= null;

    var output = c.gray.bold(padding + titolo('Checklist Produzione - modalità ' + (isTest ? 'test' : 'run')));

    registri.forEach( function(registro, indice){

        output += c.blue.bold( padding + titolo(++numeroRegistro + ') Checklist ' + registro.nome) );

        registro.risultati.forEach( function(elemento, indice){

            var descrizione = c.gray(padding + numeroRegistro + '.' + ++indice +')', c.gray.bold.underline(elemento.descrizione)),
                risultato = padding +  c[elemento.risultato ? 'green' : 'red'].bold(elemento.risultato ? 'Vero' : 'Falso'),
                azione = elemento.azione ? padding +  (typeof elemento.azione === 'function' ? elemento.azione(elemento.risultato) : elemento.azione) : '';

            output += '\n'+descrizione+risultato+azione+'\n';

        });

        output += '\n\t\t Parziale:\n\t\t===========\n\t\t   ' + c[coloraRisultato(registro.parziale, registro.totale)].bold( registro.parziale + '/' + registro.totale)+'\n\n';
        totale += registro.totale;
        parziale += registro.parziale

    });

    output += '\n\t\t Risultato:\n\t\t===========\n\t\t   ' + c[coloraRisultato(parziale, totale)].bold( parziale + '/' + totale) + '\n\n';

    pathRisultato = path.join(runningDir, '../','logs', ( isTest ? 'test' : 'run') + '-' + myTimeStamp().replace(/[^a-zA-Z0-9]+/g, '-') + '.txt');

    console.log(output + padding + 'Il log è stato salvato in ' + pathRisultato );

    scriviFile( pathRisultato, output.replace(/\[\d*m/g,'').replace(/\x1b/g,''));

    done();

};


function checklistEnv(){

    env = leggiFile( '.env' );

    //	verifico che sia settato NODE_ENV = production
    var prodRe = /^NODE_ENV(?:[\t ])*?=(?:[\t ])*?(production)(?:$|\s)/m;
    valuta(
        'impostazioni file .env',
        'La proprietà \'NODE_ENV\' esiste ed è impostata a \'production\' nel file di configurazione \'.env\'',
        prodRe.exec( env ),
        function(result){

            if( !result ){

                if( !isTest ){

                    return scriviFile( '.env', env + '\nNODE_ENV=production');

                }else{

                    return 'Aggiornare il file .env aggiungendo NODE_ENV=production';

                }

            }else{
                return 'La proprietà NODE_ENV è impostata a \'production\'';
            }
        }
    );

}

function checklistKeystone(){

    var re = /keystone\.init\(\{((.|[\r\n])*?)\}\)/,
        getKeystoneSettings = function(){

            ksFile = ksFile = leggiFile( 'keystone.js');
            ks = re.exec(ksFile)[1];

            ks = rimuoviCommenti(ks);

        };

    getKeystoneSettings();
    /**
     * 	moment.locale('it')
     */
    var ksFile = leggiFile( 'keystone.js'),
        momentRE = /moment\.locale\('it'\)/;
    valuta(
        'configurazione keystone.js',
        'Verifica se moment.locale(\'it\') è settato',
        momentRE.exec(ksFile),
        function(result){

            if(result){

                return 'moment è stato settato per usare il locale \'it\'';

            }else{

                if( !isTest ){

                    var ksModificato = ksFile.replace('var keystone = require(\'keystone\');','var keystone = require(\'keystone\');\nvar moment = require(\'keystone/node_modules/moment\');\n\tmoment.locale(\'it\');' );

                    return scriviFile( 'keystone.js', ksModificato);

                }else{

                    return 'Aggiungere nel file keystone.js dopo la dichiarazione di var keystone:\n' +
                        '\n\t\tvar moment = require(\'keystone/node_modules/moment\');' +
                        '\n\t\tmoment.locale(\'it\');';

                }

            }

        }
    );
    /*
     * 	Porta http
     *
     * */
    var valutaPorta	= function(verbose){
        var porta = init('port');

        if( !porta ){
            return !verbose ? false : 'L\'opzione \'port\' non è impostata';
        }else{

            porta = porta[1].replace(',','').trim();

            if( porta != '3000' ){

                return !verbose ? true : 'L\'opzione \'port\' è impostata a ' + porta;

            }else{

                return !verbose ? false : 'L\'opzione \'port\' è uguale a 3000';

            }

        }
    };
    valuta(
        'configurazione keystone.js',
        'La porta http è impostata su un valore diverso da 3000',
        valutaPorta(),
        function(result){

            return valutaPorta(true);

        }
    );
    /*
     * 	Impostazione SSL
     *
     * */
    var verificaSSL = function(){

        var ssl = init('ssl');

        if( ssl ){

            return verificaFile('ssl key') && verificaFile('ssl cert') && verificaFile('ssl ca') && verificaPorta()

        }else{
            //	SSL non è impostato
            return true;
        }

    };
    var verificaFile = function(chiave, verbose){

        var proprieta = init(chiave);

        if( !proprieta ){
            return !verbose ? null : 'Opzione \'' + chiave + '\' non trovata';
        }

        proprieta = proprieta[1].replace(',','');

        if( leggiFile( eval(proprieta) ) ){

            return !verbose ? true : '';

        }else{

            return !verbose ? false : 'File \'' + eval(proprieta) + '\' non trovato';

        }

    };
    var verificaPorta = function(verbose){

        var proprieta = init('ssl port');

        if( !proprieta ){
            return !verbose ? false : 'Opzione \'ssl port\' non trovata';
        }

        proprieta = proprieta[1].replace(',','').trim();

        if( proprieta !== '443' ){

            return !verbose ? true : '';

        }else{

            return !verbose ? false : 'L\'opzione \'ssl port\' è impostata su 443. Modificarne il valore.';

        }
    };
    valuta(
        'configurazione keystone.js',
        'Verifica delle impostazione SSL',
        verificaSSL(),
        function(result){

            if(!result){

                var controllo = [''];
                controllo.push( verificaFile('ssl key', true) );
                controllo.push( verificaFile('ssl cert', true) );
                controllo.push( verificaFile('ssl ca', true) );
                controllo.push( verificaPorta(true) );

                return 'Le impostazioni SSL sono incomplete' +  controllo.join(padding);

            }else{

                if( init('ssl') ){

                    return 'Le impostazioni SSL sono corrette';

                }else{

                    return 'SSL non è impostato';

                }



            }

        }
    );
    /*
     * 	Opzione Compress
     * 	================
     * 	Attiva compressione gzip
     *
     * */
    ksTest('compress',
        function(result){

            if( ! result ){

                if( !isTest ){

                    getKeystoneSettings();
                    return scriviFile( 'keystone.js', ksFile.replace(ks, ks + '\n\t,\'compress\': true' + info + '\n'))

                }else{

                    return 'Aggiungere l\'opzione compress: true al file keystone.js';

                }

            }else{
                return 'Opzione compress già impostata'
            }

        }
    );
    /*
     * 	Opzione Static Options
     * 	======================
     * 	Attiva la cache per i componenti statici
     *
     * */
    ksTest(
        'static options',
        function(result){

            if( !result ){

                if( !isTest ) {

                    getKeystoneSettings();
                    return scriviFile( 'keystone.js', ksFile.replace(ks, ks + '\n\t,\'static options\': {maxAge: \'10d\'}' + info + '\n'));

                }else{

                    return 'Aggiungere l\'opzione \'static options\': {maxAge: \'10d\'} al file keystone.js';

                }

            }else{
                return 'Opzione static options già impostata';
            }

        }
    );
    /*
     * 	Opzione Sessione Store
     * 	======================
     * 	Salva le sessioni su mongodb
     *
     * */
    ksTest(
        'session store',
        function(result){

            if( !result ){

                if( !isTest ){

                    getKeystoneSettings();
                    return scriviFile( 'keystone.js', ksFile.replace(ks,ks + '\n\t,\'session store\': \'mongo\'' + info + '\n'), 'Installare il modulo connect-mongo -> npm install connect-mongo@0.8.2 --save');

                }else{

                    return 'Aggiungere l\'opzione \'session store\': \'mongo\' al file keystone.js' + padding + 'Installare il modulo connect-mongo -> npm install connect-mongo@0.8.2 --save';

                }


            }else{
                return 'Opzione session store già impostata';
            }

        }
    );
    valuta(
        'configurazione keystone.js',
        'Il modulo \'connect-mongo\' è stato installato nel file \'package.json\'',
        /connect-mongo/.exec(packageJson),
        function(result){

            if( !result ){

                return 'Installare il modulo \'connect-mongo\' ' + padding + 'npm install connect-mongo@0.8.2 --save'

            }else{

                return 'Il modulo \'connect-mongo\' è presente nel file \'package.json\''

            }

        }
    );
    /*
     *	Favicon
     *	=======
     * */
    var favicon = function(){

        var fav = init('favicon');

        if( !fav ){

            return false;

        }else{

            fav = fav[1].replace(',','').replace(/'/g,'').trim();

            var modello = leggiFile(path.join(runningDir, modelli,'favicon.ico')),
                icona = leggiFile( path.join(mainDir,fav) );

            return icona != modello;

        }

    };
    valuta(
        'configurazione keystone.js',
        'La favicon è stata modificata',
        favicon(),
        function(result){

            if( !result ){
                return 'La favicon non è stata modificata. Aggiungere una favicon personalizzata.';
            }else{
                return 'La favicon è stata modiifcata.'
            }

        }
    );
    /*
     * 	Signing logo
     * 	============
     * */
    var signingLogo = function(){

        var logo = init('signin logo'),
            re = /(?:'|")([\w//.\-_]+)(?:'|"),(?:\s*)(\d+),(?:\s*)(\d+)/,
            match;
        //'signin logo': ['/images/logo.png', 208, 68],
        if( !logo ){

            return false;

        }else{

            logo = logo[1];
            match = re.exec(logo);

            return match && match[1] && match[2] && match[2] && leggiFile( path.join(mainDir,'public',match[1]) )

        }


    };
    valuta(
        'configurazione keystone.js',
        'L\'opzione \'signin logo\' è stata impostata',
        signingLogo(),
        function(result){

            if( !result ){
                return 'L\'opzione \'signin logo\' non è impostata, non è impostata correttamente o non esiste l\'immagine referenziata'
            }else{
                return 'L\'opzione \'signin logo\' è impostata correttamente ed esiste l\'immagine referenziata'
            }

        }
    );
    /*
     * 	Aggiornamento email rules
     * 	=========================
     * */
    valuta(
        'configurazione keystone.js',
        'Le \'email rules\' sono state aggiornate',
        ksFile.indexOf('http://www.your-server.com') === -1 && ksFile.indexOf('https://www.your-server.com') === -1,
        function(result){

            if( !result ){

                return 'Le \'email rules\' contengono ancora l\'url di esempio \'http(s)://www.your-server.com\'. Sostituirlo con l\'indirizzo di produzione.'

            }else{

                return 'Le \'email rules\' sono state aggiornate'

            }

        }
    );
}

function checklistTemplate(){

    var	reTitle = /(\s(\t*?)title=.+)/,
        rePrefetch = /(?:href|src)=(?:'|")(https?:\/\/.*?)(?:'|")/g,
        reImg = /\s(img\(.*?(alt='.*?')?\))/g,
        reMetaDescription = /(meta\(name=(?:'|")description(?:'|"),? ?content=(?:'|")?(.*?)(?:'|")?\))/,
        reLang = /[^doctype ](html\(?)(.*?lang(?:[\t ])*?=(?:[\t ])*?('.*?')?)?/,
        domini = ['res.cloudinary.com'],
        estraiDominio = function(str){
            return str.replace(/https?:\/\//, '').split('/').shift();
        },
        templates = fs.readdirSync( path.join('templates','layouts'));		//	Leggo la cartella templates/layouts e per ogni file eseguo i test

    //	Elimino eventuali file non jade
    templates = templates.filter( function(elemento){
        return elemento.indexOf('.pug') !== -1;
    });

    for( var t = 0, len = templates.length; t < len; t++) {

        var currentTemplate = templates[t],
            pathTemplate = path.join( 'templates', 'layouts', currentTemplate ),
            template = leggiFile( pathTemplate );

        /*
         * 	Attributo Lang
         * 	==============
         * */
        var valutaLang = function(template){
            var match = reLang.exec(template);
            return match[3] && match[3].length == 4
        }.bind(null, template);
        valuta(
            'template ' + currentTemplate,
            'L\'attributo lang sul tag html è stato impostato',
            valutaLang(),

            function(currentTemplate, pathTemplate, result){

                var template = leggiFile( pathTemplate );
                var match = reLang.exec(template);

                if( !result ){

                    if( !isTest ){

                        var lang ='';

                        // c'è l'attributo, ma è sbagliato
                        if( match[3] ){

                            lang = match[0].replace( match[3],'\'it\'');

                        }else {

                            //	il tag html ha già attributi
                            if (match[1].indexOf('(') !== -1) {
                                lang = match[0] + 'lang=\'it\' ';
                            } else {
                                //	il tag html non ha attributi
                                lang = match[0] + '(lang=\'it\')';
                            }
                        }

                        return scriviFile( pathTemplate, template.replace(reLang, lang));

                    }else{

                        return 'L\'attributo lang non è impostato';

                    }

                }else{

                    return 'L\'attributo lang è stato impostato a ' + match[3];

                }

            }.bind(null, currentTemplate, pathTemplate)
        );
        /*
         * 	Titolo della pagina
         * 	===================
         * */
        var valutaTitolo = function(template){
            return reTitle.exec(template)
        }.bind(null, template);

        valuta(
            'template ' + currentTemplate,
            'Il tag title esiste nell\'head del template',
            valutaTitolo(),
            function (result) {

                if (!result) {
                    return 'Il tag title non esiste';
                } else {
                    return 'Il tag title esiste. Il suo contenuto deve essere tra i 10 ed i 70 caratteri inclusi gli spazi';
                }

            }
        );

        /*
         * 	Esiste meta description
         * 	=======================
         * */
        var valutaMetaDescription = function (template) {

            var match = reMetaDescription.exec(template);

            if (match === null) {
                return false;
            } else {

                if (match[2] === null) {
                    return false;
                } else {
                    return match[2].length >= 70 && match[2].length <= 160;
                }

            }

        }.bind(null, template);
        valuta(
            'template ' + currentTemplate,
            'Il meta tag \'description\' esiste nell\'head del template',
            valutaMetaDescription(),
            function (currentTemplate, pathTemplate, result) {

                var template = leggiFile( pathTemplate),
                    match = reMetaDescription.exec(template);

                if (!result) {

                    if (reMetaDescription.exec(template)) {


                        return 'Il meta tag description esiste ma il suo contenuto non è compreso tra 70 e 160 caratteri spazi inclusi' + padding + 'Meta tag description: ' + padding + match[1];

                    } else {

                        if( !isTest ){

                            var meta = '//-	Meta description aggiunto ' + info + '\n' +
                                '$2meta(name=\'description\', content=\'\')';
                            return scriviFile( pathTemplate, template.replace(reTitle, '$1' + '\n$2' + meta + '\n'));

                        }else{

                            return  'Aggiungere il meta tag description meta(name=\'description\', content=\'\')' + padding + 'Il valore della proprietà content deve essere compreso tra 70 e 160 caratteri spazi inclusi'

                        }

                    }

                } else {

                    return 'Il meta tag description esiste ed il suo contenuto è compreso tra 70 e 160 caratteri spazi inclusi' + padding + 'Meta tag description: ' + padding + match[1];

                }

            }.bind(null, currentTemplate, pathTemplate)
        );

        /*
         * 	Utilizzo di dns-prefetch
         * 	========================
         * */
        template = execRE(rePrefetch, template, function (match, str) {

            var dominio = estraiDominio(match[1]);

            if (domini.indexOf(dominio) == -1) {
                domini.push(dominio);
            }

        });

        var valutaDnsPrefetch = function(template) {

            return /rel=(?:'|")dns-prefetch(?:'|")/.exec(template) !== null;

        }.bind(null, template);

        valuta(
            'template ' + currentTemplate,
            'Viene utilizzato il prefetching dei dns per le richieste cross-domain',
            valutaDnsPrefetch(),
            function (currentTemplate, pathTemplate, result) {

                if (!result) {

                    if( !isTest ) {

                        var template = leggiFile(pathTemplate),
                            dnslinks = '//-	dns-prefetch generati automaticamente ' + info + '\n';
                        domini.forEach(function (elemento) {
                            dnslinks += '$2link(rel=\'dns-prefetch\' href=\'//' + elemento + '\')\n'
                        });

                        return scriviFile(pathTemplate, template.replace(reTitle, '$1' + '\n$2' + dnslinks));

                    }else{

                        return 'Aggiungere i link dns-prefetch per ciascuna richiesta cross-domain link(rel=\'dns-prefetch\' href=\'\')' + padding + 'Il valore dell\'attributo href deve essere impostato al dominio richiamato dalla richiesta cross-domain.' + padding + 'Consiglio: utilizzare la forma protocol-less //res.cloudinary.com piuttosto che http://res.cloudinary.com';
                    }

                } else {

                    return 'dns-prefetch trovati nel template';

                }
            }.bind(null, currentTemplate, pathTemplate)
        );


        //	Attributi alt delle immagini
        template = execRE(reImg, template, function (match, str) {

            if (!match[2]) {
                return str.replace(match[1], match[1].replace(')', ' alt=\'\')'));
            }

        });

        /*
         * 	Presenza di Google Analytics
         * 	============================
         * */

        var reGA = /ga\('create', 'UA-\d{7}-\d{2}', 'auto'\);/;
        valuta(
            'template ' + currentTemplate,
            'È stato inserito il tracciamento con Google Analytics nel template',
            reGA.exec(template),
            'Crea un account ed inserisci il codice di tracciamento'
        );

        /*
         * 	Minificazione javascript
         * 	========================
         * */

        var valutaMinificazione = function(template){

            //	Controllo che sia installato il modulo idio-comprimi
            var packageInstallato = /"idio-comprimi"/.exec(packageJson),
                reIdioComprimiDev = /\/\/-idiojs:dev((.|[\r\n])*?)\/\/-idiojs:end/.exec(template),
                reIdioComprimiProd = /\/\/-idiojs:prod((.|[\r\n])*?)\/\/-idiojs:end/.exec(template),
                reScript = /[^//|//-]script\((.*)?src=(?:'|")(.*)(?:'|")\)/g,
                nomeScript = 'public/' + ( reIdioComprimiProd ? reScript.exec(reIdioComprimiProd[0])[2] : '');

            return packageInstallato && reIdioComprimiDev && reIdioComprimiProd && leggiFile(nomeScript)

        }.bind(null, template);

        valuta(
            'template ' + currentTemplate,
            'I file javascript vengono minificati',
            valutaMinificazione(),
            function(result){

                if( !result ){

                    return 'I file javascript non vengono minificati. Possibili cause:' + padding +
                        '- Non è stato installato il modulo \'idio-comprimi\'; eseguire ' + idioGit('idio-comprimi') + padding +
                        '- Nel template non è stato creato il blocco //--idiojs:dev o il blocco //-idiojs:prod' + padding +
                        '- Non è stato creato il file minificato';

                }else{

                    return 'I file javascript vengono minificati';

                }

            }
        );

        /*
         * 	Cookie Coffee
         * 	=============
         * */
        var cookieCoffee = function(template){

            var re = /\+ccbanner\((.+)\)/,
                match = re.exec(template);

            if( !match ){

                return false;

            }else{

                return true;
            }


        }.bind( null, template);
        valuta(
            'template ' + currentTemplate,
            'Il template utilizza Cookie Coffee',
            cookieCoffee(),
            function(currentTemplate, pathTemplate, result){

                if( !result ){

                    return 'Il template non utilizza Cookie coffee' + padding + 'Installare il modulo idio-policies ' + idioGit('idio-policies') + padding +
                        'Aggiungere il mixin +ccbanner(id) nel blocco js del layout passandogli l\'id di Cookie Coffee';

                }else{

                    return 'Il template utilizza Cookie coffee';
                }

            }.bind(null, currentTemplate, pathTemplate)
        )
    }
}

function checklistJade(){

    var testJade = leggiFile( path.join('templates','views','gallery.pug')),
        reImg = /img(\(.*?\))/g,
        result;

    result = execRE(reImg, testJade, function(match, str){

        if( match[1] ){

            return str.replace( match[1], match[1].replace(')', ' alt=\'\')'));

        }

    });


}

function checklistRoutes(){

    routes = leggiFile( path.join('routes','index.js') );

    var reModulo = /require\((?:'|")keystone-express-sitemap(?:'|")\)/,
        reSitemap = /app.get\((?:'|")\/sitemap\.xml(?:'|")/,
        reRoutes = /app\.(?:get|all|post)\((?:'|")(\/.*?)(?:'|")/g,
        reBloccoRoutes = /exports(?:\s)*?=(?:\s)*?module\.exports(?:\s)*?=(?:\s)*?function\(app\)(?:\s)*?\{((.|[\r\n])*?)\};/g,
        reFineCommenti = /(\*\/)/,
        reExports = /exports = module.exports/,
        re404 = /keystone\.set\('404'/;

    /*
     * 	Pagine di errore 404
     * 	====================
     * */
    valuta(
        'routes',
        'Per gli errori 404 viene fornita una pagina di errore personalizzata',
        re404.exec(routes),
        function(result){

            if( !result ){

                if( !isTest ) {

                    var modelloMiddleware = leggiFile(path.join(runningDir, modelli, 'custom404-middleware.txt')),
                        middleware = leggiFile(path.join('routes', 'middleware.js')),
                        modelloRoute = leggiFile(path.join(runningDir, modelli, 'custom404-route.txt'));

                    //	Se necessario aggiorno il file routes/middleware.js
                    if (/res\.status\(404\)\.render\('errors\/404'/.exec(middleware) == null) {
                        scriviFile(path.join('routes', 'middleware.js'), middleware + '\n' + modelloMiddleware);
                    }

                    //	Aggiorno la view
                    var view404 = leggiFile( path.join('templates','views','errors','404.pug') );
                    view404 = view404.replace('404', '404 - Pagina non trovata').replace('Sorry, the page you requested can\'t be found.','La pagina non &egrave; stata trovata.<br/>Torna alla <a href="/">home page</a><br/>&nbsp;')
                    scriviFile( path.join('templates','views','errors','404.pug'), view404 );

                    // Aggiorno il file routes/index.js
                    var match = /exports = module.exports/.exec(routes);
                    return scriviFile(path.join('routes','index.js'), routes.replace(match[0], modelloRoute + '\n' + match[0]) );

                }
                else{

                    return 'Non esiste una pagina di errore personalizzata per gli errori 404';

                }

            }else{

                return 'La pagina personalizzata per gli errori 404 è stata creata';

            }

        }
    );
    /*
     * 	Sitemap.xml
     * 	===========
     * */
    valuta(
        'routes',
        'Il modulo \'keystone-express-sitemap\' è stato installato nel file \'package.json\'',
        /keystone-express-sitemap/.exec(packageJson),
        function(result){

            if ( !result ) {

                return 'Installare il modulo \'keystone-express-sitemap\' ' + padding + 'npm install keystone-express-sitemap --save'

            } else {

                return 'Il modulo \'keystone-express-sitemap\' è presente nel file package.json'

            }

        }
    );
    valuta(
        'routes',
        'Il modulo \'keystone-express-sitemap\' è impostato nel file \'routes/index.js\'',
        reModulo.exec(routes) !== null,
        function(result){
            if( !result ){

                if( !isTest ){

                    routes = leggiFile( path.join('routes','index.js') );

                    var match = reExports.exec(routes);
                    return scriviFile(path.join('routes','index.js'),routes.replace( match[0], 'var sitemap = require(\'keystone-express-sitemap\');\n\n' + match[0]) );

                }else{

                    return 'Aggiungere ' + padding + 'var sitemap = require(\'keystone-express-sitemap\');' + padding + 'come variabile globale del file \'routes/index.js\'';

                }

            }else{

                return 'Il modulo \'keystone-express-sitemap\' è impostato nel file \'routes/index.js\'';
            }
        }
    );
    valuta(
        'routes',
        'La route per la generazione della sitemap xml è stata definita nel file \'routes/index.js\'',
        reSitemap.exec(routes) !== null,
        function( result ){

            if( !result ){

                var modello = leggiFile( path.join(runningDir, modelli,'sitemap.txt'));

                if( !isTest ){

                    routes = leggiFile( path.join('routes','index.js') );

                    reBloccoRoutes.lastIndex = 0;
                    var match = reBloccoRoutes.exec(routes);

                    return scriviFile(path.join('routes','index.js'),routes.replace( match[1], match[1] + modello) );
                    //
                }else{

                    return 'Aggiungere la route per la sitemap.xml nel file \'routes/index.js\' dopo tutte le altre routes; esempio: \n' + padding + modello.replace(/\n/g, padding);

                }

            }else{
                return 'Route sitemap.xml definita correttamente nel file \'routes/index.js\'';
            }
        }
        //'Crea la route per /sitemap.xml in get'
    );


    /*
     * 	Caratteri underscore nei nomi delle routes
     * 	==========================================
     * */
    var risultati = 0;
    var elencoRoutesUnderscore = [];
    execRE( reRoutes, routes, function(match, str){
        risultati += ( match[1].indexOf('_') == -1 ? 0 : 1);
        if( match[1].indexOf('_') !== -1 ){
            elencoRoutesUnderscore.push( '\'' + match[1] + '\'' )
        }
    });

    valuta(
        'routes',
        'Le routes definite in \'routes/index.js\' non utilizzano il carattere underscore',
        risultati == 0,
        function(result){

            if( !result ){

                var txt = '';
                elencoRoutesUnderscore.forEach( function(elemento){
                    txt += ( txt.length ? padding : '') + 'Rinominare la route ' + elemento + ' in ' + elemento.replace(/_/g, '-') + ' sia in \'routes/index.js\' che nelle views che la utilizzano'
                });
                return txt;

            }else{

                return 'Non sono stati trovati nomi delle routes contenenti underscore';

            }

        }

    );
    /*
     * 	Privacy policy
     * 	=============
     * */
    var reImporta = /importRoutes\('\.\/policies'\)/,
        reImportedRoutes = /var routes(?:\s)*?=(?:\s)*?\{((.|[\r\n])*?)\}/;
    var trovaRoute = function( route ){

        var rePolicy = /^(\s)+require\('idio-keystone-utils'\)\.policy\(app/m;
        var match = rePolicy.exec(routes);
        return match;

        /*
         reBloccoRoutes.lastIndex = 0;
         var elencoRoutes = reBloccoRoutes.exec(routes),
         re = new RegExp('\'\/' + route + '\'');

         if( elencoRoutes ){

         return re.exec(elencoRoutes[1]);

         }else{

         return null;
         }
         */

    };
    var verificaImport = function(){

        var imports = reImportedRoutes.exec(routes),
            modelloImport = leggiFile( path.join(runningDir, modelli, 'policies-include.txt'));

        if( !imports ){

            return 'Errore';

        }else{

            if( imports[1].indexOf('importRoutes(\'./policies\')') == -1 ){

                routes = routes.replace( imports[1], imports[1] + modelloImport );

            }

            return null;
        }

    };
    valuta(
        'routes',
        'Viene utilizzato il metodo policy del modulo idio-keystone-utils per la gestione della privacy policy e della cookie policy',
        trovaRoute('privacy-policy'),
        function(result){

            if( !result ){

                /*
                 if( !isTest ){

                 routes = leggiFile( path.join('routes','index.js') );
                 var modelloRoutes = leggiFile( path.join(runningDir, modelli, 'policies-routes.txt')),
                 skipImport = verificaImport();

                 if( skipImport){
                 return skipImport;
                 }

                 reBloccoRoutes.lastIndex = 0;
                 var match = reBloccoRoutes.exec(routes);
                 modelloRoutes = modelloRoutes.split('\n');

                 routes = safeReplace(routes, match[1], match[1] + '\n\t//Route Privacy policy\n\t' + modelloRoutes[0].replace(/\n/g,'\n\t') +'\n')
                 return scriviFile(path.join('routes','index.js'), routes );

                 //	devo aggiungere require('idio-keystone-utils').policy(app) a routes/index.js

                 }else{
                 */
                //return 'La route per la Privacy policy non  esiste.' + padding +'Eseguire ' + idioGit('idio-policies')
                return 'Aggiungere il metodo require(\'idio-keystone-utils\').policy(app); nel file routes\\index.js.';

                //    }

            }else{

                return 'Il metodo require(\'idio-keystone-utils\').policy(app); è presente in routes\\index.js.'

            }

        }
    );
    /*
     * 	 Cookie policy - disabilitata perchè viene testato sopra
     *   ==============
     * */
/*
    valuta(
        'routes',
        'La route per la Cookie policy è stata creata',
        trovaRoute('cookie-policy'),
        function(result){

            if( !result ){

                if( !isTest  ){

                    routes = leggiFile( path.join('routes','index.js') );

                    var modelloRoutes = leggiFile( path.join(runningDir, modelli, 'policies-routes.txt')),
                        skipImport = verificaImport();

                    if( skipImport ){
                        return skipImport;
                    }

                    reBloccoRoutes.lastIndex = 0;
                    var match = reBloccoRoutes.exec(routes);
                    modelloRoutes = modelloRoutes.split('\n');

                    routes = safeReplace(routes, match[1], match[1] + '\n\t//Route Cookie policy\n\t' + modelloRoutes[1].replace(/\n/g,'\n\t') +'\n')
                    return scriviFile(path.join('routes','index.js'), routes );

                }else{

                    return 'La route per la Cookie policy non esiste.' + padding + 'Eseguire ' + idioGit('idio-policies')

                }

            }else{

                return 'La route per la Cookie policy esiste.'

            }

        }
    )
*/
}

function safeReplace(testoDaModificare,match, sostituzione){

    sostituzione = sostituzione.replace(/\$/g,'qwerty');
    testoDaModificare = testoDaModificare.replace( match, sostituzione );
    return testoDaModificare.replace(/qwerty/g,'$')

}
function checklistPublic(){

    var robots = leggiFile( path.join('public','robots.txt') );
    valuta(
        'robots.txt',
        'Il file \'robots.txt\' esiste nella cartella \'public\'',
        robots,
        function(result){

            if( !result ){

                var modello = leggiFile(path.join(runningDir, modelli, 'robots.txt'));

                if( !isTest ) {

                    return scriviFile(path.join('public', 'robots.txt'), modello)

                }else{

                    return 'Aggiungere il file robots.txt nella cartella public; esempio:\n' + padding + modello.replace(/\n/g, padding);

                }

            }else{
                return 'Il file public/robots.txt esiste';
            }

        }
    )

}

function checklistTools(){

    //	Verifica che siano stati aggiunti i file di verifica per Google Webmaster Tool e per Bing Webmaster Tool
    var GWT = leggiFile('public/google0425f7653a9fa804.html'),
        BWT = leggiFile('public/BingSiteAuth.xml');

    valuta(
        'tools',
        'Il file di verifica di Google Webmaster Tools esiste nella cartella \'public\'',
        GWT,
        function(result){

            if( !result ){

                return 'Registrare il sito su Google Webmaster Tools https://www.google.com/webmasters/tools/?hl=it'

            }else{

                return 'Il sito è stato verificato da Google Webmaster Tools. Assicurarsi che siano state eseguite le operazioni necessarie'

            }

        }
    );

    valuta(
        'tools',
        'Il file di verifica di Bing Webmaster Tools esiste nella cartella \'public\'',
        BWT,
        function(result){

            if( !result ){

                return 'Registrare il sito su Bing Webmaster Tools https://www.bing.com/toolbox/webmaster'

            }else{

                return 'Il sito è stato verificato da Bing Webmaster Tools. Assicurarsi che siano state eseguite le operazioni necessarie'

            }

        }
    )

}

function execRE( regexp, str, callback ){

    var match;

    while ((match = regexp.exec(str)) !== null) {

        if (match.index === regexp.lastIndex) {
            regexp.lastIndex++;
        }

        str = callback.apply(null, [match, str]) || str;

    }

    return str;
}

function ksTest( chiave, azione ){

    //var desc = 'In keystone.init viene utilizzata l\'opzione ' + chiave;
    var desc = 'L\'opzione \'' + chiave + '\' è correttamente settata nel file \'keystone.js\'';
    valuta(
        'configurazione keystone.js',
        desc,
        init(chiave),
        azione
    )

}

function init(chiave){

    var r = new RegExp('(?:\'|")' + chiave + '(?:\'|")(?:\\s)*?:(?:\\s)*?(.*)(,)?');
    return r.exec( ks );

}

function valuta(nome, descrizione, condizione, azione){

    var registro;

    //	Cerco il registro
    registri.forEach( function(elemento){
        if(elemento.nome == nome ){
            registro = elemento;
        }
    });

    //	Se non lo trovo, lo creo.
    if( !registro ){
        registro = new reg(nome);
    }

    var r = ( condizione ? 1 : 0 );

    registro.totale += 1;
    registro.parziale += r;

    registro.risultati.push({
        descrizione: descrizione,
        risultato: r,
        azione: azione ? azione : ''
    });

}

function leggiFile( percorso ){

    try{
        if( !path.isAbsolute( percorso )){
            percorso = path.join( mainDir, percorso );
        }
        return fs.readFileSync( percorso ).toString();

    }catch(err){

        return null;
    }

}

function scriviFile( percorso, contenuto, altreInfo ){

    try{
        fs.writeFileSync(percorso, contenuto);
        return 'File ' + percorso + ' modificato' + (altreInfo ? '\t'+altreInfo : '');
    }catch(err){
        return 'Errore durante la modifica del file ' + percorso;
    }

}

function rimuoviCommenti(str){

    var commenti = /(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|(\/\/.*)/g,
        matches = null;

    matches = str.match(commenti);

    matches.forEach( function(elemento){

        if( elemento.indexOf('//localhost') === -1 ) {
            str = str.replace(elemento, '');
        }

    });

    return str;
}

function titolo(str){
    str = ' ' + str + ' ';
    var pad = new Array(str.length+1).join('-'); // + padding;
    return pad + padding + str + padding + pad;
}

function coloraRisultato(parziale, totale){

    if( parziale == totale ){
        return 'green';
    }
    if( parziale == 0 || parziale <= totale/3 ){
        return 'red';
    }

    if( parziale >= totale/2+1 ){
        return 'yellow';
    }else{
        return 'magenta';
    }

    return 'yellow';

}

function myTimeStamp(){

    var d = new Date(),
        pad = function(i){
            return i < 10 ? '0' + i : i;
        };

    return pad(d.getDate()) + '/' + pad(d.getMonth()+ 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());

}

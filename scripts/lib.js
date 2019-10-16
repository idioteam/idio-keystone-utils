var fs = require('fs'),
    path = require('path'),
    appPath = path.join(__dirname, '../../../'),
    assetsPath = 'assets'
;

/**
 * installa
 * @param origine
 * @param destinazione
 * ====================
 * Copia un file da origine a destinazione
 */
function installa(origine, destinazione){

    var dest = path.join(appPath, destinazione),
        source = path.join( __dirname, '../', origine );

    //	Verifico che il file non esista
    try{
        //	Il file esiste non faccio nulla.
        fs.readFileSync( dest ).toString();
    }catch(err){
        //	il file non esiste, lo creo
        var task = fs.createWriteStream( dest );
        fs.createReadStream( source ).pipe( task );
    }

}

/**
 * disinstalla
 * @param origine
 * ===============
 * Rimuove il file origine
 */
function disinstalla(origine){

    origine = path.join( appPath, origine );
    //console.log('\telimino file', origine);
    //	Verifico che il file esista
    try{
        //	Il file esiste, lo cancello.
        fs.readFileSync( origine ).toString();
        fs.unlinkSync( origine );
    }catch(err){
        //	Il file esiste non faccio nulla.
    }

}
/**
 * creaCartella
 * @param cartella
 * ===============
 * Verifica se esiste cartella e la crea se non esiste
 */
function creaCartella(cartella){

    cartella = path.join(appPath, cartella);

    try {
        fs.statSync(cartella, function (err, stat) {});
    }catch(er){
        fs.mkdirSync( cartella );
    }

}
/**
 * copiaCartella
 * @param basePath
 * @param cartella
 * ===============
 * Copia ricorsivamente la cartella cartella
 */
function copiaCartella(basePath, cartella){

    var files = fs.readdirSync( path.join( basePath , cartella) );
    // var files = fs.readdirSync( path.join( 'assets/', cartella) );

    files.forEach(function(file){

        if( path.extname(file) === '' ){
            if(file != '.noremove'){
                creaCartella( cartella + path.sep + file);
                // creaCartella( cartella + path.sep + file);
                copiaCartella( basePath, cartella + path.sep + file);
                // copiaCartella( cartella + path.sep + file);
            }
        }else{

            installa( path.join(basePath , cartella , file), path.join(cartella, file));
            // installa( path.join('assets/' , cartella , file), path.join(cartella, file));
        }

    });

}
/**
 * rimuovi
 * @param basePath
 * @param cartella
 * ================
 * rimuove ricorsivamente i file dalla cartella cartella
 * se una cartella contiene il file .noremove non cancella i file della cartella e delle relative sotto cartelle
 */
function rimuovi(basePath, cartella){

    cartella = cartella || '';

    var files = fs.readdirSync( path.join(basePath, cartella) );

    //  se nella cartella esiste il file .noremove la cartella non deve essere cancellata ed esco
    if( files.indexOf('.noremove') !== -1 ){
        return;
    }

    files.forEach(function(file){

        if( path.extname(file) === '' ){

            //console.log("chiamo rimuovi",basePath, cartella +  path.sep  + file);
            rimuovi( basePath, cartella +  path.sep  + file );

        }else{

            disinstalla( cartella +  path.sep  + file);
            // disinstalla(cartella +  path.sep  + file);

        }

    });

    //  provo ad eliminare la cartella
    files = fs.readdirSync( path.join(appPath, cartella) );
    if( files.length == 0){
        removeFolder(path.join(appPath, cartella))
    }
    //console.log('---')
}

function removeFolder(cartella){

    // cartella = path.join(appPath, cartella);
    try {
        fs.rmdirSync( cartella );
    }catch(er){

    }

}
//-----------------------------------------//
//  exports
//-----------------------------------------//

module.exports.appPath = appPath;
module.exports.assetsPath = assetsPath;
module.exports.installa = installa;
module.exports.disinstalla = disinstalla;
module.exports.creaCartella = creaCartella;
module.exports.copiaCartella = copiaCartella;
module.exports.rimuovi = rimuovi;

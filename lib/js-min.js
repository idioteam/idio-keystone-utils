/**
 * Created by Mat on 21/07/2016.
 */
var UglifyJS = require('uglify-js'),
    fs = require('fs'),
    path = require('path'),
    re = {
        blocco: '\/\/[\t -]*?idiojs:dev(.|[\r\n])*?\/\/[\t -]*?idiojs:end',
        script: /[^//|//-]script\((.*)?src=(?:'|")(.*)(?:'|")\)/gi
    };

/*
 * 	Verifica se esiste una cartella
 *   ===============================
 *   @param {string} fldrPath - path cartella da verificare
 *   @param {boolean} creaCartella - se true crea la cartella
 *
 * */
function folderExists( fldrPath, creaCartella ){

    try {
        fs.statSync( fldrPath );
        return true;
    }catch(er){
        if( creaCartella ){
            createFolder( fldrPath );
            //fs.mkdirSync( fldrPath );
        }
        return creaCartella;
    }

}
/*
 * 	Crea una cartella
 * 	=================
 * 	@param {string} percorso - path della cartella da creare
 *
 * */
function createFolder( percorso ){

    var cartella = '';
    percorso = percorso.split( '/' );
    for( var p = 0, len = percorso.length; p < len; p++ ){

        cartella += ( cartella.length == 0 ? '' : '/' ) + percorso[p];

        try{
            fs.mkdirSync( cartella );
        }catch(er){

        }

    }

}
/*
 * 	Ottiene la lista dei file in una cartella
 * 	Funziona ricorsivamente su tutte le sottocartelle
 * 	=================================================
 * 	@param {string} folder - cartella da leggere
 * 	@param {string} [ext] - estensione dei file da recuperare, opzionale
 *
 * */
function getFileList( folder, ext ){
	
	var archivio = [];
	
	var leggiCartella = function(folder, ext){
		
		var f = fs.readdirSync(folder),
			fld = [],
			s = [];

		//	Cartelle
		fld = f.filter( function(file){
			return path.extname(file) === '';
		})
		
		if( ext ){
			
			if( ext.indexOf('.') == -1 ){
				ext = '.' + ext;
			}
			
			//	File con estensione ext
			f = f.filter( function(file){
				return path.extname( file ) === ext;
			});

			//	Aggiungo percorso
			f = f.map(function(file){
				return path.join(folder, file)
			})
			
		}

		if(fld.length > 0){
			//console.log("fld.length",fld.length);
			fld.forEach(function(fl){
				leggiCartella( path.join(folder,fl), ext )
			})
		}

		archivio = archivio.concat(f);
		return archivio
		
	}
	return leggiCartella(folder, ext);
}
/*
function getFileList( folder, ext, archivio){
	
    if( folderExists( folder ) ){

        var f = fs.readdirSync( folder ),
			fld = [],
			s = [];
		
        if( ext ){

            if( ext.indexOf('.') == -1 ){
                ext = '.' + ext;
            }
			
            fld = f.filter( function(file){
            	//return path.extname(file) 
				return path.extname(file) === '';
			})
			
            f = f.filter( function(file){
                return path.extname( file ) === ext;
            });
			
			f = f.map(function(file){
				return path.join(folder, file)
			})

        }
        //console.log("f",f);
		archivio= archivio.concat(f);
		//console.log("archivio",archivio);
		
		
		if(fld.length > 0){
			console.log("fld.length",fld.length);
			fld.forEach(function(fl){
				archivio.concat( getFileList( path.join(folder,fl), ext, archivio ) );
			})
		}
		
        return [].concat(archivio);

    }else{

        //return false;

    }

}
*/
/*
 * 	Minifica i file javascript
 * 	==========================
 * 	@param {Array} listaFiles - lista dei file javascript da minificare
 * 	@param {string} [output='public/js/scripts.min.js'] - percorso del file di output
 *
 * */
function minificaJs( listaFiles, output ){

    if( !output ){
        output = 'public/js/scripts.min.js';
    }

    var result = UglifyJS.minify(listaFiles, {
        mangle: true,
        output: {
            preamble: '// (c) Idioteam\n// ' + new Date()
        },
        compress: {
            sequences: true,
            dead_code: true,
            conditionals: true,
            booleans: true,
            unused: true,
            if_return: true,
            join_vars: true,
            drop_console: true
        }
    });

    //	Verifico che esista la cartella di output e scrivo il file
    try{
        folderExists(path.dirname(output), true);
        fs.writeFileSync(output, result.code);

        logga( 'File "' + output + '" creato correttamente' )

    }catch(er){

        logga( er, true )

    }

}
/*
 * 	Estrae i file javascript referenziati all'interno del blocco js:dev
 * 	===================================================================
 * 	@param {string} file - testo in cui cercare
 *
 * */
function getFileListFromTemplate(file){

    var files = [],
        blocco = new RegExp(re.blocco,'g'),
        src = new RegExp(re.script),
        //src = re.script,
        match = blocco.exec(file),
        m = null;

    //	Questo è necessario perchè la regexp è globale ed alla seconda iterazione rimane settato il lastindex precedente. Vengono quindi persi dei risultati
    //	L'alternativa è localizzare la regexp: src = new RegExp(re.script). In questo caso, siccome costruisco una regexp da un'altra regexp non devo specificare i flag perchè eredita quelli della regexp originale
    src.lastIndex = 0;

    while (( m = src.exec(match[0])) !== null) {

        if (m.index === re.lastIndex) {
            re.lastIndex++;
        }

        files.push( ('public/' + m[2].split('?')[0]).replace('//','/' ) );
    }

    return files;

}
/*
 * 	Estrae il file referenziato all'interno del blocco js:prod
 * 	==========================================================
 * 	@param {string} file - testo in cui cercare
 *
 * */
function getProductionFileName( file ){

    var nome = '',
        blocco = new RegExp( re.blocco.replace(':dev',':prod'),'g'),
        src = re.script,
        match = blocco.exec(file),
        scripts = match ? src.exec(match[0]) : null;

    src.lastIndex = 0;

    if( scripts ){
        return 'public/' + scripts[2];
    }else{
        return 'public/js/scripting.min.js'
    }

}
/*
 * 	Utilità per il log
 * 	==================
 * 	@param {string} msg - testo del log
 * 	@errore {boolean} errore - se true stampa errore altrimenti info
 * */
function logga(msg, errore){

    msg = new Array( msg.length +1).join('-') + '\n' + msg + '\n' + new Array( msg.length +1).join('-') + '\n';
    errore ? console.error( msg ) : console.log( msg )
}
/*
 * 	Registro dei file da minificare
 * 	===============================
 * */
var Registro = function(){

    var reg = [],
        me = this;

    //	Cerca un elemento del registro in base al nome del file
    //	Ritorna l'elemento oppure null se l'elemento non esiste
    this.trova = function(nomeFile){

        var e = null;

        reg.forEach( function(elemento){

            if( elemento.nomeFile == nomeFile ){
                e = elemento;
                return;
            }

        });

        return e;
    };

    //	Elimina gli elementi duplicati da un array
    this.filtra = function( arr ){
        return arr.filter(function(elem, pos) {
            return arr.indexOf(elem) == pos;
        })
    };

    //	Aggiunge dati al registro
    this.add = function(nomeFile, listaFiles){

        var elemento = me.trova(nomeFile);

        if( elemento ){
            elemento.listaFiles = me.filtra( elemento.listaFiles.concat( listaFiles ) );
        }else{
            reg.push({
                nomeFile: nomeFile,
                listaFiles: listaFiles
            })
        }

    };

    this.creaFiles = function(){

        if(reg.length == 0){
            console.log('Non ho trovato nessun file da minificare!');
            console.log('Hai inserito i marcatori "//-idiojs:dev" e "//-idiojs:prod" nel template?')
            return;
        }

        reg.forEach( function(elemento){
            minificaJs(elemento.listaFiles, elemento.nomeFile);
        });

    };

    this.get = function(){
        return reg;
    }
};
/*
 * 	Minifica tutti i file javascript presenti in una cartella
 * 	=========================================================
 * 	@param folder - path della cartella da comprimere
 * 	@param output - path del file compresso da generare
 * */
module.exports.jsFolder = function( folder, output ){

    var files = getFileList( folder, '.js' );

    if( files && files.length ){

        //	Aggiungo il folder all'elenco dei file
        var ff = files.map( function (file) {
            return folder + '/' + file;
        });

        minificaJs( ff, output );

    }else{

        logga( 'Nessun file javascript nella cartella "' + folder + '"\no cartella non esistente', true )

    }


};
/*
 * 	Minifica tutti i file referenziati in un template
 * 	=================================================
 * */
module.exports.js = function(done){

    var file = '',
        files = [],
        layouts = getFileList('templates/layouts','.pug', layouts)
			.concat(getFileList('templates/views','.pug'));

    var registro = new Registro();

    for( var l = 0, len = layouts.length; l < len; l++ ){

        //	Recupero elenco file dal template
        file = fs.readFileSync(layouts[l]).toString();
        var test = new RegExp(re.blocco,'g').exec(file);
        if( new RegExp(re.blocco,'g').exec(file) ) {
            files = getFileListFromTemplate(file, 'dev');

            if (files && files.length) {
                registro.add(getProductionFileName(file), files)
            }
        }
    }

    registro.creaFiles();
    if( done && typeof done === 'function') {
        done()
    }

};


module.exports.js2 = function(){

    var files = [],
        file = '',
        layouts = getFileList('templates/layouts','.pug'),
        fileList = [],
        fileName = '',
        registro = [];

    for( var l = 0, len = layouts.length; l < len; l++ ){

        file = fs.readFileSync('templates/layouts/' + layouts[l]).toString();
        files = getFileListFromTemplate( file, 'dev' );

        if(files && files.length){


            fileList = fileList.concat(files);

            fileName = getProductionFileName(file);

            //	Aggiungo dati nel registro
            if( registro.length == 0){
                registro.push({
                    nomeFile:fileName,
                    elencoFiles: files
                })
            }else{
                //	Cerco registro
                registro.forEach( function(elemento){
                    if( elemento.nomeFile == fileName ){
                        console.log('Trovato')
                    }
                })
            }

            console.log('fileName',fileName);
            //minificaJs(files, getProductionFileName(file))
        }

    }
    //	Filtro elenco file
    console.log('n elementi: ', fileList.length);
    fileList = fileList.filter(function(elem, pos) {
        return fileList.indexOf(elem) == pos;
    });
    console.log('n elementi: ', fileList.length);
    console.log(registro);
    //minificaJs(fileList, fileName)
};

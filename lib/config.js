const keystone = require('keystone');
const path = require('path');

let defaultOptions = {
	'wysiwyg additional options': { force_br_newlines: true, force_p_newlines: false, forced_root_block: false, verify_html: false },
	'wysiwyg additional plugins': 'paste',
	'cloudinary secure': true,
	'cloudinary folders': true,
};

/**
 * Funzione esportata
 * Ritorna il metodo init e la lista dei parametri applicati
 * @param ambiente
 * @returns {{init: (function(this:null)), lista: *, db: {name, port: number, host: (string|string)}}}
 */
function esporta (ambiente = 'developement') {

	let parametri
	try{
		parametri = require( path.join( keystone.get('module root'), 'config', ambiente.toLowerCase() ) );
	}catch(e){
		logErrore(ambiente, `Impossibile caricare il file config/${ambiente}.js`)
	}

	if( parametri.db.name === '' ){
		logErrore(ambiente, `Configurazione per ambiente '${ambiente}' errata o mancante`)
	}

	let db = {
		name: parametri.db.name,
		port: parametri.db.port,
		host: parametri.db.host,
	};

	//	Configurazione di mongo
	parametri.mongo = `mongodb://${parametri.db.host}:${parametri.db.port}/${parametri.db.name}`;
	delete parametri.db;

	//	Opzioni di default
	Object.assign(parametri, defaultOptions);

	//	Session store
	//	Verifico se esiste il modulo connect-mongodb-session
	//	Se esiste configuro la prorietà 'session store'
	try{
		let connectMongoDBSession = require('connect-mongodb-session');
		parametri['session store'] = sessionStore.bind(null, parametri.mongo);
	}catch(e){}

	return {
		init: init.bind(null, parametri),
		lista: parametri,
		db: db,
	};

}
/**
 * Applica la configurazione a keystone
 * @param parametri
 * @param keystone
 */
function init (parametri) {

	for (let parametro in parametri) {

		if (parametri.hasOwnProperty(parametro)) {

			keystone.set(parametro, parametri[parametro]);
		}

	}

}
/**
 * Funzione per lo store delle sessioni
 * @param mongoConnectionString
 * @param session
 * @returns {MongoDBStore}
 */
function sessionStore (mongoConnectionString, session) {

	const MongoDBStore = require('connect-mongodb-session');

	return new (MongoDBStore(session))({
		uri: mongoConnectionString,
		collection: 'app_sessions',
	});
}

function logErrore(ambiente, msg){

	console.log(Array(msg.length+3).join("-") );
	console.log(' ERRORE DI CONFIGURAZIONE');
	console.log(' NODE_ENV=' + ambiente);
	console.log(' ' + msg);
	console.log(Array(msg.length+3).join("-") );

	process.exit();
	
}

module.exports = esporta;

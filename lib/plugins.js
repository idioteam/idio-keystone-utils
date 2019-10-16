/**
 * Created by m.pini on 15/05/2017.
 */
const 	keystone = require('keystone'),
		ksIdioPluginProp = 'idio-plugins',
		path = require('path')
;
let 	plugins;
let 	pluginsProperties = {};
let		listaPlugin = {
	attivi: [],
	inattivi: []
};

module.exports = {
	adminUI: adminUI,
	lista: function () {
		return listaPlugin
	},
	middleware: middleware,
	properties: getPluginProperties,
	registra: registra,
	routes: routes
}

/**
 * Esegue la funzione registra per ogni plugin attivo
 * ordinando i plugin per priorità
 */
function registra(){

	plugins = keystone.import('plugins');
	let sorted = _sortPlugins(plugins);
	
	let cb = function(key, element){

		if( _isElementValid(key, element, 'registra') ){
			Object.assign(pluginsProperties, element.index.registra());
			console.log(`- ${key}`);
		}

	};

	sorted.forEach( plugin => {
		cb(plugin.key, plugins[plugin.key])
	})
	
}

/**
 * Esegue la funzione adminUi per ogni plugin attivo
 * unendo il risultato all'oggetto nav di keystone
 * in modo da visualizzare i menu nella UI dell'amministratore
 * TODO inventarsi qualcosa per gestire l'ordinamento
 */
function adminUI(){

	let navigazione = {};
	let cb = function(key, element){

		if( _isElementValid(key, element, 'adminUI') ){
			Object.assign(navigazione, element.index.adminUI());
		}

	};
	_loopAndCallback.call(plugins, cb);

	let nav = keystone.get('nav') || {};
	keystone.set('nav', keystone.utils.options(nav, navigazione));

}

/**
 * Esegue la funzione middleware per ogni plugin attivo
 */
function middleware(){

	let cb = function(key, element){

		if( _isElementValid(key, element, 'middleware') ){

			element.index.middleware();
		}

	};

	_loopAndCallback.call(plugins, cb);

}

/**
 * Esegue la funzione routes per ogni plugin attivo
 * aggiungendo le routes ad app
 * @param {Object} app - applicazione express
 */
function routes(app){

	let cb = function(key, element){

		if( _isElementValid(key, element, 'routes') ){
			element.index.routes(app, _setPath('routes', key));
		}

	};

	_loopAndCallback.call(plugins, cb);

}

/**
 * Esegue la funzione sitemapIgnore per ogni plugin attivo
 * restituendo un array di routes da escludere dalla sitemap
 * @param ignoreList
 * @returns {Array}
 */
function sitemapIgnore (ignoreList) {
	let defaultsIgnoreList = ignoreList;

	let cb = function (key, element) {

		if (_isElementValid(key, element, 'sitemapIgnore')) {
			defaultsIgnoreList = defaultsIgnoreList.concat(element.index.sitemapIgnore());
		}

	};

	_loopAndCallback.call(plugins, cb);
	return defaultsIgnoreList;
}

//	Proprietà di un plugin
/**
 * Ritorna le proprietà del plugin nomePlugin
 * @param {string} nomePlugin - nome del plugin
 * @returns {Object}
 */
function getPluginProperties(nomePlugin){

	return pluginsProperties[nomePlugin];

}

//		Utils	
//	============

/**
 * Ritorna il path di un plugin all'inteno di folder
 * @param {string} folder
 * @param {string} plugin
 * @return {string}
 */
function _setPath(folder, plugin){
	return path.resolve( path.join(folder, plugin) );
}

/**
 * Verifica che l'elemento passato sia un plugin
 * @param {string} key	- nome del plugin
 * @param {Object} element - elemento da valutare
 * @param {string} [fnName] - Se presente verifica che in element esista la funzione fnName
 * @returns {boolean}
 * @private
 */
function _isElementValid(key, element, fnName){

	let check = true;

	//	Verifico che il plugin non sia disabilitato
	if(element.config && element.config.index){

		if( !_verificaStato(element.config.index) ){
			check = false;
		}

	}
	check = check && key !== 'index' && element.hasOwnProperty('index');

	if(fnName){
		check = check && typeof(element.index[fnName]) === 'function';
	}

	//	Aggiorna lista
	_popolaLista(check, key);

	return check
}

/**
 * Aggiunge il plugin nella lista del plugin attivi o inattivi in base al valore di check
 * @param {boolean} check
 * @param {string} key
 * @private
 */
function _popolaLista(check, key){
	listaPlugin[ check ? 'attivi' : 'inattivi'].push(key);
}

/**
 * Verifica che il plugin sia attivo
 * @param {Object} config
 * @returns {boolean}
 * @private
 */
function _verificaStato(config){
	return (!config.hasOwnProperty('attivo') || config.attivo !== false);
}

/**
 * Ordina i plugin in base alla priorità impostata nella configurazione
 * @param plugins
 * @returns {Array}
 * @private
 */
function _sortPlugins(plugins){

	let sortingArray = [];
	let keys = Object.keys(plugins);
	
	keys.forEach( plugin => {
		sortingArray.push({
			key: plugin,
			priorita: _getPriorita(plugins[plugin])
		})
	})

	sortingArray.sort(function(a, b) {
		return a.priorita - b.priorita;
	});

	return sortingArray;

}

/**
 * Ottiene il valore della proprietà priorità o la imposta se non esiste
 * @param {Object} plugin
 * @returns {number}
 * @private
 */
function _getPriorita(plugin){

	if( !plugin.config || !plugin.config.index || plugin.config.index.priorita === undefined || isNaN(plugin.config.index.priorita)){
		return 9999;
	}
	return 0;
	
}

/** Verifica che il plugin sia valido ed esegue l'azione contenuta
 @name _loopCallbackCB
 @function
 @param {String} key - Nome del plugin
 @param {Object} element - Oggetto plugin
 */
/**
 * Cicla i plugin eseguendo la cb per ognuno di essi
 * @param {_loopCallbackCB} cb
 * @private
 */
function _loopAndCallback(cb){

	for(let k in this){

		if( this.hasOwnProperty(k) ) {

			cb(k, this[k]);

		}
	}

}

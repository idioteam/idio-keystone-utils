/**
 * Created by Mat on 23/12/2016.
 * Basato su keystone-express-sitemap
 * Modificato per risolvere path con parametri multipli (e correlati)
 * TODO: gestire path con date es: blog/2016/12/31/slug-articolo
 * ------------------------------->blog/:_A/:_M/:_G/:slug
 */
var sitemap = require('express-sitemap'),
	async = require('async');

var idioSitemap = function(keystone, req, res){

	var map = {};
// store routes for express-sitemap function route declaration option
	var route = {};
	var dynamicRoutes = [];
	var dateFormatString = 'YYYY-MM-DD';

	var findKeystoneList = function(string) {
		//remove dynamic parameter marker from string
		string = string.replace(':', '').toLowerCase();

		var lists = Object.keys(keystone.lists).map(function(l) {
			return l.toLowerCase();
		});

		var listIndex = lists.indexOf(string);

		if (listIndex >= 0) {
			return keystone.list(Object.keys(keystone.lists)[listIndex]);
		}
		else {
			return null;
		}
	};

	var parseRoutes = function(){

		var routes = keystone.app._router.stack || keystone.app.routes.get;

		if( routes && routes.length > 0) {

			routes.forEach(function (r, i) {
				// express 4.x.x route objects have path property
				// express 3.x.x route objects have route.path property
				var path = r.path ? r.path : (r.route ? r.route.path : null);

				// remove any kestyone admin paths (/keystone/)// remove any kestyone admin paths (/keystone/)
				if (path != null && path.match(/keystone\*{0,1}$|keystone\/|\/\*$|sitemap\.xml/) == null) {
					var ignored = false;

					//check routes against the ignored routes, if applicable
					if (options && options.ignore && Object.prototype.toString.call(options.ignore) === '[object Array]') {
						for (var ig in options.ignore) {
							if (path === options.ignore[ig] || path.match(options.ignore[ig]) !== null) {
								ignored = true;
								break;
							}
						}
						;
					}

					if (ignored) {
						return false;
					}

					// check for dynamic routes (with parameters identified by :[parameter name])
					if (path.indexOf(':') > 0) {
						dynamicRoutes.push(path);
						
						//	casomai ci fossero parametri opzionali
						if(path.indexOf('?') !== -1){
							
							basePath = path.split(/:[a-zA-Z0-9]+\?/)
							
							map[basePath[0]] = ['get'];
							route[basePath[0]] = {};
						}
						
					}
					// route is a static route, add to routes that will be parsed into sitemap
					else {
						map[path] = ['get'];
						route[path] = {};
					}
				}
			});
		}

		// If there are dynamic routes, move to asynchronous function to query database for all routes that would follow that pattern. If not, finish up and generate sitemap.
		if (dynamicRoutes.length > 0) {
			asyncAddListRoutes();
		}
		else {
			createXmlFile();
		}

	}
	
	//-----------------------------------------//
	//-  customizzazione
	//-----------------------------------------//
	/**
	 * Per ciascuna route dinamica vengono analizzati i parametri ed estratti i documenti
	 * coi dati raccolti viene poi creato il path sostituendo i valori ai parametri a partire dall'ultimo parametro
	 */
	var asyncAddListRoutes = function() {
		
		async.map(dynamicRoutes, estraiParametri, function(err, result) {
			
			result.forEach(function(risultato){
				
				if( risultato.parametri[0] !== null ){

					var pathPars = getDynamicPars(risultato.path).reverse();
					//	per ogni route crea i path in base ai documenti estratti
					compilaPath(risultato, pathPars);

				}

			});
			//	output finale
			createXmlFile();
		});
		
	};

	var estraiParametri = function(path, callback){

		//	prende i parametri della route, li splitta e per ognuno ottenere i documenti
		var dynamicPaths = (path.substring(0,1) == '/' ? path.substring(1) : path)
			.split('/')
			.reduce(function(memo,path){
				if(path.indexOf(':') !== -1){
					memo.push(path.replace('?', ''))
				}
				return memo;
			},[]);
		
		
		async.map(dynamicPaths, estraiDocumenti, function(err, risultati){
			callback(err, {path: path, parametri: risultati})
		})

	}

	var estraiDocumenti = function(parametro, cb){

		var lista = findKeystoneList(parametro.replace(':',''));

		if(lista){

			var projection = {_id:1, updatedAt:1},
				autokey = getAutokey(lista),
				relazioni = getListeCorrelate(lista);

			if( autokey ){
				projection[autokey] = 1;
			}

			if( relazioni ){
				relazioni.forEach(function(relazione){
					projection[relazione.field] = 1;
				})
			}

			lista.model.find(
				{},
				projection
			)
				.lean()
				.exec(function(err, risultati){

					var r = {
						id: parametro,
						rel: relazioni,
						risultati: risultati
					};

					cb(err, r);

				})

		}else{
			// cb('Lista ' + parametro + ' non trovata', null);
			//	Se ritorno un errore esce 
			cb(null, null);
		}

	}
	/**
	 * Compila la route in base ai risultati trovati
	 * @param oggetto -> set di risultati
	 * @param parametri -> parametri della route
	 */
	var compilaPath = function(oggetto, parametri){
		
		var path = oggetto.path,
			parametro = parametri.shift();
		
		var base = getParametro.call(oggetto.parametri, parametro );
		
		if( base.id ){
			
			//	trovo il campo autopath della lista corrente
			var autokeyListaCorrente = getAutokey( findKeystoneList(base.id) );
			
			base.risultati.forEach(function (documento) {
				
				var lPath = costruisciPath(path, parametro, documento[autokeyListaCorrente]);
				lPath = getRelazione(base.rel, oggetto.parametri, lPath, documento);
				
				map[lPath] = ['get'];
				route[lPath]  = {
					lastmod: documento.updatedAt ? documento.updatedAt.format(dateFormatString) : null
				};
				
			})
		}
	}
	/**
	 * Per ogni relazione alla 
	 * @param rel -> set di relazioni
	 * @param oggetto -> elenco dei parametri
	 * @param path -> path parziale da completare
	 * @param documento -> documento corrente
	 * @returns {*}
	 */
	var getRelazione = function (rel, oggetto, path, documento) {
	
		rel.forEach(function (relazione) {
	
			var listaCollegata = getParametro.call(oggetto, ':' + relazione.refList);
		
			if(listaCollegata && listaCollegata.id){
	
				var autokey = getAutokey( findKeystoneList(listaCollegata.id) );
	
				for(var l = 0, len = listaCollegata.risultati.length; l < len; l++){

					if( listaCollegata.risultati[l]._id.toString() == documento[relazione.field].toString()){
						path = costruisciPath(path, ':' + relazione.refList, listaCollegata.risultati[l][autokey]);
						path = getRelazione(listaCollegata.rel, oggetto, path, listaCollegata.risultati[l]);
						break;
					}
					
				}
				
			}
			
		})
		
		return path;

	}
	
	var costruisciPath = function(path, parametro, valore){
	
		var p = path.split('/');
		path = '';
		parametro = parametro.toLowerCase();
		
		p.forEach(function(frammento,i){
			path += (i > 0 ? '/' : '') + (frammento.toLowerCase() == parametro ? valore : frammento);
		});

		return path;
	}
	
	var getParametro = function(parametro){
		
		if(!parametro) return [];
		
		parametro =  parametro.toLowerCase().replace(/\?$/,'');
		
		for(var i = 0, len = this.length; i < len; i++){
			if( this[i].id.toLowerCase() == parametro ) return this[i];
			
		}
		
	}
	
	var getDynamicPars = function(path){
		return (path.substring(0,1) == '/' ? path.substring(1) : path).split('/').filter(function(path){
			return path.indexOf(':') !== -1;
		});
	}

	var getAutokey = function(lista){
		return lista.options.autokey && lista.options.autokey.path ? lista.options.autokey.path : '_id';
	}	
	
	var getListeCorrelate = function(lista){
		
		var risultati = [];
		
		for( var f in lista.fields ){
			
			if( lista.fields.hasOwnProperty(f) ){

				if(lista.fields[f].type == 'relationship' ){
					risultati.push({
						field: f,
						refList: lista.fields[f].options.ref,
						autokey: getAutokey(findKeystoneList(lista.fields[f].options.ref))
					});
				}
				
			}
			
		}
	
		return risultati;
		
	}
	
	//-----------------------------------------//
	//-  Fine customizzazione
	//-----------------------------------------//
	
	var create = function(ks, rq, rs, opt) {
		// set variables to be used by all other KeystoneSitemap functions
		keystone = ks;
		req = rq;
		res = rs;
		options = opt;

		parseRoutes();
	};
	
	var createXmlFile = function(){
		//express 3.x.x does not define req.hostname, only req.host
		//express 4.x.x has separate parameters for hostname and protocol
		var host = req.hostname ? req.hostname : req.host;

		sitemap({
			map: map,
			route: route,
			url: host,
			http: req.protocol
		}).XMLtoWeb(res);
	};

	return {
		create: create
	}
	
}

module.exports = idioSitemap();

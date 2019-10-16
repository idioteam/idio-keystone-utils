/* 
 cacheQueries
 Aggiunge ai modelli una cache per memorizzare dati richiesti frequentemente
 */
module.exports = function(modello){

	//	Variabile di controllo degli aggiornamenti
	/**
	 * updated
	 * @type {boolean}
	 * ===============
	 * memorizza lo stato degli aggiornamenti
	 */
	modello.schema.statics.updated = false;

	/**
	 * setAggiornato
	 * @param valore {boolean}
	 * =======================
	 * Modifica il valore della variabile updated per segnalare un aggiornamento dei dati
	 */
	modello.schema.statics.setAggiornato = function(valore){
		if(typeof(valore) === "boolean") {
			modello.schema.statics.updated = valore
		}else{
			throw new Error(valore + ' non è booleano');
		}
	};

	/**
	 * isAggiornato
	 * @returns {boolean}
	 * ====================
	 * Getter della variabile updated
	 */
	modello.schema.statics.isAggiornato = function(){
		return modello.schema.statics.updated;
	};

	/**
	 * cache
	 * @type {object}
	 * ==============
	 * oggetto contenente i risultati delle query in cache
	 */
	modello.schema.statics.cache = {};

	/**
	 * setCache
	 * @param idCache {string}
	 * @param valore {object}
	 * ================
	 * setter dell'oggetto cache
	 */
	modello.schema.statics.setCache = function(idCache, valore){
		modello.schema.statics.cache[idCache] = valore;
	};

	/**
	 * getCache
	 * @param idCache
	 * @returns {*}
	 * ================
	 * getter dell'oggetto cache
	 */
	modello.schema.statics.getCache = function(idCache){
		if( idCache ){
			return modello.schema.statics.cache[idCache];
		}else {
			return modello.schema.statics.cache;
		}
	};

	//	Post save
	/**
	 * Hook post save - eseguito dopo il salvataggio dei dati del modello
	 * ==================================================================
	 * Dopo il salvataggio di un qualsiasi documento del modello
	 * il valore della variabile updated viene settato a true
	 * in modo da rieseguire le query senza utilizzare i risultati in cache
	 */
	modello.schema.post('save', function(){
		modello.schema.statics.setAggiornato(true);
	});

	/**
	 * cacheQuery
	 * @param idCache {string}
	 * @param query {object}
	 * @param locals {object}
	 * @param next {function}
	 * ======================
	 * Se la query non esiste nel registro dei risultati (o se un documento del modello è stato modificato)la esegue e ne salva i risultati nel registro
	 * altrimenti restituisce i risultati dal registro
	 */
	modello.schema.statics.cacheQuery = function(idCache, query, locals, next ){

		var cachedResult = null,
			localVar = safeName(idCache);
		if( typeof next !== 'function' ){
			throw new Error('funzione next mancante');
		}

		//	cerco risultati nella cache
		cachedResult = modello.schema.statics.getCache(idCache);

		if( !cachedResult || modello.schema.statics.isAggiornato() ){

			//	non esiste in cache oppure un documento è stato aggiornato
			query.exec(function(err,results){

				if(err){
					console.log('Errore nell\'esecuzione della query ' + idCache);
					return next();
				}

				//	aggiorno stato
				modello.schema.statics.setAggiornato(false);
				//	memorizzo risultati nella cache
				modello.schema.statics.setCache(idCache, results);
				//	assegno risultati
				locals[localVar] = results;

				next();

			})

		}else{

			//	esiste nella cache
			locals[localVar] = cachedResult;

			next();

		}

	}
};

function safeName(name) {
	return name
		.replace(/\s\w/g,function(s){
			return s.slice(-1).toUpperCase();
		})
		.replace(/[^a-zA-Z0-9]/g, '');
}

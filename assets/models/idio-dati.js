
/**
 * Created by Mat on 16/11/2015.
 */
var keystone = require('keystone');
var Types = keystone.Field.Types;

var Configurazione = new keystone.List('IdioDato', {
	schema: { collection: 'idio-dati' },
	path: 'idio-dati',
	label: 'Dati',
	singular: 'Dato',
	plural: 'Dati',
	map: { name: 'chiave' },
	autokey: { from: 'namespace, chiave', path: 'slug', unique: true },
	nodelete: true,
	defaultSort: 'namespace chiave',
});

Configurazione.add({
	namespace: { type: String, initial: true, noedit: true, label: 'Namespace' },
	chiave: { type: String, initial: true, required: true, noedit: true, label: 'Chiave' },
	valore: { type: String, initial: true, label: 'Valore' },
	info: { type: String },
});

Configurazione.defaultColumns = 'namespace, chiave, valore, info';
/*
 * 	Aggiorna la configurazione
 * 	==========================
 * */
Configurazione.schema.statics.aggiorna = function () {

	var conf = {};

	keystone.list('IdioDato').model.find({})
        .exec(function (err, configurazioni) {

	if (err || !configurazioni) {
		console.log('Errore!');
		return;
	}

	var oggetto = {},
		c;

	for (var i = 0, clen = configurazioni.length; i < clen; i++) {

		c = configurazioni[i];
		if (c.namespace) {
			valutaNS(c.namespace, c.chiave, c.valore, oggetto);
		} else {
			oggetto[c.chiave] = c.valore;
		}

	}

	keystone.set('idioDati', oggetto);


});

};

/*
 * 	Aggiorna la configurazione
 * 	dopo ogni salvataggio
 * 	==========================
 * */
Configurazione.schema.post('save', function () {
	Configurazione.schema.statics.aggiorna();
});

Configurazione.register();

/*
 * 	Attivo l'aggiornamento dei dati
 * 	non appena possibile
 * 	=======================
 * */
Configurazione.schema.statics.aggiorna();

/**
 * valutaNS
 * @param namespace
 * @param chiave
 * @param valore
 * @param obj
 * =================
 * Riduce il namespace ad un unica chiave creando le chiavi intermedie
 */
function valutaNS (namespace, chiave, valore, obj) {

	if (namespace.indexOf('.') !== -1) {

		var n = namespace.split('.');
		creaNS(n[0], obj);
		valutaNS(n.slice(1).join('.'), chiave, valore, obj[n[0]]);

	} else {
		creaNS(namespace, obj);
		obj[namespace][chiave] = valore;
	}

}
/**
 * creaNs
 * @param namespace
 * @param obj
 * ================
 * Crea l'oggetto namespace nell'oggetto obj
 */
function creaNS (namespace, obj) {
	if (!obj.hasOwnProperty(namespace)) {
		obj[namespace] = {};
	}
}

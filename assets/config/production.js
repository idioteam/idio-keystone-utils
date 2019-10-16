/**
 * ------------------------------
 *  Configurazione di produzione
 * ------------------------------
 * impostare nel file .env
 * NODE_ENV=production
 *
 * Da utilizzare in produzione
 */
module.exports = {
	'db': {
		name: '',
		port: 27017,
		host: 'localhost',
	},
	'port': 3000,
	'static options': { maxAge: '10d' },
	'compress': true,
	'logger': 'combined',
	'trust proxy': true,
};
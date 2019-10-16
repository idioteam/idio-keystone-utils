/**
 * ----------------------------
 *  Configurazione di staging
 * ----------------------------
 * impostare nel file .env
 * NODE_ENV=staging
 *
 * Da utilizzare durante la revisione su idiocloud
 */
module.exports = {
	db: {
		name: '',
		port: 27017,
		host:'localhost',
	},
	port: 3001
};

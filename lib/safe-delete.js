/* 
	safeDelete
	Verifica che il documento in cancellazione non venga referenziato da altri documenti
 */
 var keystone = require('../../keystone');
 /**
  * safeDelete
  * @param modello
  * ==========	
  * controlla quali liste sono associate al modello corrente ed aggiunge alle liste collegate un pre remove
  * per verificare che l'oggetto in cancellazione non sia referenziato in altre liste
  */
 module.exports = function(modello){
 
	for( var field in modello.fields ){

		if( modello.fields.hasOwnProperty(field)){

			if( modello.fields[field].type == 'relationship' ){
				
				var factory = function(listaCollegata, listaCorrente, campoListaCorrente){

					listaCollegata = keystone.list(listaCollegata);
					var nomeOggettoCollegato = listaCollegata.options.singular,
						nomeOggettoCorrente = listaCorrente.options.singular,
						mapOggettoCorrente = listaCorrente.options.map.name;
					
					return(
						
						listaCollegata.schema.pre('remove', function(next){
							
							var filtro = {},
								_this = this;
							filtro[campoListaCorrente] = this._id;

							listaCorrente.model.findOne(filtro, function(err, result){
								
								if(err){
									next(err);
									return;
								}

								if(result){
									var errore = 'Impossibile eliminare l\'elemento "' + _this[listaCollegata.options.map.name] + '" perchè associato ad un elemento esterno\n\n' +
											'\telemento: "' + result[mapOggettoCorrente] + '"\t\n\ttipo:\t\t "' + nomeOggettoCorrente + '"\t\n' +
											'\nEliminare l\'associazione prima di cancellare questo elemento\n ';
									next( new Error(errore) );
									return;
								}

								next();
							})

						})
					)

				};

				factory(modello.fields[field].options.ref, modello, field);
				
			}

		}
	}

 }
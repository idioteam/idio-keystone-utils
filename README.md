# idio-keystone-utils

<img src="https://gitlab.com/uploads/user/avatar/281516/Idioteam-Tinca.png" width="210" height="242" />

## Cosa
Una serie di utilità per la gestione dei siti realizzati con KeystoneJS.  

*  [safeDelete(modello)](#safedeletemodello)
*  [cacheQueries(modello)](#cachequeriesmodello)
*  [prodList](#prodlist)
*  [jsMin](#jsmin)
*  [IdioConfigurazione](#idioconfigurazione)
*  [IdioPolicy](#idiopolicy)
*  [Librerie Javascript](#librerie-javascript)
*  [Mixins](#mixins)

## Dipendenze
**jsMin** richiede uglify-js (https://github.com/mishoo/UglifyJS2) che dovrebbe venire installato automaticamente come dipendenza del modulo.  
**prodList** richiede grunt-execute, ma va installato come dipendenza del progetto e non del modulo. Quindi alla fine eseguire dalla root del progetto (deve finire nel ```package.json``` del progetto):
```
npm install grunt-execute --save
```

## safeDelete(modello)
Verifica se il modello passato come argomento ha dei campi definiti come relazioni (```type:Types.Relationship```), caso in cui associa all'evento **pre delete** (```modello.schema.pre('remove', callback)```) una funzione che verifica se il documento in cancellazione è presente nel modello collegato (attributo ```ref``` del campo con la relazione).

Se trova un occorrenza avverte l'utente e non esegue la cancellazione.
Sembra una minchiata, ma Keystone di suo se ne sbatte:)

> **Esempio**
Se nel modello *Categorie* ho il seguente campo:
```javascript
gruppo: {type:Types.Relationship, ref:'Gruppi', initial:true, required:true, label:'Gruppo'}
```
Quando cerco di cancellare un documento dalla collection *Categorie*, safeDelete cerca l'id del documento nella collection *Gruppi*.  
Se lo trova non cancella il documento, altrimenti sì.

**<font color='red'>Importante!!</font>**  
Affinchè l'utente veda il messaggio di errore bisogna modificare il file il ```node_modules\keystone\admin\api\list\delete.js``` perchè la callback della funzione che esegue la cancellazione non prevede azioni per errore sulle cancellazioni.  
La funzione a riga 28
```javascript
req.list.model.find().where('_id').in(ids).exec(function (err, results) {
	if (err) return res.apiError('database error', err);
	async.forEachLimit(results, 10, function(item, next) {
		item.remove(function (err) {
			if (err) return next(err);
			deletedCount++;
			deletedIds.push(item.id);
			next();
		});
	}, function() {
		return res.json({
			success: true,
			ids: deletedIds,
			count: deletedCount
		});
	});
});
```
deve diventare
```javascript
req.list.model.find().where('_id').in(ids).exec(function (err, results) {
	if (err) return res.apiError('database error', err);
	async.forEachLimit(results, 10, function(item, next) {
		item.remove(function (err) {
			if (err) return next(err);
			deletedCount++;
			deletedIds.push(item.id);
			next();
		});
	}, function(err) {
		
		if( err || deletedCount == 0){
			return res.apiError('Errore', err || 'Item not found');
		}
					
		return res.json({
			success: true,
			ids: deletedIds,
			count: deletedCount
		});
	});
});
```

> **Consiglio**
Puoi utilizzare il modulo all'avvio di keystone senza doverlo importare su tutti i moduli. Tanto non fa niente se non deve fare niente.
```javascript
keystone.start({
	onMount: function(){
		var modelUtils = require('idio-keystone-utils');
		for( var lista in keystone.lists){
			if(keystone.lists.hasOwnProperty(lista)){
				modelUtils.safeDelete(keystone.lists[lista]);
			}
		}
	}
});
```

<br/>

## cacheQueries(modello)
Aggiunge al modello un registro per i risultati delle query, identificate da un id.  
Aggiunge allo schema del modello il metodo statico ```model.schema.statics.cacheQuery(idCache, query, locals, next)``` che verifica se la query è già stata eseguita o meno. Se la query non è stata eseguita viene eseguita ed i risultati salvati nel registro, dal quale verranno recuperati all'esecuzione successiva della query.  
I risultati vengono assegnati a ```res.locals``` nella variabile corrispondente all'id della query (nel caso questa contenga caratteri non compatibili col nome di una variabile verranno rimossi e camel caseittizati, più o meno, se comunque eviti nomi complessi non sbagli)

> **Esempio di utilizzo del metodo ```model.schema.statics.cacheQuery```**
```javascript
News.schema.statics.cacheQuery(
    'news home',                                                // identificativo query
    News.model.where('visibile', 'si').sort('-data').limit(5),  // query 
    locals,                                                     // res.locals 
    next                                                        // funzione next
)
```

In questo caso i risultati della query vengono assegnati a ```locals.newsHome```

## prodList
Modulo per il controllo del progetto prima del rilascio in produzione. Il modulo installa due task di grunt:

*   execute:checklistProduzione Test
*   execute:checklistProduzione Run

entrambi eseguono prodList, ma mentre ```execute:checklistProduzione Test``` esegue solo i contolli, ```execute:checklistProduzione Run``` prova anche a modificare il progetto, dove possibile

> **<font color='red'>Attenzione!</font>**  
Per eseguire i task è necessario installare grunt-execute come dipendenza del progetto e non del modulo. Per questo è necessario installarlo a mano eseguendo
```
npm install grunt-execute --save
```
dalla radice del progetto

## jsMin
Utilità per comprimere i file javascript per l'ambiente di produzione.  

1. **Rendere la proprietà env accessibile alle viste**
    Nel file ```routes/middleware.js``` aggiungere alla funzione ```initLocals```
```
locals.env = keystone.get('env');
```
<br/>
2. **Aggiornamento del layout di jade**
   Istruire jade ad utilizzare la lista dei file durante lo sviluppo ed il file minificato in produzione<br/>
   Wrappare la lista dei file javascript con la condizione per la modalità di sviluppo
```javascript
if env != 'production'
```
   ed aggiungere dopo di essa la condizione per la modalità di produzione
```javascript
if env == 'production'
    script(src='path/al/file/minificato.js')
```
   Le due condizioni vanno poi wrappate con dei commenti per consentire al modulo di estrarre correttamente la lista di file. Questo consente anche di lasciare dei file fuori dal processo di minificazione, qualora si necessario.
   Il commento di apertura è **```//-idiojs:dev```** (blocco di sviluppo) **```//-idiojs:prod```** (blocco di produzione); il commento di chiusura è sempre **```//-idiojs:end```** <br/>
   I due blocchi diventano quindi:
     
    ```javascript
    // Blocco di sviluppo
    //-idiojs:dev
    if env != 'production'
        script(type='text/javascript', src='/js/dev/custom.js')
        ....
    //-idiojs:end
    
    //Blocco di produzione
    //-idiojs:prod
    if env == 'production'
        script(type='text/javascript', src='js/scripts.min.js')
    //-idiojs:end
    ```
<br/>
3. **Creazione del file minificato**
    Per creare il file minificato richiamare il modulo nel file **keystone.js** nell'evento ```mount``` di **keystone.start()**:
    ```javascript
    keystone.start({
    	onMount: function() {
    		if (keystone.get('env') == 'production') {
    			var minifica = require('idio-comprimi/runTask')
    		}
    	}
    });
    ```
Questo codice esegue un task di grunt che utilizza il metodo ***js*** che si va a leggere tutti i file jade presenti nella cartella 'templates/layout' e produce il file minificato includendovi i file js referenziati nei blocchi ```//-idiojs:dev``

### Metodi
Il modulo ha 2 metodi pubblici: ***js*** e ***jsFolder***

#### js()
Questo metodo crea il file minificato a partire dai template di jade. Non ha argomenti e deve essere utilizzato come descritto sopra.


#### jsFolder(folder, output)
Questo metodo consente di minificare file in una cartella indipendentemente dal fatto che siano referenziati in un template di jade.

- folder - il path della cartella da comprimere (se contiene file di diversi tipi vengono presi solo i file javascript)
- output - il path del file minificato da produrre

## IdioConfigurazione
Installa il modulo **IdioConfigurazione** (```models/IdioConfigurazione.js```) utile per avere un oggetto di configurazione modificabile a run-time.  
Ad ogni salvataggio della collection **IdioConfigurazione** la proprietà ```keystone('configurazione')```  viene rigenerata assegnandole i documenti della collection.
È possibile raggruppare più chiavi in un oggetto utilizzando il campo **namespace**.

> Esempio:
Supponendo che nella collection siano presenti i seguenti documenti
```javascript
[
    {namespace:'',chiave:'azienda',valore:'NSI S.r.l.'},
    {namespace:'',chiave:'cf',valore:'0123456789'},
    {namespace:'social',chiave:'facebook',valore:'url di facebook'},
    {namespace:'social',chiave:'twitter',valore:'url di twitter'}
]
```
La proprietà ```keystone('configurazione')``` avrà il seguente valore:
```javascript
{
    azienda: 'NSI S.r.l.',
    cf: '0123456789',
    social:{
        facebook: 'url di facebook',
        twitter: 'url di twitter'
    }
}
```

**<font color='red'>Attenzione!</font>**  
Per rendere disponibile la proprietà alle views è necessario esportare la proprietà all'interno della funzione ```initLocals``` presente in ```routes\middleware.js```
```javascript
 locals.conf = keystone.get('idioConfigurazione');
```
In questo modo le configurazioni sono accessibili alle view:
```javascript
a(href=conf.social.facebook) Facebook
```

## IdioPolicy
Fornisce il supporto per la creazione delle route per la **cookies policy** e la **privacy policy**.  
Lavora congiuntamente ad **IdioConfigurazione** che viene utilizzato per salvare i dati da inserire nelle due policy.  
È possibile installare le due routes utilizzando il seguente require in ```routes\index.js``` all'interno dell'export (l'oggetto ```app``` deve essere disponibile)
```javascript
require('idio-keystone-utils').policy(app);
```
Le due route sono chiamate, di default '/cookies-policy' e '/privacy-policy'. È possibile personalizzare il nome delle due route passando un secondo ed un terzo argomento al require soprastate per personalizzare la route della cookie policy e la route della privacy policy rispettivamente.


## Librerie Javascript

*   **IdioForm**
    Libreria per la verifica ed il submit di un form 
    
*   **IdioLayout**
    Consente di emettere eventi personalizzati alla modifica del viewport per adattare i componenti della pagina al layout visualizzato
    
*   **IdioModale**
    Consente di gestire una modale di Bootstrap

## Mixins

*   **IdioForm**
    Il mixin campo consente di creare un campo specificandone le proprietà

*   **IdioSchemaOrg**
    Una serie di mixin per creare rich snippets schema.org basati su JSON-LD

#### Cose da importare in futuro
*   mixin a bomba
*   public/js
*   idio-customize-keystone

---
This is the end, beautiful friend  
This is the end, my only friend, the end  
Of our elaborate plans, the end  
Of everything that stands, the end  
No safety or surprise, the end  
I'll never look into your eyes, again  

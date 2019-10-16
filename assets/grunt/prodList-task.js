module.exports = {
	
	tasks:{

		'execute:checklistProduzione Test':{
			src: ['node_modules/idio-keystone-utils/task-runner/run-prodList-test.js']
		},
		'execute:checklistProduzione Run':{
			src: ['node_modules/idio-keystone-utils/task-runner/run-prodList.js']
		}

}
	
};
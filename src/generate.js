#!/usr/bin/env node --harmony

const fs = require("fs");
const program = require('commander')
const chalk = require('chalk')
const yaml = require('js-yaml')
const hogan = require('hogan.js')
var Ajv = require('ajv')

///////////////////////////////////////////////////////////////////////////////////////////////////

// Schema
//

// Definitions
//
var defsSchema = {
	$schema: 'http://json-schema.org/draft-07/schema#',
	$id: 'http://localhost/schemas/defs.json#',
	title: 'Definitions',
	definitions: {
		type: {
			$id: '#type',
			enum: [
				'Boolean',
				'Null',
				'Undefined',
				'Number',
				'String',
				'Object',
				'Array'
			]
		}
	}
}

//Argument
var argumentSchema = {
	$schema: 'http://json-schema.org/draft-07/schema#',
	$id: 'http://localhost/schemas/argument.json#',
	title: 'Argument',
	type: 'object',
	required: [
		'arg',
		'type'
	],
	properties: {
		arg: {
			type: 'string'
		},
		type: {
			$ref: 'defs.json#type'
		}
	}
}

// Function
var functionSchema = {
	$schema: 'http://json-schema.org/draft-07/schema#',
	$id: 'http://localhost/schemas/function.json#',
	title: 'Function',
	type: 'object',
	required: [
		'function',
		'args',
		'return',
		'description'
	],
	properties: {
		function: {
			type: 'string'
		},
		args: {
			type: [
				'null',
				'array'
			],
			items: { $ref: 'argument.json#' }
		},
		return: {
			$ref: 'defs.json#type'
		},
		description: {
			type: 'string'
		}
	}
}

// Service
var serviceSchema = {
	$schema: 'http://json-schema.org/draft-07/schema#',
	$id: 'http://localhost/schemas/service.json#',
	title: 'Service',
	type: 'object',
	required: [
		'description',
		'object',
		'functions'
	],
	properties: {
		description: {
			type: 'string'
		},
		object: {
			type: [
				'null',
				'string'
			]
		},
		function: {
			type: 'string'
		},
		functions: {
			type: 'array',
			items: { $ref: 'function.json#' }
		},
		return: {
			$ref: 'defs.json#type'
		}
	}
}

// Services
var servicesSchema = {
	$schema: 'http://json-schema.org/draft-07/schema#',
	$id: 'http://localhost/schemas/services.json#',
	title: 'A collection of Post-RPC services',
	type: 'array',
	items: {$ref: 'service.json#'}
}

///////////////////////////////////////////////////////////////////////////////////////////////////

// Templates
//

const templates = {
	serverProlouge: hogan.compile(`{{#service.description}}  // {{service.description}}
	//
{{/service.description}}`),
	server: hogan.compile(`  {{server}}.register('{{#service.object}}{{service.object}}.{{/service.object}}{{def.function}}', [{{#def.args}}['{{arg}}', '{{type}}']{{^last}}, {{/last}}{{/def.args}}], '{{def.return}}', {{#service.object}}{{service.object}}.{{/service.object}}{{def.function}}, '{{def.description}}');
`),
	serverEpilouge: hogan.compile(`
`),
	clientProlouge: hogan.compile(`{{#service.description}}  // {{service.description}}
	//
{{/service.description}}{{#service.object}}  var {{service.object}} = {};
{{/service.object}}`),
	client: hogan.compile(`  {{^service.object}}var {{/service.object}}{{#service.object}}{{service.object}}.{{/service.object}}{{def.function}} = function({{#def.args}}{{arg}}{{^last}}, {{/last}}{{/def.args}}) {
		{{client}}.call('{{#service.object}}{{service.object}}.{{/service.object}}{{def.function}}', { {{#def.args}}{{arg}}: {{arg}}{{^last}}, {{/last}}{{/def.args}} });
	}
`),
	clientEpilouge: hogan.compile(`
`)
}

///////////////////////////////////////////////////////////////////////////////////////////////////

var die = function(error) {
	console.error(chalk.red('error: ' + error))
	process.exit(1)
}

var debug = function(message) {
	console.error(chalk.magenta(message))
}

var load = function(serviceFile) {
	try {
		definitions = yaml.safeLoad(fs.readFileSync(serviceFile, 'utf8'))
		var ajv = new Ajv({verbose: true})
			.addSchema(defsSchema, 'defs')
			.addSchema(argumentSchema, 'argument')
			.addSchema(functionSchema, 'function')
			.addSchema(serviceSchema, 'service')
			.addSchema(servicesSchema, 'services')
		var valid = ajv.validate('services', definitions)
		if (!valid) {
			console.error(chalk.red('error: Invalid Service'))
			console.error(chalk.red(ajv.errorsText(ajv.errors, {dataVar: serviceFile, separator: '\n'})))
			process.exit(1)
		}

	} catch (error) {
		die(error)
	}
	return definitions
}

var render = function(data, template, stream) {
	try {
		stream.write(template.render(data));
	} catch (error) {
		die(error)
	}
}

var generate = function(serviceFile, type, {
		server = 'window.server',
		client = 'window.client',
		stdout = undefined
	} = {}) {

	if (serviceFile.search(/^.*\.[^\\]+$/) === -1) {
		serviceFile = serviceFile + '.yml'
	}

	output = serviceFile.replace(/\.yaml|\.yml/i,'.'+type+'.js')
	if (stdout) {
		output = '-'
	}

	var definitions = load(serviceFile)

	var wstream
	try {
		if (output === '-') {
			wstream = process.stdout
		} else {
			wstream = fs.createWriteStream(output)
		}
	} catch (error) {
		die(error)
	}

	for (var service of definitions) {
		render({client: client, server: server, service: service }, templates[type+'Prolouge'], wstream)
		for (var def of service.functions) {
			if (def['args']) {
				def['args'][def['args'].length - 1].last = true
			}
			render({client: client, server: server, service: service, def: def }, templates[type], wstream)
		}
		render({client: client, server: server, service: service }, templates[type+'Epilouge'], wstream)
	}

	try {
		if (output !== '-') {
			wstream.end()
		}
	} catch (error) {
		die(error)
	}

}

///////////////////////////////////////////////////////////////////////////////////////////////////

var service
var definitions
var client
var server
var output

program
	.arguments('<service...>')
	.option('-c, --client <client>', 'client var')
	.option('-s, --server <server>', 'server var')
	.option('--stdout', 'output to stdout')
	.action(function (serviceArg) {
		service = serviceArg
	})
	.parse(process.argv)

if (!service) {
	program.help()
}

for (var serviceFile of service) {
	generate(serviceFile, 'server', {
		client: program.client,
		server: program.server,
		stdout: program.stdout
	})
	generate(serviceFile, 'client', {
		client: program.client,
		server: program.server,
		stdout: program.stdout
	})
}

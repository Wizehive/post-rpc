#!/usr/bin/env node --harmony

const fs = require("fs");
const program = require('commander')
const chalk = require('chalk')
const yaml = require('js-yaml')
const hogan = require('hogan.js')

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

	//debug('serviceFile: ' + serviceFile)
	output = serviceFile.replace(/\.yaml|\.yml/i,'.'+type+'.js')
	if (stdout) {
		output = '-'
	}
	//debug('client: ' + client)
	//debug('server: ' + server)
	//debug('output: ' + output)

	var definitions
	try {
		definitions = yaml.safeLoad(fs.readFileSync(serviceFile, 'utf8'))
	} catch (error) {
		die(error)
	}
	//debug(serviceFile + ': ' + JSON.stringify(definitions, null, 2))

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

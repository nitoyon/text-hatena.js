module.exports = function( grunt ) {

grunt.initConfig({
	qunit: {
		lib: [
			'test/index.html'
		]
	},
	lint: {
		all: [ '**/*.js' ]
	},
	jshint: {
		options: {
			curly: true,
			newcap: true,
			noarg: true,
			undef: true,
			unused: true
		}
	},
	watch: {
		files: '**/*.js',
		tasks: 'default'
	}
});

grunt.registerTask('default', 'lint qunit');

};
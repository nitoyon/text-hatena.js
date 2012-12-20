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
	watch: {
		files: '**/*.js',
		tasks: 'default'
	}
});

grunt.registerTask('default', 'lint qunit');

};
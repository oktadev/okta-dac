/** @format */

module.exports = {
	transpileDependencies: ['vuetify', 'vuex-persist'],
	css: {
		loaderOptions: {
			sass: {
				sassOptions: {
					quiet: true,
					quietDeps: true,
				},
			},
		},
	},
};

// @see https://github.com/tailwindcss/tailwindcss/issues/1234
module.exports = {
  plugins: {
    tailwindcss: {},
    'postcss-preset-env': {
      autoprefixer: {
        flexbox: 'no-2009',
      },
      stage: 3,
      features: {
        'custom-properties': false,
      },
    },
  },
};

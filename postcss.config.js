module.exports = {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
    'postcss-preset-env': {
      stage: 3,
      features: {
        'nesting-rules': true,
        'custom-properties': false,
        'custom-media-queries': true,
        'media-query-ranges': true
      },
      autoprefixer: {
        flexbox: 'no-2009'
      }
    }
  }
} 
export default [
  {
    name: 'Main Bundle',
    path: 'dist/assets/main-*.js',
    limit: '150 KB',
    gzip: true,
  },
  {
    name: 'React Vendor',
    path: 'dist/assets/rv-*.js',
    limit: '140 KB',
    gzip: true,
  },
  {
    name: 'Animation Vendor',
    path: 'dist/assets/anim-*.js',
    limit: '80 KB',
    gzip: true,
  },
  {
    name: 'Icons Vendor',
    path: 'dist/assets/icons-*.js',
    limit: '60 KB',
    gzip: true,
  },
  {
    name: 'Total CSS',
    path: 'dist/assets/*.css',
    limit: '50 KB',
    gzip: true,
  },
];

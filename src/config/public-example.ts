import provenance from '../../public/examples/duo-first-run/provenance.json';

/** Public, operator-authorized fictional inputs and a single unedited provider run. */
export const publicVideoExample = {
  ...provenance,
  basePath: '/examples/duo-first-run',
  video: '/examples/duo-first-run/output-original.mp4',
  poster: '/examples/duo-first-run/poster.jpg',
};

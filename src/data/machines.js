export const MACHINE_CATALOGUE = {
  konica: [
    { name: 'C3550i', cost: 2800, mono: false, image: 'https://d1nz2cwxocqem8.cloudfront.net/image/380230487157/image_9rsvkg4kf1047dnj1n6onsne4b/-S900x900-FWEBP' },
    { name: 'C250i', cost: 4300, mono: false, image: 'https://www.konicaminolta.com.au/wp-content/uploads/2024/12/bizhub-c250i-frontview-1.jpg' },
    { name: 'C458', cost: 4500, mono: false, image: 'https://www.photocopiersrus.com/wp-content/uploads/2023/07/C558-2.jpg' },
    { name: 'C558', cost: 4800, mono: false, image: 'https://www.photocopiersrus.com/wp-content/uploads/2023/07/C558-2.jpg' },
    { name: 'C300i', cost: 5000, mono: false, image: 'https://www.konicaminolta.com.au/wp-content/uploads/2025/02/bizhub-301i-DF-714-PC-216-JS-506-studio-picture-Front.png' },
    { name: 'C360i', cost: 7800, mono: false, image: 'https://www.konicaminolta.com.au/wp-content/uploads/2025/02/bizhub-360i-front-view.avif' },
    { name: 'C450i', cost: 9300, mono: false, image: 'https://www.konicaminolta.com.au/wp-content/uploads/2025/02/bizhub-450i-front-view.avif' },
    { name: 'C550i', cost: 10900, mono: false, image: 'https://www.konicaminolta.com.au/wp-content/uploads/2025/02/bizhub-550i-front-view.avif' },
  ],
  fujifilm: [
    { name: 'C3570', cost: 4500, mono: false, image: 'https://asset-fb.fujifilm.com/www/fb/files/styles/600x400/public/2026-02/e6948e8b89b91103f4e99c6db9731c78/bnr_Apeos_4570_3570_07.png' },
    { name: 'C4570', cost: 6500, mono: false, image: 'https://asset-fb.fujifilm.com/www/fbca/files/styles/600x400/public/2025-06/00e60f543fedd989dc10ec467c05313a/pic_apeos-C7070_02.png' },
  ],
  fujifilm_new: [
    { name: 'C3061', cost: 6500, mono: false, image: 'https://asset-fb.fujifilm.com/www/fbau/files/styles/600x400/public/2025-07/625373b09add199f24c586b291084cd1/pic_apeos_c3061_c2561_c2061_overview_01.png' },
    { name: 'C3567', cost: 6500, mono: false, image: 'https://asset-fb.fujifilm.com/www/fbsg/files/styles/600x400/public/2025-06/50a4ea42cee27532f0ef041125c55994/pic_apeos-C3567-C3067-C2567_overview_01.png' },
    { name: 'C5571', cost: 11300, mono: false, image: 'https://asset-fb.fujifilm.com/www/fbsg/files/styles/600x400/public/2025-06/ceccd824c8477df64af3262aea08662d/pic_apeos_c7071_c6571_c5571_c4571_04.png' },
  ],
  epson: [
    { name: 'SC-T3130', cost: 6200, mono: false, image: 'https://mediaserver.goepson.com/adaptivemedia/rendition?id=a3affc5f9bb185d28839422fd4573375c6f32fa8&vid=a3affc5f9bb185d28839422fd4573375c6f32fa8&prid=1200Wx1200H&clid=SAPDAM&prclid=banner&assetDescr=SC-T3130_1-1' },
    { name: 'SC-T3435', cost: 7500, mono: false, image: 'https://mediaserver.goepson.com/adaptivemedia/rendition?id=ddf4dbcc36937fdc13fe6307e8385bff7c1bd976&vid=ddf4dbcc36937fdc13fe6307e8385bff7c1bd976&prid=1200Wx1200H&clid=SAPDAM&prclid=banner&assetDescr=SC-T3435-(1)' },
    { name: 'SC-T5130', cost: 7200, mono: false, image: 'https://mediaserver.goepson.com/adaptivemedia/rendition?id=f1b0be315b5f2a9fc66b77ee077f15fd514e9549&vid=f1b0be315b5f2a9fc66b77ee077f15fd514e9549&prid=1200Wx1200H&clid=SAPDAM&prclid=banner&assetDescr=SC-T5130_1-1' },
    { name: 'SC-T5130M', cost: 8000, mono: false, image: 'https://mediaserver.goepson.com/adaptivemedia/rendition?id=4c58af3933b142ced8b13c3300a03649dd895c4c&vid=4c58af3933b142ced8b13c3300a03649dd895c4c&prid=1200Wx1200H&clid=SAPDAM&prclid=banner&assetDescr=SC-T5130M-%281%29' },
  ],
}

// Calculator brand tabs (keeps rebuilt / brand-new split for context)
export const BRAND_META = {
  konica: { label: 'Konica Minolta', sub: 'Rebuilt', accent: '#595f6e' },
  fujifilm: { label: 'Fujifilm', sub: 'Rebuilt', accent: '#e8322a' },
  fujifilm_new: { label: 'Fujifilm', sub: 'Brand New', accent: '#e8322a' },
  epson: { label: 'Epson', sub: 'Brand New', accent: '#0071B8' },
}

// Catalogue tabs (fujifilm merged, no rebuilt/brand-new split)
export const CATALOGUE_SECTIONS = [
  {
    key: 'konica',
    label: 'Konica Minolta',
    machines: MACHINE_CATALOGUE.konica,
  },
  {
    key: 'fujifilm',
    label: 'Fujifilm',
    machines: [...MACHINE_CATALOGUE.fujifilm, ...MACHINE_CATALOGUE.fujifilm_new],
  },
  {
    key: 'epson',
    label: 'Epson',
    machines: MACHINE_CATALOGUE.epson,
  },
]

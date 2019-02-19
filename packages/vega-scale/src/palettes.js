function colors(specifier) {
  var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
  while (i < n) colors[i] = '#' + specifier.slice(i * 6, ++i * 6);
  return colors;
}

export var category20 = colors(
  '1f77b4aec7e8ff7f0effbb782ca02c98df8ad62728ff98969467bdc5b0d58c564bc49c94e377c2f7b6d27f7f7fc7c7c7bcbd22dbdb8d17becf9edae5'
);

export var category20b = colors(
  '393b795254a36b6ecf9c9ede6379398ca252b5cf6bcedb9c8c6d31bd9e39e7ba52e7cb94843c39ad494ad6616be7969c7b4173a55194ce6dbdde9ed6'
);

export var category20c = colors(
  '3182bd6baed69ecae1c6dbefe6550dfd8d3cfdae6bfdd0a231a35474c476a1d99bc7e9c0756bb19e9ac8bcbddcdadaeb636363969696bdbdbdd9d9d9'
);

export var blueOrange = new Array(3).concat(
  '67a9cff7f7f7f1a340',
  '0571b092c5defdb863e66101',
  '0571b092c5def7f7f7fdb863e66101',
  '2166ac67a9cfd1e5f0fee0b6f1a340b35806',
  '2166ac67a9cfd1e5f0f7f7f7fee0b6f1a340b35806',
  '2166ac4393c392c5ded1e5f0fee0b6fdb863e08214b35806',
  '2166ac4393c392c5ded1e5f0f7f7f7fee0b6fdb863e08214b35806',
  '0530612166ac4393c392c5ded1e5f0fee0b6fdb863e08214b358067f3b08',
  '0530612166ac4393c392c5ded1e5f0f7f7f7fee0b6fdb863e08214b358067f3b08'
).map(colors);


// These colors were designed by Maureen Stone for Tableau.

export var tableau10 = colors(
  '4c78a8f58518e4575672b7b254a24beeca3bb279a2ff9da69d755dbab0ac'
);

export var tableau20 = colors(
  '4c78a89ecae9f58518ffbf7954a24b88d27ab79a20f2cf5b43989483bcb6e45756ff9d9879706ebab0acd67195fcbfd2b279a2d6a5c99e765fd8b5a5'
);

// density palettes

export var density_light_orange = colors(
  'f2e7daf7d5baf9c499fab184fa9c73f68967ef7860e8645bde515bd43d5b'
);

export var density_light_grayred = colors(
  'efe9e6e1dad7d5cbc8c8bdb9bbaea9cd967ddc7b43e15f19df4011dc000b'
);

export var density_light_blueteal = colors(
  'e3e9e0c0dccf9aceca7abfc859afc0389fb9328dad2f7ca0276b95255988'
);

export var density_light_grayteal = colors(
  'e4eaead6dcddc8ced2b7c2c7a6b4bc64b0bf22a6c32295c11f85be1876bc'
);

export var density_light_multicolor = colors(
  'e0f1f2c4e9d0b0de9fd0e181f6e072f6c053f3993ef77440ef4a3c'
);

export var density_dark_blue = colors(
  '3232322d46681a5c930074af008cbf05a7ce25c0dd38daed50f3faffffff'
);

export var density_dark_red = colors(
  '3434347036339e3c38cc4037e75d1eec8620eeab29f0ce32ffeb2c'
);

export var density_dark_green = colors(
  '3a3a3a215748006f4d048942489e4276b340a6c63dd2d836ffeb2cffffaa'
);

export var density_dark_gold = colors(
  '3c3c3c584b37725e348c7631ae8b2bcfa424ecc31ef9de30fff184ffffff'
);

export var density_dark_multicolor = colors(
  '3737371f5287197d8c29a86995ce3fffe800ffffff'
);

// symbol palettes

export var blue = colors(
  'b9ddf1a6d0ea94c2e183b3d775a6cc6798c1598ab64c7dab42709e3764912a5783'
);

export var orange = colors(
  'ffc685fab767f5a847f59536f2822aed6f20e16220d05822c04f23af46239e3d22'
);

export var green = colors(
  'b3e0a699d78887cc7978bf6c6ab25f5ea6544e9a51408e4d2f824327763d24693d'
);

export var red = colors(
  'ffbeb2feac9dfc9b87fa8971f67561f26250eb4c48e03841d2283dc11a3bae123a'
);

export var purple = colors(
  'eec9e5e7badadcadcdd1a0c0c792b5bc86a9b0799fa06f999164918659867c4d79'
);

export var brown = colors(
  'eedbbdecca96e9b97ae4a865dc9856d18954c7784cc0673fb85536ad44339f3632'
);

export var gray = colors(
  'd5d5d5c6c8c7b6b9b9a7acad979fa18892967a858b6c7880606b76555f6a49525e'
);

export var gray_warm = colors(
  'dcd4d0cec5c1c0b8b4b3aaa7a59c9998908c8b827f7e7673726866665c5a59504e'
);

export var teal = colors(
  'bbdfdfa2d4d58ac9c975bcbb61b0af4da5a43799982b8b8c1e7f7f127273006667'
);

export var blue_teal = colors(
  'bce4d89dd3d181c3cb65b3c245a2b9368fae347da0306a932c5985'
);

export var orange_gold = colors(
  'f4d166f8be5cf8aa4cf5983bf3852aef701be2621fd65322c54923b142239e3a26'
);

export var green_gold = colors(
  'f4d166d5ca60b6c35c98bb597cb25760a6564b9c533f8f4f33834a257740146c36'
);

export var red_gold = colors(
  'f4d166f6be59f9aa51fc964ef6834bee734ae56249db5247cf4244c43141b71d3e'
);

export var orange_blue_diverging = colors(
  '9e3d22ad4523bc4d23cb5522d95e21e76820ee7725f58a30fa9e3ffdb053ffc171d9d5c99dcbe48ec2df80b6d973a8d0669bc75c91bf5385b2487aa93b6ea03064952b5c8a'
);

export var red_green_diverging = colors(
  'ae123abf193bce253ddc3440e74545ef574cf46956f77c66fa8d75fc9c89feac9dced7c399d78888cd7a7bc26f6fb66364ab5957a1534995503b8a4a2d7f4227753d24693d'
);

export var green_blue_diverging = colors(
  '24693d27753d3081433d8c4b4a974f58a15366ad5a72b9667dc4718cd07d9cda8cc9dad2a0c9e090bddc80b1d573a6cc689ac35e8fb95283af4878a5406c9935628e2a5783'
);

export var red_blue_diverging = colors(
  'a90c38bb163aca223cd9303fe44144ee534bf36755f77a64fa8b75fd9b87ffac9bdfd4d1a9cee696c2e188b6d97aabd06d9fc66192bc5787b34c7ca942709e3865922e5a87'
);

export var red_black = colors(
  'ae123abf193bcf253ddc3340e74445ef574cf46a57f77b66fb8d75fc9d89feac9dd9d9d9c6c8c7b8bbbaaaafaf9ca3a58e979a818b9074808768747d5e6974545e6949525e'
);

export var gold_purple_diverging = colors(
  'ad9024b49629bb9d32c1a33bc8ab43cfb250d4b95edbc06cdfc689e3d8cfdeb7cbd9aec8d4a3c3ce9bbec892b8c189b0ba82a9b37aa1ac7299'
);

export var red_green_gold_diverging = colors(
  'be2a3ec7383fd24743de5748e56349ec714af37e4bf88a4dfa994efba952fcbb58f4d166cec85eb6c35a9fbe5f89b76172b0655fa8664f9f63459559398a502e7f4722763f'
);

export var sunrise_sunset_diverging = colors(
  '33608c5265987567a29768a5b669a1d16c98e7718af67c7cff8974f6ba57ee9b47ee8a43ed7846e96749df5a47d54c45cb3f42c12e3fb81840'
);

export var orange_blue_white_diverging = colors(
  '9e3d22b24723c55123d85d21e96b21f17e29f79236fba749febb65ffcd93ffdfc0ffffffd2ebfabbddf1a5cfe78dc1df7cb2d66da3cc5f94c15386b34577a7366a9b2b5c8a'
);

export var red_green_white_diverging = colors(
  'ae123ac41e3cd8303fe84646f16051f77963fa9079fda695ffbab0fed1ccfbe6e5ffffffdaefd9bce5b7a1da9389cd7b79bf6c6ab15e59a35448945037874729783e24693d'
);

export var green_blue_white_diverging = colors(
  '24693d29783e36864646934e59a15369b05d77be6b88cd799dda8eb8e5b1d5efd4ffffffcee8f3b8daeaa3cbe18ebcdb7cadd26c9ec65e8fb95081ad4472a03865912a5783'
);

export var red_blue_white_diverging = colors(
  'a90c38c01a3bd52c3ee54245f05c4ff67660fb8d78fea391ffbaaeffd0cbfbe6e5ffffffd2ebfabdddf0a8cde693c0df81b1d570a2c86192bc5484b14776a33a67952e5a87'
);

export var red_black_white_diverging = colors(
  'ae123ac51d3cd9303fe84646f16051f77964fb8f78fda694ffbab0fed1ccfbe6e5ffffffebebebdadadac9cacab7bbbaa6acac949c9e838d91727e86646f7956606b49525e'
);

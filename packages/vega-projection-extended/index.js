import {projection} from 'vega-projection';
import {
  geoAiry,
  geoAitoff,
  geoArmadillo,
  geoAugust,
  geoBaker,
  geoBerghaus,
  geoBertin1953,
  geoBoggs,
  geoBonne,
  geoBottomley,
  geoBromley,
  geoChamberlinAfrica,
  geoCollignon,
  geoCraig,
  geoCraster,
  geoCylindricalEqualArea,
  geoCylindricalStereographic,
  geoEckert1,
  geoEckert2,
  geoEckert3,
  geoEckert4,
  geoEckert5,
  geoEckert6,
  geoEisenlohr,
  geoFahey,
  geoFoucaut,
  geoFoucautSinusoidal,
  geoGilbert,
  geoGingery,
  geoGinzburg4,
  geoGinzburg5,
  geoGinzburg6,
  geoGinzburg8,
  geoGinzburg9,
  geoGringorten,
  geoGringortenQuincuncial,
  geoGuyou,
  geoHammer,
  geoHammerRetroazimuthal,
  geoHealpix,
  geoHill,
  geoHomolosine,
  geoHufnagel,
  geoHyperelliptical,
  geoInterruptedBoggs,
  geoInterruptedHomolosine,
  geoInterruptedMollweide,
  geoInterruptedMollweideHemispheres,
  geoInterruptedQuarticAuthalic,
  geoInterruptedSinuMollweide,
  geoInterruptedSinusoidal,
  geoKavrayskiy7,
  geoLagrange,
  geoLarrivee,
  geoLaskowski,
  geoLittrow,
  geoLoximuthal,
  geoMiller,
  geoModifiedStereographicAlaska,
  geoModifiedStereographicGs48,
  geoModifiedStereographicGs50,
  geoModifiedStereographicLee,
  geoModifiedStereographicMiller,
  geoMtFlatPolarParabolic,
  geoMtFlatPolarQuartic,
  geoMtFlatPolarSinusoidal,
  geoNaturalEarth2,
  geoNellHammer,
  geoNicolosi,
  geoPatterson,
  geoPeirceQuincuncial,
  geoPolyconic,
  geoPolyhedralButterfly,
  geoPolyhedralCollignon,
  geoPolyhedralWaterman,
  geoRectangularPolyconic,
  geoRobinson,
  geoSatellite,
  geoSinuMollweide,
  geoSinusoidal,
  geoTimes,
  geoTwoPointAzimuthalUsa,
  geoTwoPointEquidistantUsa,
  geoVanDerGrinten,
  geoVanDerGrinten2,
  geoVanDerGrinten3,
  geoVanDerGrinten4,
  geoWagner,
  geoWagner4,
  geoWagner6,
  geoWagner7,
  geoWiechel,
  geoWinkel3
} from 'd3-geo-projection';

projection('airy', geoAiry);
projection('aitoff', geoAitoff);
projection('armadillo', geoArmadillo);
projection('august', geoAugust);
projection('baker', geoBaker);
projection('berghaus', geoBerghaus);
projection('bertin1953', geoBertin1953);
projection('boggs', geoBoggs);
projection('bonne', geoBonne);
projection('bottomley', geoBottomley);
projection('bromley', geoBromley);
projection('chamberlinAfrica', geoChamberlinAfrica);
projection('collignon', geoCollignon);
projection('craig', geoCraig);
projection('craster', geoCraster);
projection('cylindricalEqualArea', geoCylindricalEqualArea);
projection('cylindricalStereographic', geoCylindricalStereographic);
projection('eckert1', geoEckert1);
projection('eckert2', geoEckert2);
projection('eckert3', geoEckert3);
projection('eckert4', geoEckert4);
projection('eckert5', geoEckert5);
projection('eckert6', geoEckert6);
projection('eisenlohr', geoEisenlohr);
projection('fahey', geoFahey);
projection('foucaut', geoFoucaut);
projection('foucautSinusoidal', geoFoucautSinusoidal);
projection('gilbert', geoGilbert);
projection('gingery', geoGingery);
projection('ginzburg4', geoGinzburg4);
projection('ginzburg5', geoGinzburg5);
projection('ginzburg6', geoGinzburg6);
projection('ginzburg8', geoGinzburg8);
projection('ginzburg9', geoGinzburg9);
projection('gringorten', geoGringorten);
projection('gringortenQuincuncial', geoGringortenQuincuncial);
projection('guyou', geoGuyou);
projection('hammer', geoHammer);
projection('hammerRetroazimuthal', geoHammerRetroazimuthal);
projection('healpix', geoHealpix);
projection('hill', geoHill);
projection('homolosine', geoHomolosine);
projection('hufnagel', geoHufnagel);
projection('hyperelliptical', geoHyperelliptical);
projection('interruptedBoggs', geoInterruptedBoggs);
projection('interruptedHomolosine', geoInterruptedHomolosine);
projection('interruptedMollweide', geoInterruptedMollweide);
projection('interruptedMollweideHemispheres', geoInterruptedMollweideHemispheres);
projection('interruptedQuarticAuthalic', geoInterruptedQuarticAuthalic);
projection('interruptedSinuMollweide', geoInterruptedSinuMollweide);
projection('interruptedSinusoidal', geoInterruptedSinusoidal);
projection('kavrayskiy7', geoKavrayskiy7);
projection('lagrange', geoLagrange);
projection('larrivee', geoLarrivee);
projection('laskowski', geoLaskowski);
projection('littrow', geoLittrow);
projection('loximuthal', geoLoximuthal);
projection('miller', geoMiller);
projection('modifiedStereographicAlaska', geoModifiedStereographicAlaska);
projection('modifiedStereographicGs48', geoModifiedStereographicGs48);
projection('modifiedStereographicGs50', geoModifiedStereographicGs50);
projection('modifiedStereographicLee', geoModifiedStereographicLee);
projection('modifiedStereographicMiller', geoModifiedStereographicMiller);
projection('mtFlatPolarParabolic', geoMtFlatPolarParabolic);
projection('mtFlatPolarQuartic', geoMtFlatPolarQuartic);
projection('mtFlatPolarSinusoidal', geoMtFlatPolarSinusoidal);
projection('naturalEarth2', geoNaturalEarth2);
projection('nellHammer', geoNellHammer);
projection('nicolosi', geoNicolosi);
projection('patterson', geoPatterson);
projection('peirceQuincuncial', geoPeirceQuincuncial);
projection('polyconic', geoPolyconic);
projection('polyhedralButterfly', geoPolyhedralButterfly);
projection('polyhedralCollignon', geoPolyhedralCollignon);
projection('polyhedralWaterman', geoPolyhedralWaterman);
projection('rectangularPolyconic', geoRectangularPolyconic);
projection('robinson', geoRobinson);
projection('satellite', geoSatellite);
projection('sinuMollweide', geoSinuMollweide);
projection('sinusoidal', geoSinusoidal);
projection('times', geoTimes);
projection('twoPointAzimuthalUsa', geoTwoPointAzimuthalUsa);
projection('twoPointEquidistantUsa', geoTwoPointEquidistantUsa);
projection('vanDerGrinten', geoVanDerGrinten);
projection('vanDerGrinten2', geoVanDerGrinten2);
projection('vanDerGrinten3', geoVanDerGrinten3);
projection('vanDerGrinten4', geoVanDerGrinten4);
projection('wagner', geoWagner);
projection('wagner4', geoWagner4);
projection('wagner6', geoWagner6);
projection('wagner7', geoWagner7);
projection('wiechel', geoWiechel);
projection('winkel3', geoWinkel3);

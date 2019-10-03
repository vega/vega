import mergeDeep from "./mergeDeep";

export default function mergeConfig(c1, c2) {
  const { signals: s1, ...rc1 } = c1;
  const { signals: s2, ...rc2 } = c2;

  const sMap = {};
  for (const signals of [s1, s2]) {
    for (const s of signals || []) {
      sMap[s.name] = s;
    }
  }
  const signals = Object.values(sMap);

  return {
    ...mergeDeep({}, rc1, rc2),
    ...(signals.length > 0 ? { signals } : {})
  };
}

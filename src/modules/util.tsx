import { Entry } from "./types";

export function getEntries<T extends Record<string, unknown>>(
  obj: T
): Entry<T>[] {
  return Object.entries(obj) as Entry<T>[];
}

export const updateNth = function <T>(
  list: readonly T[],
  nth: number,
  updater: Partial<T>
) {
  return [
    ...list.slice(0, nth),
    { ...list[nth], ...updater },
    ...list.slice(nth + 1),
  ];
};

export const getRandomInt = (max: number) => {
  return Math.floor(Math.random() * max);
};

export const combinedGen = function* <T>(gen_resets: (() => Generator<T>)[]) {
  let mygen = gen_resets.map((gg) => gg());
  let results = mygen.map((g) => {
    const nx = g.next();
    if (nx.done) {
      console.log("Empty Generator!");
      throw nx;
    } else {
      return nx.value;
    }
  });
  //console.log(results);
  const increment = (digit: number): boolean => {
    if (digit >= mygen.length) return false;
    const result = mygen[digit].next();
    results[digit] = result.value;
    if (result.done) {
      if (increment(digit + 1)) {
        mygen[digit] = gen_resets[digit]();
        results[digit] = mygen[digit].next().value;
        return true; //リセット直後のnext()は素通し
      }
      return false; //incrementに失敗した→下位桁に伝播
    }
    return true;
  };
  while (true) {
    yield [...results];
    if (!increment(0)) break;
  }
};

export const unique_and_less_filter = <S, T>(arg: S[], map: (s: S) => T[]) => {
  const a = arg.map(map);
  return arg.filter((a1, i1) =>
    a.every((p2, i2) => {
      const union_size = new Set([...a[i1], ...p2]).size;
      return (
        union_size > p2.length || (union_size === a[i1].length && i1 >= i2)
      );
    })
  );
};

export const sum = (arg: number[]) => arg.reduce((p, c) => p + c, 0);
export const nCr_count = (n: number, r: number) => {
  let n_prod = 1;
  let r_prod = 1;
  for (let i = 0; i < r; i++) {
    n_prod *= n - i;
    r_prod *= r - i;
  }
  return n_prod / r_prod;
};
export const getRange = (arg: number[]) => ({
  max: Math.max(...arg),
  min: Math.min(...arg),
});
export const keyMap = <V, R>(
  src: { readonly [key in keyof V]: V[keyof V] },
  fn: (key: keyof V, val: V[keyof V]) => R
): { readonly [key in keyof V]: R } => {
  return getEntries(src)
    .map(([k, v]) => ({ [k]: fn(k, v) }))
    .reduce((prev, now) => ({ ...prev, ...now }), {}) as {
    readonly [key in keyof V]: R;
  }; // くっ
};

// adjust: aとbが同じペアに含まれてもよいかを与える
export const make_pair = function* <T>(
  ary: T[],
  size: number,
  adjust?: (a: T, b: T) => boolean
): Generator<T[]> {
  if (size === 0) {
    yield [];
  }
  if (ary.length === 0 || size <= 0) return;
  const first = ary[0];
  const rest = ary.slice(1);
  const filtered = adjust ? ary.filter((r) => adjust(first, r)) : rest;
  //先頭要素を含まないsize個の組み合わせ
  yield* make_pair(rest, size, adjust);
  //先頭要素を含むsize個の組み合わせ
  for (const p of make_pair(filtered, size - 1, adjust)) {
    yield [first, ...p];
  }
};

const make_pair_to_n = function* <T>(
  ary: T[],
  max_size: number
): Generator<T[]> {
  for (let i = 0; i < max_size + 1; i++) {
    yield* make_pair(ary, i);
  }
};

export const make_k_pair_to_n = function* <T>(
  ary: T[],
  k_pairs: number,
  max_size: number
): Generator<T[][]> {
  const dist = [...make_pair_to_n(ary, max_size)];
  yield* make_pair(dist, k_pairs, (a, b) => !a.some((e) => b.includes(e)));
};

export const findByID = <T extends { id: string }>(
  id: string,
  src: readonly T[],
  nFound: T
) => {
  return src.find((m) => m.id === id) ?? nFound;
};

export const callAsInt = (arg: string, fn: (x: number) => void) => {
  const parsed = parseInt(arg);
  if (!isNaN(parsed)) {
    fn(parsed);
  }
};

export const addSep = <T,>(ary: T[], sep: T) => {
  return ary.flatMap((a) => [sep, a]).slice(1);
};

export const DLTextButton = (prop: {
  filename: string;
  label: string;
  getText: () => string;
}) => {
  return (
    <button
      onClick={() => {
        const secret = prop.getText();
        const file = new Blob([secret], { type: "text/plain" });
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = prop.filename;
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      {prop.label}
    </button>
  );
};
import { make_pair, make_k_pair_to_n, nCr_count } from '../../src/modules/PCForm'

describe("nCr_count", ()=>{
  test("6C2は15である", () => {
    const n = 6;
    const r = 2;
    const nCr = nCr_count(n, r);
    expect(nCr).toBe(15);
  });
});

describe("make_pair", ()=>{
  test("make_pairで作られるペアは全て指定した大きさを持つ", () => {
    const ary = [1, 2, 3, 4];
    const k = 2;
    for(const p of make_pair(ary, k)){
      expect(p.length).toBe(k);
    }
  });

  test("make_pairで作られるペアはnCk個存在する", () => {
    const ary = [1, 2, 3, 4];
    const k = 2;
    const nck = nCr_count(ary.length, k)
    expect([...make_pair(ary, k)].length).toBe(nck)
  });
});

describe("make_k_pair_to_n", ()=>{
  test("make_k_pair_to_nで作られるペアは全て指定した大きさを持つ", () => {
    const ary = [1, 2, 3, 4];
    const k = 2;
    const n = 2;
    for(const ps of make_k_pair_to_n(ary, k, n)){
      expect(ps.length).toBe(k);
    }
  });

  test("make_k_pair_to_nで作られるペアの要素は重複しない", () => {
    const ary = [1, 2, 3, 4];
    const k = 2;
    const n = 2;
    for(const ps of make_k_pair_to_n(ary, k, n)){
      const flatten = ps.flatMap((p)=>p)
      expect(new Set(flatten).size).toBe(flatten.length);
    }
  });

  test("make_k_pair_to_nで生成されるペアは、要素数0の配列を1つだけ含む", () => {
    const ary = [1, 2, 3, 4];
    const k = 2;
    const n = 2;
    let count = new Array(ary.length+1).fill(0);
    for(const ps of make_k_pair_to_n(ary, k, n)){
      const flatten = ps.flatMap((p)=>p)
      count[flatten.length]++;
    }
    expect(count[0]).toBe(1)
  });
});
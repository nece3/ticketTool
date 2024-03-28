import { createElement, useEffect, useMemo, useState } from "react";
import { Character, PCData, secTypes, SecSelect } from "./secrets"
import { secret_nomination_prefix, secret_nomination_sep, secrets } from "./secrets";
import { get_secret_text, secret_prefix } from "./secrets";

type ArrayCounterProp<T> = {
  readonly array: readonly T[];
  readonly add: () => void;
  readonly delete: () => void;
};

type CharacterCheck = {
  [key: string]: boolean;
};

type secCheck = {
  select: boolean;
  extra: CharacterCheck[];
};

type NPCData = {
  readonly myCharacter: Character;
  readonly target: CharacterCheck;
  readonly secret: {
    [key in secTypes]: secCheck;
  };
};

type result = {
  npcs: PCData[];
  ticket_type: number;
  groups: battleGroup[];
  battle_type: battleType;
  proportion: groups_proportion;
};



type refreshProp = Partial<
  Readonly<{
    pcListArg: readonly PCData[];
    npcListArg: readonly NPCData[];
  }>
>;

type memberRecord = Record<string, Character>;

type Entry<T> = keyof T extends infer U
  ? U extends keyof T
    ? [U, T[U]]
    : never
  : never;

type battleTypeKey = keyof typeof vs_variation;
type battleType = (typeof vs_variation)[battleTypeKey];


const get_secret_nomination = (name: string, nominations: secTypes[]) => {
  return (
    secret_prefix(name) +
    [
      secret_nomination_prefix,
      ...nominations.map((t) => "\n" + secrets[t].index + secrets[t].statement),
    ].join(secret_nomination_sep)
  );
};


const DLTextButton = (prop: {
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

const getRandomInt = (max: number) => {
  return Math.floor(Math.random() * max);
};

const NominationArea = () => {
  const [name, setName] = useState("PC1");
  const [nominations, setNominations] = useState<secTypes[]>([]);
  return (
    <div className="tool_section">
      <h2 className="msr_h203">秘密候補決定ツール</h2>
      「選出」ボタンで、秘密候補を決定します。
      <br />
      候補(A)が固定で選出され、残り3つがランダムに選出されます。
      <hr />
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button
        onClick={() => {
          const fixed = ["A"] as const;
          const count = 3;
          let result: secTypes[] = [];
          let rest = getEntries(secrets)
            .map(([k, _]) => k)
            .filter((k) => !(fixed as readonly string[]).includes(k));
          for (let i = 0; i < count; i++) {
            const r = getRandomInt(rest.length);
            result.push(rest[r]);
            rest.splice(r, 1);
          }
          setNominations([...fixed, ...result.sort()]);
        }}
      >
        選出
      </button>
      {nominations.length > 0 ? (
        <div>
          結果:
          <br />
          {nominations.map((t) => secrets[t].name).join(" / ")}
          <br />
          <DLTextButton
            getText={() => get_secret_nomination(name, nominations)}
            filename={`${name}_秘密.txt`}
            label="秘密候補DL"
          />
        </div>
      ) : null}
    </div>
  );
};

const DLSecretButton = (prop: { data: PCData }) => {
  return (
    <DLTextButton
      getText={() => get_secret_text(prop.data)}
      filename={`${prop.data.myCharacter.name}_秘密.txt`}
      label="秘密DL"
    />
  );
};

const ArrayCounter = <T,>(prop: ArrayCounterProp<T>) => {
  return (
    <div>
      <span className="buttonSpace">
        <button onClick={prop.delete}>-</button>
      </span>
      <span>{prop.array.length}</span>
      <span className="buttonSpace">
        <button onClick={prop.add}>+</button>
      </span>
    </div>
  );
};

const getCharacters = (arg: {
  readonly pArray: readonly PCData[];
  readonly nArray: readonly NPCData[];
}) => {
  return [
    ...arg.pArray.map((p) => p.myCharacter),
    ...arg.nArray.map((n) => n.myCharacter),
  ];
};

const getCharacterRecord = (arg: { characters: Character[] }) => {
  return arg.characters.reduce(
    (prev, current) => ({ ...prev, [current.id]: current }),
    {}
  );
};

const updateNth = function <T>(
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

const charaGen = function* (
  cc: CharacterCheck,
  members: memberRecord,
  all: boolean
) {
  //console.log(members)
  //console.log(cc)
  for (const [id, c] of getEntries(members)) {
    if (cc[id] || !(cc[id] ?? !all)) {
      yield c;
    }
  }
};

const combinedGen = function* <T>(gen_resets: (() => Generator<T>)[]) {
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

function getEntries<T extends Record<string, unknown>>(obj: T): Entry<T>[] {
  return Object.entries(obj) as Entry<T>[];
}

const filteredMembers = (
  me: Character,
  members: memberRecord,
  filter: (i: Character) => (u: Character) => boolean
): memberRecord => {
  const f = filter(me);
  return getEntries(members)
    .filter(([_, c]) => f(c))
    .reduce((prev, current) => ({ ...prev, [current[0]]: current[1] }), {});
};

const getPCDataGen = function* (
  d: NPCData,
  members: memberRecord,
  all: boolean
): Generator<PCData> {
  for (const s of getEntries(d.secret)) {
    const [s_id, { select, extra }] = s;
    if (select || all) {
      const target_dist = filteredMembers(
        d.myCharacter,
        members,
        secrets[s_id].target
      );
      //console.log(target_dist);
      for (const target of charaGen(d.target, target_dist, all)) {
        const data = { myCharacter: d.myCharacter, target };
        if (extra.length > 0) {
          for (const ex of combinedGen(
            extra.map(
              (cc, i) => () =>
                charaGen(
                  cc,
                  filteredMembers(
                    d.myCharacter,
                    members,
                    secrets[s_id].extra[i]
                  ),
                  all
                )
            )
          )) {
            yield {
              ...data,
              secret: { key: s_id, extra: ex },
            };
          }
        } else {
          yield {
            ...data,
            secret: { key: s_id, extra: [] },
          };
        }
      }
    }
  }
};

const unique_and_less_filter = <S, T>(arg: S[], map: (s: S) => T[]) => {
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

const sum = (arg: number[]) => arg.reduce((p, c) => p + c, 0);
export const nCr_count = (n: number, r: number) => {
  let n_prod = 1;
  let r_prod = 1;
  for (let i = 0; i < r; i++) {
    n_prod *= n - i;
    r_prod *= r - i;
  }
  return n_prod / r_prod;
};

type range = {
  min: number,
  max: number
}


type groups_proportion = {
  member_count: number,
  apr: range,
  str: range,
  len: range,
  groups: number,
}

const vs_variation = {
  vs: {
    id: "vs",
    name: "対立型",
    detail: "何人かずつの陣営に分かれた状態。",
    valid: true,
    className: "bt_vs",
  },
  coop: {
    id: "coop",
    name: "協力型",
    detail: "1人の陣営と、その他全員からなる陣営に分かれた状態。",
    valid: true,
    className: "bt_coop",
  },
  br: {
    id: "br",
    name: "BR型",
    detail: "上位1人を決めるために、全員が対等に争う状態。",
    valid: true,
    className: "bt_br",
  },
  sp_vs: {
    id: "sp_vs",
    name: "変則対立型",
    detail: "何人かずつの陣営に分かれた状態。所属できる陣営には自由度がある。",
    valid: true,
    className: "bt_sp_vs",
  },
  sp_br: {
    id: "sp_br",
    name: "変則BR型",
    detail: "上位何人かを決めるために、全員が対等に争う状態。",
    valid: true,
    className: "bt_sp_br",
  },
  apr_err: {
    id: "apr_err",
    name: "自由度不備",
    detail: "陣営選択の自由度に差がある",
    valid: false,
    className: "",
  },
  str_err: {
    id: "str_err",
    name: "戦力不備",
    detail: "戦力に差がある",
    valid: false,
    className: "",
  },
  grp1_err: {
    id: "grp1_err",
    name: "陣営数不備",
    detail: "陣営が1つしかない",
    valid: false,
    className: "",
  },
} as const;

const getRange = (arg:number[])=>({ max: Math.max(...arg), min: Math.min(...arg) })

const get_proportion = (dist: PCData[][], members: PCData[]) : groups_proportion => {
  let appear_counts: { [key: string]: number } = {};
  members.map((m) => {
    appear_counts[m.myCharacter.id] = 0;
  });
  // PCごとの出現回数を数える
  dist.map((cs) =>
    cs.map((c) => {
      const id = c.myCharacter.id;
      if (id in appear_counts) {
        appear_counts[id]++;
      } else {
        console.log(`members不適の恐れ: [${id}] が次の中にありません`);
        console.log(members);
        appear_counts[id] = 1;
      }
    })
  );
  const apr = getRange(Object.values(appear_counts));
  // グループごとの戦力を数える
  const str = getRange(dist.map((group)=>sum(group.map((m) => m.myCharacter.strength))));
  //グループごとの長さを数える
  const len = getRange(dist.map((group) => group.length));
  const groups = dist.length;
  const member_count = members.length
  return { apr, str, len, groups, member_count }
}

const distribution_suits = (p: groups_proportion) => {
  if (p.groups === 1) return vs_variation.grp1_err;
  if (p.apr.max !== p.apr.min) return vs_variation.apr_err;
  if (p.groups === 2 && p.len.min === 1) return vs_variation.coop;
  if (p.str.max !== p.str.min) return vs_variation.str_err;
  if (p.apr.max === 1) {
    if (p.len.max === 1) {
      return vs_variation.br;
    } else {
      return vs_variation.vs;
    }
  } else {
    if (p.len.max === p.len.min && p.groups === nCr_count(p.member_count, p.len.max)) {
      return vs_variation.sp_br;
    }
    return vs_variation.sp_vs;
  }
};

type distribution = {
  [key in battleTypeKey]: number;
};

const keyMap = <V, R>(
  src: { readonly [key in keyof V]: V[keyof V] },
  fn: (key: keyof V, val: V[keyof V]) => R
): { readonly [key in keyof V]: R } => {
  return getEntries(src)
    .map(([k, v]) => ({ [k]: fn(k, v) }))
    .reduce((prev, now) => ({ ...prev, ...now }), {}) as {
    readonly [key in keyof V]: R;
  }; // くっ
};

type vsFilterType = {
  [k in keyof typeof vs_variation]: boolean;
};

const dist_init = () => keyMap(vs_variation, (_) => 0);

const Abstruct = () => (
  <div className="tool_section">
    <h2 className="msr_h203">概要</h2>
    シノビガミ「ドリーム・チケット」のGM用ツールです。
    <br />
    「秘密候補」の決定、調整役の「秘密」の決定、それらのテキストダウンロードが可能です。
  </div>
);

export const PageBody = () => {
  return (
    <>
      <Abstruct />
      <NominationArea />
      <SecretTool />
    </>
  );
};
const SecretTool = () => {
  const [pcList, setPCList] = useState<PCData[]>([]);
  const [loadFinished, setLoadFinished] = useState(false);
  const [npcList, setNPCList] = useState<NPCData[]>([]);
  const [time, setTime] = useState<number>(0);
  const [distributions, setDistributions] = useState<distribution>(dist_init());
  const [results, setResults] = useState<result[]>([]);
  const [vsFilter, setVsFilter] = useState<vsFilterType>(
    keyMap<typeof vs_variation, boolean>(vs_variation, (_, v) => v.valid)
  );
  const members = getCharacters({ pArray: pcList, nArray: npcList });
  const memberRecord = useMemo(
    () => getCharacterRecord({ characters: members }),
    [members]
  );
  const filtered_results = useMemo(
    () =>
      results.filter(
        (r) =>
          vsFilter[r.battle_type.id] &&
          r.npcs.every((n, i) => i >= npcList.length || dataMet(n, npcList[i]))
      ),
    [results, npcList, vsFilter]
  );
  useEffect(() => {
    if (!loadFinished) {
      const loadedPcList = localStorage.getItem("pcList");
      const loadedNpcList = localStorage.getItem("npcList");
      //XXX 自分しか使わんはずのlocalStrage内容をパースするの糞めんどいから許して
      const pcListArg = loadedPcList
        ? (JSON.parse(loadedPcList) as PCData[])
        : undefined;
      const npcListArg = loadedNpcList
        ? (JSON.parse(loadedNpcList) as NPCData[])
        : undefined;
      refresh({ pcListArg, npcListArg });
      setLoadFinished(true);
    }
  }, [loadFinished]);
  const refresh = (prop: refreshProp) => {
    let { pcListArg, npcListArg } = prop;
    pcListArg ??= pcList;
    npcListArg ??= npcList;
    const after_char = getCharacters({ pArray: pcListArg, nArray: npcListArg });
    const validatedPClist = pcListArg.map((p) => validatedPC(p, after_char));
    const validatedNPClist = npcListArg.map((p) =>
      newOrVerifyNPC(after_char, 0, p)
    );
    setPCList(validatedPClist);
    setNPCList(validatedNPClist);
    localStorage.setItem("pcList", JSON.stringify(validatedPClist));
    localStorage.setItem("npcList", JSON.stringify(validatedNPClist));
  };
  return (
    <div className="tool_section">
      <h2 className="msr_h203">秘密決定ツール</h2>
      PCの秘密の状態に合わせて以下を編集したのち、 <br />
      「候補表示」ボタンを押すとNPCの秘密候補を表示します。<br />
      ここでいう「戦力」は、中忍が1, 上忍が2程度とします。
      <hr />
      <div>
        PC数:
        <PCForm
          dataList={pcList}
          setDataList={(pcListArg) => refresh({ pcListArg })}
          members={members}
        />
      </div>
      <div>
        NPC:
        <ArrayCounter
          array={npcList}
          add={() => {
            refresh({
              npcListArg: [
                ...npcList,
                newOrVerifyNPC(members, npcList.length + 1),
              ],
            });
          }}
          delete={() => {
            refresh({ npcListArg: npcList.slice(0, npcList.length - 1) });
          }}
        />
        {npcList.map((c, i) => (
          <NPCInput
            key={"input_" + c.myCharacter.id}
            myData={c}
            members={memberRecord}
            modifyNPC={(n) => {
              //console.log(n);
              refresh({ npcListArg: updateNth(npcList, i, n) });
            }}
          />
        ))}
      </div>
      <div>
        分類:
        <br />
        <VsFilterChecks data={vsFilter} setFilter={setVsFilter} />
      </div>
      <div>
        <button
          onClick={() => {
            calc_battle_conditions({
              pcList,
              npcList,
              memberRecord,
              report: (data) => {
                setTime(data.time);
                setDistributions(data.distribution);
                if (data.done) setResults(data.results);
              },
              all: true,
            });
          }}
        >
          候補表示
        </button>
      </div>
      {results.length > 0 ? (
        <>
          <ResultCounter
            time={time}
            distributions={distributions}
            count={filtered_results.length}
            all={count_condition(npcList, members, 2)}
          />
          <ResultTable data={filtered_results} />
        </>
      ) : null}
    </div>
  );
};

const VsFilterChecks = (prop: {
  data: vsFilterType;
  setFilter: (arg: vsFilterType) => void;
}) => {
  return (
    <span>
      {getEntries(vs_variation)
        .filter(([_, v]) => v.valid)
        .map(([k, v]) => (
          <span key={k} title={v.detail}>
            {v.name}
            <input
              type="checkbox"
              checked={prop.data[k]}
              onChange={(e) =>
                prop.setFilter({ ...prop.data, [k]: e.target.checked })
              }
            />{" "}
          </span>
        ))}
    </span>
  );
};

const count_condition = (
  npcs: NPCData[],
  members: Character[],
  ticket_pattern_count: number
) => {
  const cases = npcs.map((n) => {
    const me = n.myCharacter;
    return sum(
      getEntries(n.secret).map(([type, _]) => {
        const ex = secrets[type].extra.map(
          (e) => members.filter((m) => e(me)(m)).length
        );
        return (
          members.filter((m) => secrets[type].target(me)(m)).length *
          (ex.length > 0 ? sum(ex) : 1)
        );
      })
    );
  });
  return ticket_pattern_count * cases.reduce((prev, v) => prev * v, 1);
};

type calcArg = {
  npcList: NPCData[];
  pcList: PCData[];
  memberRecord: memberRecord;
};

interface reportArg {
  results: result[];
  time: number;
  distribution: distribution;
  done: boolean;
}

async function calc_battle_conditions(
  arg: calcArg & { report: (arg: reportArg) => void; all: boolean }
) {
  const sleep = (time: number) =>
    new Promise((resolve) => setTimeout(resolve, time)); //timeはミリ秒
  const { npcList, pcList, memberRecord } = arg;
  let distribution: distribution = dist_init();
  const gen = combinedGen(
    npcList.map((d) => () => getPCDataGen(d, memberRecord, arg.all))
  );
  const interval = 1000;
  let results: result[] = [];
  let start_time = Date.now();
  let reported = start_time;
  for (const npcs of gen) {
    const members = [...pcList, ...npcs];
    const ticket_types = [1, 2];
    for (const ticket_type of ticket_types) {
      const groups = getGroups(members, ticket_type);
      const proportion = get_proportion(
        groups.map((g) => g.members),
        members
      )
      const battle_type = distribution_suits(proportion);
      if (battle_type.valid) {
        results.push({
          npcs,
          battle_type,
          ticket_type,
          groups,
          proportion,
        });
      }
      distribution[battle_type.id]++;
      const now = Date.now();
      if (now > reported + interval) {
        arg.report({
          results,
          distribution,
          time: now - start_time,
          done: false,
        });
        await sleep(1);
        reported = now;
      }
    }
  }
  //console.log(results);
  arg.report({
    results,
    distribution,
    time: Date.now() - start_time,
    done: true,
  });
}

const dataMet = (data: PCData, condition: NPCData) => {
  return (
    condition.target[data.target.id] &&
    condition.secret[data.secret.key].select &&
    condition.secret[data.secret.key].extra.every(
      (ex, i) => ex[data.secret.extra[i].id]
    )
  );
};

const ResultCounter = (prop: {
  time: number;
  distributions: distribution;
  count: number;
  all: number;
}) => {
  return (
    <div>
      <span>
        該当{prop.count}件 / 計算済み{sum(Object.values(prop.distributions))}件
        / 全{prop.all}件
      </span>
      <span>({prop.time}ms)</span>
    </div>
  );
};

type battleGroup = {
  members: PCData[];
  target_pairs: Character[][];
};

const getGroups = (members: PCData[], ticket: number): battleGroup[] => {
  let admitted: battleGroup[] = [];
  for (const pairs of make_k_pair_to_n(
    members.map((c) => c.myCharacter),
    ticket,
    2
  )) {
    // console.log("pair:");
    // console.log(pairs);
    const cond = members.filter((me) =>
      secrets[me.secret.key].admit({ me, members, pairs })
    );
    admitted.push({ members: cond, target_pairs: pairs });
    // console.log("admit:");
    // console.log(cond)
  }
  return unique_and_less_filter(admitted, (a) => a.members);
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

const ResultTable = (prop: { data: result[] }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>候補キャラクター</th>
          <th>ペア上限</th>
          <th>対立状態</th>
          <th>分類</th>
        </tr>
      </thead>
      <tbody>
        {prop.data.map((r, i) => (
          <tr key={"result_" + i}>
            <td>{i + 1}</td>
            <td className="result_table">
              <PCDataElements data={r.npcs} />
            </td>
            <td className="result_table">{r.ticket_type}</td>
            <td className="result_table">
              <GroupsElement groups={r.groups} proportion={r.proportion} />
            </td>
            <td className="result_table">
              <BattleTypeElement type={r.battle_type} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const BattleTypeElement = (prop: { type: battleType }) => {
  return <span className={prop.type.className}>{prop.type.name}</span>;
};

const GroupsElement = (prop: { groups: battleGroup[], proportion: groups_proportion }) => {
  return (
    <span>
      {addSep(
        prop.groups.map((group) => {
          const pairs_any_exist = group.target_pairs.filter(
            (pair) => pair.length > 0
          );
          const pair_comment =
            pairs_any_exist.length > 0
              ? pairs_any_exist
                  .map((pair) => `(${pair.map((c) => c.name).join(",")})`)
                  .join(" + ")
              : "なし";
          const str_short = prop.proportion.str.max - sum(group.members.map((d)=>d.myCharacter.strength))
          return (
            <span>
              <span title={`【ペア内容: ${pair_comment}】`}>
                {group.members.map((c) => c.myCharacter.name).join(",")}
              </span>
              { str_short > 0 ? <span title={`この陣営には戦力が不足しています。\n合計で戦力+${str_short}相当のプライズを持たせてください。`}>
                【+{str_short}】</span> : null }
            </span>
          );
        }),
        <span className="sep_vs"> vs </span>
      )}
    </span>
  );
};

const PCDataElements = (prop: { data: PCData[] }) => {
  return (
    <div>
      {addSep(
        prop.data.map((d) => <PCDataElement data={d} />),
        <br />
      )}
    </div>
  );
};

const addSep = <T,>(ary: T[], sep: T) => {
  return ary.flatMap((a) => [sep, a]).slice(1);
};

const PCDataElement = (prop: { data: PCData }) => {
  return (
    <span>
      {`${prop.data.myCharacter.name}: 使命[${
        secrets[prop.data.secret.key].name
      }] 相手[${prop.data.target.name}]` +
        (prop.data.secret.extra.length > 0
          ? ` 追加[${prop.data.secret.extra
              .map((e, i) => `(※${i + 2})=` + e.name)
              .join(" / ")}]`
          : "")}
      <DLSecretButton data={prop.data} />
    </span>
  );
};

type PCFormProp = {
  dataList: readonly PCData[];
  setDataList: (arg: PCData[]) => void;
  members: Character[];
};

const PCForm = (prop: PCFormProp) => {
  const { dataList, setDataList } = prop;
  const add = () => {
    setDataList([...dataList, newPCData(prop.members, dataList.length + 1)]);
  };
  const remove = () => {
    setDataList(dataList.slice(0, dataList.length - 1));
  };
  return (
    <>
      <ArrayCounter<PCData> array={dataList} add={add} delete={remove} />
      <table>
        <tbody>
          {dataList.map((p, i) => (
            <PCInput
              key={"input_" + p.myCharacter.id}
              set={(np) => setDataList(updateNth(dataList, i, np))}
              myData={p}
              all={prop.members}
            />
          ))}
        </tbody>
      </table>
    </>
  );
};

const findByID = <T extends { id: string }>(
  id: string,
  src: readonly T[],
  nFound: T
) => {
  return src.find((m) => m.id === id) ?? nFound;
};

const callAsInt = (arg: string, fn: (x: number) => void) => {
  const parsed = parseInt(arg);
  if (!isNaN(parsed)) {
    fn(parsed);
  }
};

const PCInput = (prop: {
  set: (arg: Partial<PCData>) => void;
  readonly myData: PCData;
  readonly all: Character[];
}) => {
  const mKey = prop.myData.secret.key;
  const secTarget = prop.all.filter((p) =>
    secrets[mKey].target(prop.myData.myCharacter)(p)
  );
  const changeID = (members: readonly Character[], nth: number, id: string) => {
    const sec = prop.myData.secret;
    prop.set({
      secret: {
        ...sec,
        extra: updateNth(sec.extra, nth, findByID(id, members, sec.extra[nth])),
      },
    });
  };
  return (
    <tr>
      <td>
        <span>名前:</span>
        <input
          value={prop.myData.myCharacter.name}
          onChange={(e) =>
            prop.set({
              myCharacter: { ...prop.myData.myCharacter, name: e.target.value },
            })
          }
        />
      </td>
      <td>
        <span>戦力:</span>
        <input
          value={prop.myData.myCharacter.strength}
          type="number"
          maxLength={3}
          onChange={(e) =>
            callAsInt(e.target.value, (strength) => {
              prop.set({
                myCharacter: { ...prop.myData.myCharacter, strength },
              });
            })
          }
        />
      </td>
      <td>
        <span>相手:</span>
        <select
          value={prop.myData.target?.id ?? undefined}
          onChange={(e) =>
            prop.set({
              target: findByID(e.target.value, secTarget, prop.myData.target),
            })
          }
        >
          <option hidden>※不正値</option>
          {secTarget.map((pc) => (
            <option
              value={pc.id}
              key={"opt_" + prop.myData.myCharacter.id + "_tgt_" + pc.id}
            >
              {pc.name}
            </option>
          ))}
        </select>
      </td>
      <td>
        <span>使命:</span>
        <select
          value={mKey}
          title={"【使命】: " + secrets[mKey].detail}
          onChange={(e) =>
            prop.set(
              validatedPC(prop.myData, prop.all, e.target.value as secTypes)
            )
          }
        >
          <option hidden>※不正値</option>
          {validKeys(prop.myData.myCharacter, prop.all).map((k) => (
            <option
              value={k}
              key={"opt_" + prop.myData.myCharacter.id + "_sec_" + k}
            >
              {secrets[k].name}
            </option>
          ))}
        </select>
      </td>
      <td>
        {secrets[mKey].extra.map((cond, i) => {
          const members = prop.all.filter((p) =>
            cond(prop.myData.myCharacter)(p)
          );
          return (
            <>
              <AdditionalSelector
                mappedMembers={members}
                changeID={(arg) => changeID(members, i, arg)}
                myData={prop.myData}
                nth={i}
              />
            </>
          );
        })}
      </td>
      <td>
        <DLSecretButton data={prop.myData} />
      </td>
    </tr>
  );
};

const TargetCheckBox = (prop: {
  check: CharacterCheck;
  members: memberRecord;
  setTargetCheck: (chk: { [k: string]: boolean }) => void;
}) => {
  return (
    <>
      {getEntries(prop.check).map(([k, v]) => (
        <span key={k}>
          {prop.members[k]?.name ?? k}
          <input
            type="checkbox"
            checked={v}
            onChange={(e) => prop.setTargetCheck({ [k]: e.target.checked })}
          />{" "}
        </span>
      ))}
    </>
  );
};

const NPCInput = (prop: {
  readonly myData: NPCData;
  members: memberRecord;
  modifyNPC: (n: Partial<NPCData>) => void;
}) => {
  const setName = (name: string) =>
    prop.modifyNPC({ myCharacter: { ...prop.myData.myCharacter, name } });
  const setStrength = (strength: number) =>
    prop.modifyNPC({ myCharacter: { ...prop.myData.myCharacter, strength } });
  const setTarget = (target: CharacterCheck) => prop.modifyNPC({ target });
  const setTargetCheck = (chk: { [k: string]: boolean }) => setTarget(chk);
  const modifySelect = (id: secTypes, check: Partial<secCheck>) =>
    prop.modifyNPC({
      secret: {
        ...prop.myData.secret,
        [id]: { ...prop.myData.secret[id], ...check },
      },
    });
  const setSecretCheck = (id: secTypes, select: boolean) =>
    modifySelect(id, { select });
  const modifyNthExtra = (
    id: secTypes,
    chk: Partial<CharacterCheck>,
    nth: number
  ) =>
    modifySelect(id, {
      extra: [...updateNth(prop.myData.secret[id].extra, nth, chk)],
    });

  return (
    <div>
      <div>
        <span>名前: </span>
        <input
          value={prop.myData.myCharacter.name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <span>戦力: </span>
        <input
          value={prop.myData.myCharacter.strength}
          type="number"
          size={3}
          onChange={(e) => {
            const x = parseInt(e.target.value);
            if (!isNaN(x)) {
              setStrength(x);
            }
          }}
        />
      </div>
      <div>
        <span>相手: </span>
        <TargetCheckBox
          check={prop.myData.target}
          members={prop.members}
          setTargetCheck={setTargetCheck}
        />
      </div>
      <div>
        <span>使命: </span>
        {getEntries(prop.myData.secret).map(([id, secret]) => (
          <span key={prop.myData.myCharacter.id + id}>
            <span title={"【使命】: " + secrets[id].detail}>
              {secrets[id].name}
              <input
                type="checkbox"
                checked={secret.select}
                onChange={(e) => setSecretCheck(id, e.target.checked)}
              />
            </span>
            {secrets[id].extra.length > 0 ? (
              <>
                {secrets[id].extra.map((cond, i) => (
                  <span key={i}>
                    ({i > 0 ? " / " : null}
                    {`※${i + 2}: `}
                    {
                      <TargetCheckBox
                        check={secret.extra[i]}
                        members={filteredMembers(
                          prop.myData.myCharacter,
                          prop.members,
                          cond
                        )}
                        setTargetCheck={(chk) => modifyNthExtra(id, chk, i)}
                      />
                    }
                    )
                  </span>
                ))}
              </>
            ) : null}{" "}
          </span>
        ))}
      </div>
    </div>
  );
};

const validKeys = (
  myCharacter: Character,
  members: readonly Character[]
): secTypes[] => {
  return (Object.keys(secrets) as secTypes[]).filter(
    (k) => members.filter((m) => secrets[k].target(myCharacter)(m)).length > 0
  );
};

const validatedPC = (
  myData: PCData,
  members: readonly Character[],
  newSecKey?: secTypes
): PCData => {
  const impliedKey = newSecKey ?? myData.secret.key;
  const valid = validKeys(myData.myCharacter, members);
  const key = valid.includes(impliedKey) ? impliedKey : valid[0];
  const targets = members.filter((m) =>
    secrets[key].target(myData.myCharacter)(m)
  );
  const prevTarget = targets.find((c) => c.id === myData.target.id);
  return {
    myCharacter: myData.myCharacter,
    target: prevTarget ?? targets[targets.length - 1],
    secret: {
      key: key,
      extra: secrets[key].extra.map((c, i) => {
        const ex_i_members = members.filter((m) => c(myData.myCharacter)(m));
        const ex_i = ex_i_members.find(
          (c) => c.id === myData.secret.extra[i]?.id
        );
        return ex_i ?? ex_i_members[ex_i_members.length - 1];
      }),
    },
  };
};

const AdditionalSelector = (prop: {
  mappedMembers: readonly Character[];
  myData: PCData;
  nth: number;
  changeID: (arg: string) => void;
}) => {
  return (
    <>
      <span>{`(※${prop.nth + 2}):`}</span>
      <select
        value={prop.myData.secret.extra[prop.nth].id}
        onChange={(e) => prop.changeID(e.target.value)}
      >
        <option hidden>※不正値</option>
        {prop.mappedMembers.map((t) => (
          <option
            value={t.id}
            key={
              "opt_" +
              prop.myData.myCharacter.id +
              "_ex_" +
              prop.nth +
              "_" +
              t.id
            }
          >
            {t.name}
          </option>
        ))}
      </select>
    </>
  );
};

const newOrVerifyNPC = (
  members: readonly Character[],
  new_num: number,
  target?: NPCData
): NPCData => {
  const name = "NPC" + new_num;
  const me = target?.myCharacter ?? { id: name, name: name, strength: 1 };
  if (!target) {
    members = members.concat(me);
  }
  const targetEntries = members
    .filter((c) => Object.entries(secrets).some(([_, v]) => v.target(me)(c)))
    .map((c) => ({ [c.id]: target?.target[c.id] ?? true }));
  let k: NPCData = {
    myCharacter: me,
    target: targetEntries.reduce((prev, now) => ({ ...prev, ...now }), {}),
    secret: keyMap<typeof secrets, secCheck>(secrets, (k, v) => ({
      select: target?.secret[k].select ?? true,
      extra: v.extra.map((cond, i) =>
        members
          .filter((c) => cond(me)(c))
          .map((c) => ({ [c.id]: target?.secret[k].extra[i][c.id] ?? true }))
          .reduce((prev, now) => ({ ...prev, ...now }), {})
      ),
    })),
  };
  return k;
};

const newPCData = (prev: readonly Character[], new_num: number): PCData => {
  const name = "PC" + new_num;
  const me = { id: name, name: name, strength: 1 };
  let k = {
    myCharacter: me,
    target: prev[prev.length - 1],
    secret: { key: "A", extra: [] } as SecSelect,
  };
  if (!k.target) {
    k.target = me;
  }
  return validatedPC(k, [...prev, me]);
};

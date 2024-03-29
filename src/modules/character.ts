import { Character, PCData, secrets, secTypes } from "./secrets";
import { battleGroup, CharacterCheck, groups_proportion, memberRecord, NPCData } from "./types";
import { combinedGen, getEntries, getRange, keyMap, make_k_pair_to_n, nCr_count, sum, unique_and_less_filter } from "./util";
import { vs_variation } from "./vs_variation";

export const dist_init = () => keyMap(vs_variation, (_) => 0);

export const filteredMembers = (
  me: Character,
  members: memberRecord,
  filter: (i: Character) => (u: Character) => boolean
): memberRecord => {
  const f = filter(me);
  return getEntries(members)
    .filter(([_, c]) => f(c))
    .reduce((prev, current) => ({ ...prev, [current[0]]: current[1] }), {});
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

export const getPCDataGen = function* (
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

export const getCharacters = (arg: {
  readonly pArray: readonly PCData[];
  readonly nArray: readonly NPCData[];
}) => {
  return [
    ...arg.pArray.map((p) => p.myCharacter),
    ...arg.nArray.map((n) => n.myCharacter),
  ];
};

export const getCharacterRecord = (arg: { characters: Character[] }) => {
  return arg.characters.reduce(
    (prev, current) => ({ ...prev, [current.id]: current }),
    {}
  );
};

export const get_proportion = (
  dist: PCData[][],
  members: PCData[]
): groups_proportion => {
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
  const str = getRange(
    dist.map((group) => sum(group.map((m) => m.myCharacter.strength)))
  );
  //グループごとの長さを数える
  const len = getRange(dist.map((group) => group.length));
  const groups = dist.length;
  const member_count = members.length;
  return { apr, str, len, groups, member_count };
};

export const distribution_suits = (p: groups_proportion) => {
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
    if (
      p.len.max === p.len.min &&
      p.groups === nCr_count(p.member_count, p.len.max)
    ) {
      return vs_variation.sp_br;
    }
    return vs_variation.sp_vs;
  }
};

export const getGroups = (members: PCData[], ticket: number): battleGroup[] => {
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
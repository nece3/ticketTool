import { useEffect, useMemo, useState } from "react";
import { Character, PCData, secrets } from "./secrets";
import { ticketType, vs_variation } from "./vs_variation";
import {
  distribution,
  NPCData,
  refreshProp,
  result,
  secCheck,
  vsFilterType,
  ticketFilterType,
} from "./types";
import { NPCInput } from "./NPCInput";
import { getEntries, updateNth, sum, keyMap } from "./util";
import { dist_init, getCharacterRecord, getCharacters } from "./character";
import { NominationArea } from "./NominationArea";
import { CalcButton } from "./CalcButton";
import { ResultTable } from "./ResultTable";
import { ArrayCounter, PCForm, validatedPC } from "./PCForm";

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
  const [ticketFilter, setTicketFilter] = useState<ticketFilterType>(
    keyMap(ticketType, () => true)
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
          ticketFilter[r.ticket_type] &&
          r.npcs.every((n, i) => i >= npcList.length || dataMet(n, npcList[i]))
      ),
    [results, npcList, vsFilter, ticketFilter]
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
      「候補表示」ボタンを押すとNPCの秘密候補を表示します。
      <br />
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
        <VsFilterChecks data={vsFilter} setFilter={setVsFilter} />
      </div>
      <div>
        ペア上限:
        <TicketFilterChecks data={ticketFilter} setFilter={setTicketFilter} />
      </div>
      <div>
        <CalcButton
          data={{
            pcList,
            npcList,
            memberRecord,
            setDistributions,
            setResults,
            setTime,
          }}
        />
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

const TicketFilterChecks = (prop: {
  data: ticketFilterType;
  setFilter: (arg: ticketFilterType) => void;
}) => {
  return (
    <span>
      {getEntries(ticketType).map(([k, v]) => (
        <span key={k}>
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

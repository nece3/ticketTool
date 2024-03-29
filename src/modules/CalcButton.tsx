import { calcArg, calcButtonProp, reportArg, result, distribution } from "./types"
import { combinedGen } from "./util"
import { dist_init, distribution_suits, get_proportion, getGroups, getPCDataGen } from "./character"

export const CalcButton = (prop: { data: calcButtonProp })=>{
  const { pcList, npcList, memberRecord, setTime,
    setDistributions, setResults } = prop.data;
  return <button
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
      );
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

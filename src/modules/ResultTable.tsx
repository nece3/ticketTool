import { get_secret_text, PCData, secrets } from "./secrets";
import { battleGroup, groups_proportion, result } from "./types";
import { addSep, DLTextButton, sum } from "./util";
import { battleType } from "./vs_variation";

const BattleTypeElement = (prop: { type: battleType }) => {
  return <span className={prop.type.className}>{prop.type.name}</span>;
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

const GroupsElement = (prop: {
  groups: battleGroup[];
  proportion: groups_proportion;
}) => {
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
          const str_short =
            prop.proportion.str.max -
            sum(group.members.map((d) => d.myCharacter.strength));
          return (
            <span>
              <span title={`【ペア内容: ${pair_comment}】`}>
                {group.members.map((c) => c.myCharacter.name).join(",")}
              </span>
              {str_short > 0 ? (
                <span
                  title={`この陣営には戦力が不足しています。\n合計で戦力+${str_short}相当のプライズを持たせてください。`}
                >
                  【+{str_short}】
                </span>
              ) : null}
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

export const DLSecretButton = (prop: { data: PCData }) => {
  return (
    <DLTextButton
      getText={() => get_secret_text(prop.data)}
      filename={`${prop.data.myCharacter.name}_秘密.txt`}
      label="秘密DL"
    />
  );
};


export const ResultTable = (prop: { data: result[] }) => {
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

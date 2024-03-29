import { DLSecretButton } from "./ResultTable";
import { Character, PCData, secrets, SecSelect, secTypes } from "./secrets";
import { ArrayCounterProp, PCFormProp } from "./types";
import { callAsInt, findByID, updateNth } from "./util";

export const ArrayCounter = <T,>(prop: ArrayCounterProp<T>) => {
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

export const PCForm = (prop: PCFormProp) => {
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


export const newPCData = (
  prev: readonly Character[],
  new_num: number
): PCData => {
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

const validKeys = (
  myCharacter: Character,
  members: readonly Character[]
): secTypes[] => {
  return (Object.keys(secrets) as secTypes[]).filter(
    (k) => members.filter((m) => secrets[k].target(myCharacter)(m)).length > 0
  );
};

export const validatedPC = (
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
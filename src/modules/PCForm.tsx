import { useState } from 'react'

type ArrayCounterProp<T> = {
  readonly array: readonly T[],
  readonly add: () => void,
  readonly delete: () => void,
}

const ArrayCounter = <T,>(prop:ArrayCounterProp<T>) => {
  return(
    <div>
      <span className="buttonSpace"><button onClick={prop.delete}>-</button></span>
      <span>{ prop.array.length }</span>
      <span className="buttonSpace"><button onClick={prop.add}>+</button></span>
    </div>
  );
}

type Character = {
  readonly id: string;
  readonly name: string;
}

type PCData = {
  readonly myCharacter: Character;
  readonly target: Character;
  readonly secret: SecSelect;
}

const except = (myData:Character, members: readonly Character[]) => members.filter((p) => p !== myData)
const onlyMe = (myData:Character, members: readonly Character[]) => members.filter((p) => p === myData)

const secrets = {
  A: { target: except, extra: [], name: "A進",
    detail: "想い人とペアになる。" },
  B: { target: except, extra: [], name: "B支",
    detail: "想い人が、その想い人とペアになる。" },
  C: { target: except, extra: [], name: "C留",
    detail: "片想いや両想いの2人組を作らない。" },
  D: { target: except, extra: [except], name: "D友",
    detail: "(※2)が、その想い人とペアになる。" },
  E: { target: onlyMe, extra: [], name: "E自",
    detail: "自分とペアになる。" },
  F: { target: except, extra: [], name: "F両",
    detail: "両想いの2人組を可能な限り作る。" },
  G: { target: except, extra: [], name: "G諦",
    detail: "自分とペアになる。" },
  H: { target: except, extra: [except], name: "H応",
    detail: "\n[想い人と両想いでなく、(※2)から想われている]→(※2)とペアになる。\n[それ以外]→想い人とペアになる。" }
} as const

type secTypes = keyof typeof secrets

type SecSelect = Readonly<{
  [key in secTypes]: Readonly<{
    key: key
    extra: Character[]
  }>
}[secTypes]>

const nthReplaced = <T extends any>(arr: readonly T[], arg: T, nth: number) => {
  return arr.map((v, i) => (i === nth ? arg : v))
}

type refreshProp = Partial<Readonly<{
  pcListArg: readonly PCData[];
  npcListArg: readonly Character[];
}>>

export const PageBody = () => {
  const [pcList, setPCList] = useState<readonly PCData[]>([])
  const [npcList, setNPCList] = useState<readonly Character[]>([])
  const members = [...pcList.map((p) => p.myCharacter), ...npcList]
  const refresh = (prop: refreshProp) => {
    let { pcListArg, npcListArg } = prop
    pcListArg ??= pcList
    npcListArg ??= npcList
    const after_char = [...pcListArg.map((p) => p.myCharacter), ...npcListArg]
    setPCList(pcListArg.map((p) => validated(p, after_char)))
    setNPCList(npcListArg)
  }
  return (<>
    <div>
      PC数:
      <PCForm dataList={pcList} setDataList={(pcListArg) => refresh({ pcListArg })}
        members={members}/>
    </div>
    <div>
      NPC:
      <ArrayCounter array={npcList} add={() => {
        const name = "NPC" + (npcList.length + 1)
        refresh({ npcListArg:[...npcList, {id: name, name: name }] })
      }} delete={() => {
        refresh({ npcListArg: npcList.slice(0, npcList.length-1) })
      } }/>
      { npcList.map((c) => <div>{c.name}</div>) }
    </div>
  </>)
}

type PCFormProp = {
  dataList: readonly PCData[];
  setDataList: (arg: PCData[]) => void;
  members: Character[];
}

const PCForm = (prop: PCFormProp) => {
  const { dataList, setDataList } = prop;
  const add = () => {
    setDataList([...dataList, newPCData(dataList.map((p) => p.myCharacter), "PC")])
  }
  const remove = () => {
    setDataList(dataList.slice(0, dataList.length-1))
  }
  const set = (data: PCData, index: number) => {
    setDataList(nthReplaced(dataList, data, index))
  }
  return <>
    <ArrayCounter<PCData> array={dataList} add={add} delete={remove}/>
    <table>
      <tbody>
        { dataList.map((p, i) => <PCInput set={(np) => set({...p, ...np}, i)} myData={p} all={prop.members}/>) }
      </tbody>
    </table>
  </>
}

const findByID = <T extends { id: string }>(id: string, src: readonly T[], nFound: T) => {
  return src.find((m) => m.id === id) ?? nFound
}

const PCInput = (prop: { set: (arg: Partial<PCData>) => void, readonly myData: PCData, readonly all: Character[] }) => {
  const mKey = prop.myData.secret.key;
  const secTarget = secrets[mKey].target(prop.myData.myCharacter, prop.all)
  const changeID = (members: readonly Character[], nth: number, id: string) => {
    const sec = prop.myData.secret
    prop.set({ secret: { ...sec, extra: nthReplaced(sec.extra, findByID(id, members, sec.extra[nth]), nth) }})
  }
  return <tr>
    <td>
      <span>名前:</span>
      <input value={prop.myData.myCharacter.name} onChange={(e) => prop.set({ myCharacter: { ...prop.myData.myCharacter, name: e.target.value } })}/>
    </td>
    <td>
    <span>相手:</span>
    <select value={prop.myData.target?.id ?? undefined} onChange={(e) => prop.set({ target: findByID(e.target.value, secTarget, prop.myData.target) })}>
      <option hidden>※不正値</option>
      { secTarget.map((pc) => <option value={pc.id}>{pc.name}</option>) }
    </select>
    </td>
    <td>
    <span>使命:</span>
    <select value={mKey} title={"【使命】: " + secrets[mKey].detail}
      onChange={(e) => prop.set(validated(prop.myData, prop.all, e.target.value as secTypes))}>
      <option hidden>※不正値</option>
      { validKeys(prop.myData, prop.all).map((k) => <option value={k}>{secrets[k].name}</option>) }
    </select>
    </td>
    { secrets[mKey].extra.map((cond, i) =>{
      const members = cond(prop.myData.myCharacter, prop.all)
      return <td>
        <AdditionalSelector mappedMembers={members} changeID={(arg) => changeID(members, i, arg)} myData={prop.myData} nth={i}/>
      </td>
    })}
  </tr>
}

const validKeys = (myData: PCData, members: readonly Character[]) : secTypes[] => {
  return (Object.keys(secrets) as secTypes[]).filter((k) => secrets[k].target(myData.myCharacter, members).length > 0)
}

const validated = (myData: PCData, members: readonly Character[], newSecKey?: secTypes) : PCData => {
  const impliedKey = newSecKey ?? myData.secret.key
  const valid = validKeys(myData, members)
  const key = valid.includes(impliedKey) ? impliedKey : valid[0]
  const targets = secrets[key].target(myData.myCharacter, members);
  return {
    myCharacter: myData.myCharacter,
    target: targets.includes(myData.target) ? myData.target : targets[targets.length-1],
    secret: {
      key: key,
      extra: secrets[key].extra.map((c, i) => {
        const ex_i_members = c(myData.myCharacter, members)
        const ex_i = myData.secret.extra[i]
        return ex_i && ex_i_members.includes(ex_i) ? ex_i : ex_i_members[ex_i_members.length-1]
      })
    }
  }
}

const AdditionalSelector = (prop: { mappedMembers : readonly Character[], myData: PCData, nth: number, changeID: (arg: string) => void }) => {
  return (
    <>
      <span>{ `(※${prop.nth+2}):` }</span>
      <select value={prop.myData.secret.extra[prop.nth].id} onChange={(e) => prop.changeID(e.target.value)}>
        <option hidden>※不正値</option>
        { prop.mappedMembers.map((t) => <option value={t.id}>
          {t.name}
        </option>) }
      </select>
    </>
  )
}

const newPCData = (prev: readonly Character[], type: string) : PCData => {
  const name = type+(prev.length + 1);
  const me = { id: name, name: name };
  let k = {
    myCharacter: me,
    target: prev[prev.length-1],
    secret: { key: "A", extra: [] } as SecSelect
  }
  if(!k.target){
    k.target = me
  }
  return validated(k, [...prev, me])
}


import { secTypes } from "./secrets";
import { secrets } from "./secrets";
import { CharacterCheck, memberRecord, NPCData, secCheck } from "./types";
import {
  updateNth,
  getEntries,
} from "./util";
import { filteredMembers } from "./character"

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

export const NPCInput = (prop: {
  readonly myData: NPCData;
  members: memberRecord;
  modifyNPC: (n: Partial<NPCData>) => void;
}) => {
  const setName = (name: string) =>
    prop.modifyNPC({ myCharacter: { ...prop.myData.myCharacter, name } });
  const setStrength = (strength: number) =>
    prop.modifyNPC({ myCharacter: { ...prop.myData.myCharacter, strength } });
  const setTarget = (target: CharacterCheck) => prop.modifyNPC({ target });
  const setTargetCheck = (chk: { [k: string]: boolean }) => setTarget({ ...prop.myData.target, ...chk });
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

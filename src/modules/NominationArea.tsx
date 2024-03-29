import { useState } from "react";
import { secTypes, secret_nomination_prefix, secret_nomination_sep, secret_prefix, secrets } from "./secrets";
import { getEntries, getRandomInt, DLTextButton } from "./util";

const get_secret_nomination = (
  name: string,
  nominations: secTypes[]
) => {
  return (
    secret_prefix(name) +
    [
      secret_nomination_prefix,
      ...nominations.map((t) => "\n" + secrets[t].index + secrets[t].statement),
    ].join(secret_nomination_sep)
  );
};

export const NominationArea = () => {
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

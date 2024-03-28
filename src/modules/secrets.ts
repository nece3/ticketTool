
export type secTypes = keyof typeof secrets;

export type SecSelect = Readonly<
  {
    [key in secTypes]: Readonly<{
      key: key;
      extra: Character[];
    }>;
  }[secTypes]
>;

export type admitArgs = {
  me: PCData;
  members: PCData[];
  pairs: Character[][];
};

export type Character = {
  readonly id: string;
  readonly name: string;
  readonly strength: number;
};

export type PCData = {
  readonly myCharacter: Character;
  readonly target: Character;
  readonly secret: SecSelect;
};

export const except = (myData: Character) => (p: Character) => p !== myData;
export const onlyMe = (myData: Character) => (p: Character) => p === myData;

const findData = (arg: { me: Character; members: PCData[] }) =>
  arg.members.find((m) => m.myCharacter === arg.me);
const pairedWithLove = (pair: Character[][], myData: PCData) =>
  pair.some((p) => p.includes(myData.myCharacter) && p.includes(myData.target));

export const secret_prefix = (name: string) => `・${name}の【秘密】：\n`;
export const secret_nomination_prefix = `
メインフェイズ開始時に、次の候補の中からあなたの【秘密】を選択すること。
その際、(※1), (※2), (※3), ... にはそれぞれ、
【秘密】のあるキャラクターの中から、
あなた以外の好きな1人の名前を選んで記入すること。

(「選択:(D)、(※1):楓野 舞、(※2):舌鼓 真云」
 のように、選択内容をGMに伝えるだけでよい。
 その後改めて、選択内容を反映した【秘密】をGMから送信する。)
`;
export const secret_nomination_sep =
  "\n＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝\n";

export const secrets = {
  A: {
    target: except,
    extra: [],
    name: "A進",
    index: "候補(A)",
    detail: "想い人とペアになる。",
    admit: (arg: admitArgs) => {
      //いずれかのペアが、自分と、自分の想い人を含む
      return pairedWithLove(arg.pairs, arg.me);
    },
    statement: `
あなたは「(※1)」に思いを寄せている。

あなたはこの機会を利用し、(※1)との距離を縮めたいと思っている。
(※1)にもまた想い人がいるようだが、そのことで遠慮はしない。
今回踏み込まなければ、あなたはきっと後悔するだろうから。

あなたの【本当の使命】は、
「(※1)とペアになる」ことだ。
`,
  },
  B: {
    target: except,
    extra: [],
    name: "B支",
    index: "候補(B)",
    detail: "想い人が、その想い人とペアになる。",
    admit: (arg: admitArgs) => {
      //いずれかのペアが、想い人と、その想い人を含む
      const like = findData({ members: arg.members, me: arg.me.target });
      if (!like) return false;
      return pairedWithLove(arg.pairs, like);
    },
    statement: `
あなたは「(※1)」に思いを寄せている。

しかし、あなたの好きな人にもまた、想い人がいるようだ。
好きな人だから、幸せになって欲しい。
そう思って、あなたはその恋を応援することに決めた。

あなたの【本当の使命】は、
「(※1)が、その想い人とペアになる」ことだ。
`,
  },
  C: {
    target: except,
    extra: [],
    name: "C留",
    index: "候補(C)",
    detail: "片想いや両想いの2人組を作らない。",
    admit: (arg: admitArgs) => {
      //すべてのペアの全てのキャラクターについて、
      return arg.pairs.every((pair) =>
        pair.every((c) => {
          const they = findData({ members: arg.members, me: c });
          if (!they) return true;
          //想い人が自身であるか、
          if (they.myCharacter === they.target) return true;
          //または同じペアに想い人を含まない
          return !pair.includes(they.target);
        })
      );
    },
    statement: `
あなたは「(※1)」に思いを寄せている。

しかし、あなたは今の全員の関係を心地よく思っており、
誰かが関係を進めようとして、この関係が壊れてしまうことを恐れている。
たとえそれがあなた自身の想いに蓋をし続けることになっても、
あなたはこの「全員の関係」を、少しでも長く続けたいのだ。

あなたの【本当の使命】は、
「片想いや両想いの2人組がペアにならない」ことである。
`,
  },
  D: {
    target: except,
    extra: [except],
    name: "D友",
    index: "候補(D)",
    detail: "(※2)が、その想い人とペアになる。",
    admit: (arg: admitArgs) => {
      //いずれかのペアが、指定した相手と、その想い人を含む。
      const they = findData({
        members: arg.members,
        me: arg.me.secret.extra[0],
      });
      if (!they) return false;
      return pairedWithLove(arg.pairs, they);
    },
    statement: `
あなたは「(※1)」に思いを寄せている。

しかし、あなたは「(※2)」のことを無二の親友だと思っており、
自分のことよりも、親友の恋が実ってほしいと願っている。

あなたの【本当の使命】は、
「(※2)が、その想い人とペアになる」ことである。
`,
  },
  E: {
    target: onlyMe,
    extra: [],
    name: "E自",
    index: "候補(E)",
    detail: "自分とペアになる。",
    admit: (arg: admitArgs) => {
      //いずれかのペアが、自分1人だけからなる
      return arg.pairs.some(
        (pair) => pair.includes(arg.me.myCharacter) && pair.length === 1
      );
    },
    statement: `
あなたは「あなた」に思いを寄せている。
そう、あろうことか、あなたはあなた自身
(あるいは、あなた自身の中にいる何か)に恋をしてしまったのだ。

あなたはこのけして叶わない恋に胸を痛めていたが、
このチケットは、2人ではなく1人で使うことで、
使った者の望む夢が見られるという。

その場所でなら、あなたはあなたの焦がれる人と会えるかもしれない。

あなたの【本当の使命】は、
「自分自身とペアになる」(＝自分1人だけのペアを作る)ことである。
`,
  },
  F: {
    target: except,
    extra: [],
    name: "F両",
    index: "候補(F)",
    detail:
      "両想いの2人組を可能な限り作る。\n[両想いがいなければ]→想い人とペアになる。",
    admit: (arg: admitArgs) => {
      //以下のようなキャラクターを抽出
      const both = arg.members.filter((m1, i1) =>
        arg.members.some(
          (m2, i2) =>
            //本人より後ろ(二重登録と自己愛を避ける)のキャラクターと、
            i2 > i1 &&
            //両想いである
            m1.target === m2.myCharacter &&
            m2.target === m1.myCharacter
        )
      );
      //両想いがいなければ
      if (both.length === 0) {
        //想い人とペアになることが使命
        return pairedWithLove(arg.pairs, arg.me);
      }
      //ペアになった両想いの数が、両想いの数またはペアの数と等しい
      const coupled = both.filter((c) => pairedWithLove(arg.pairs, c));
      return coupled.length === Math.max(both.length, arg.pairs.length);
    },
    statement: `
あなたは「(※1)」に思いを寄せている。

しかし、あなたは思いが通じ合うことの難しさを知っている。
もしもこの中に両想いである2人組がいるのならば、
「ドリーム・チケット」は彼らのために使われるべきだと思っている。

あなたの【本当の使命】は「(※1)とペアになる」ことだが、
この中に両想いの2人組がいれば、あなたの【本当の使命】は
「両想いの2人組によるペアを、可能な限り多く作る」ことに変更される。

なお、あなたは両想いの気配を何となく察知できる。
あなたはセッション中、この中に両想いの2人組が何組いるか
秘密裏に確認することができる(誰と誰が両想いかまでは分からない)。
`,
  },
  G: {
    target: except,
    extra: [],
    name: "G諦",
    index: "候補(G)",
    detail: "自分とペアになる。",
    admit: (arg: admitArgs) => {
      //いずれかのペアが、自分1人だけからなる
      return arg.pairs.some(
        (pair) => pair.includes(arg.me.myCharacter) && pair.length === 1
      );
    },
    statement: `
あなたは「(※1)」に思いを寄せている。

しかし、あなたは極度のヘタレでもある。
好きな人と2人きりの時間を過ごすなどすれば、嫌われてしまうことは確実だ。

しかし、このチケットは、2人ではなく1人で使うことで、
使った者の望む夢が見られるという。
ならば、あなたの望むものは、都合のよい夢だ。
あなたの夢の中に存在する(※1)になら、きっとあなたを好いてもらえる。

あなたの【本当の使命】は「自分自身とペアになる」ことだ。
`,
  },
  H: {
    target: except,
    extra: [except],
    name: "H応",
    index: "候補(H)",
    detail:
      "\n[想い人と両想いでなく、(※2)から想われている]→(※2)とペアになる。\n[それ以外]→想い人とペアになる。",
    admit: (arg: admitArgs) => {
      const like = findData({ members: arg.members, me: arg.me.target });
      const sub = findData({
        members: arg.members,
        me: arg.me.secret.extra[0],
      });
      if (like && sub) {
        const m = arg.me.myCharacter;
        //想い人と両想いでなく、指定したキャラクターの想い人が自分なら
        if (like.target !== m && sub.target === m) {
          //指定したキャラクターが想い人(＝自分)とペアになることが使命
          return pairedWithLove(arg.pairs, sub);
        }
      }
      //それ以外なら、想い人とペアになることが使命
      return pairedWithLove(arg.pairs, arg.me);
    },
    statement: `
あなたは「(※1)」に思いを寄せている。

しかし、あなたには気になっていることがある。「(※2)」のことだ。
…ひょっとして(※2)は、あなたのことが好きなのでは？

あなたと(※1)が両想いならその恋は諦めてもらうほかないが、
そうでない場合、(※2)の想いを受け入れるのもやぶさかではない。
それくらいには、あなたも(※2)のことを気に入っている。

あなたの【本当の使命】は「(※1)とペアになる」ことだが、
(※1)の想い人があなたでなく、(※2)の想い人があなたならば、
あなたの【本当の使命】は「(※2)とペアになる」ことに変更される。

なお、もしも『(※2)の想い人があなたでない』ことを、
(ロールプレイや【秘密】によって)初めてあなたが知った時、
あなたは変調表を1回振り、その変調を受ける。
`,
  },
} as const;
export const get_secret_text = (data: PCData) => {
  return (
    secret_prefix(data.myCharacter.name) +
    data.secret.extra.reduce(
      (s, c, i) => s.replaceAll(`(※${i + 2})`, c.name),
      secrets[data.secret.key].statement.replaceAll("(※1)", data.target.name)
    )
  );
};
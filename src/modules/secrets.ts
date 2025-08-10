
export type secTypes = keyof typeof secrets;

export type SecSelect = Readonly<
  { key: secTypes, extra: Character[] }
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
    statement: (_?: PCData) => `
あなたは「(※1)」に思いを寄せている。

あなたには、確かに取り戻したいものがある。
だが、ただ取り戻すだけでは駄目だ。
この人と一緒に、夢を見たい。過去を取り戻したい。
そうすればきっと、2人の関係を未来に進める一歩を踏み出せるだろう。

たとえ(※1)に他の想い人がいたとしても、これだけは譲れない。
この想いは、あなたにとって逃すことのできない一歩なのだ。

あなたの【本当の使命】は、
「(※1)とペアになる」ことである。
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
    statement: (_?: PCData) => `
あなたは「(※1)」に思いを寄せている。

でも、あなたは気づいてしまった。
自分の願いよりも、あの人の幸せを願っていることに。
あなたの望みは、(※1)が正しい相手と夢を見ることだ。

それはもしかしたら、お節介かもしれない。
けれど、たとえ嫌われようと、この選択がきっとあの人のためになる。
あなたはそう信じている。

あなたの【本当の使命】は、
「(※1)が、その想い人とペアになる」ことである。
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
    statement: (_?: PCData) => `
あなたは「(※1)」に思いを寄せている。

けれど、あなたには壊したくないものがある。
それは、今この場所に流れている穏やかな空気かもしれないし、
全員の距離感かもしれない。

誰かの夢が叶ったとしても、あるいは叶ったからこそ、
その代償として何かが失われるなら――
あなたはその一歩を拒むだろう。

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
    statement: (_?: PCData) => `
あなたは「(※1)」に思いを寄せている。

でも、あなたには譲れないものがある。
それは「(※2)」――あなたの大切な親友だ。
あなたの願いよりも、その人の願いが叶う方が、ずっと報われる気がする。
そして願わくば、親友の想いもまた、報われますように。

あなたの【本当の使命】は、
「(※2)が、その想い人とペアになる」ことである。
`,
  },
  E: {
    target: except,
    extra: [],
    name: "E片",
    index: "候補(E)",
    detail:
      "\n[想い人が片想いをしている]→想い人が、その想い人とペアになる。\n[それ以外]→想い人とペアになる。",
    admit: (arg: admitArgs) => {
      const { me, members } = arg
      const like = findData({ members, me: me.target });
      if (!like) return false;
      const likelike = findData({ members, me: like.target });
      if (!likelike) return false;
      // 想い人が、その想い人の想い人と異なる(＝片想い)なら
      if (like.myCharacter !== likelike.target)
        // 想い人が、その想い人とペアとなることが使命
        return pairedWithLove(arg.pairs, like)
      // そうでなければ、自分が想い人とペアとなることが使命
      return pairedWithLove(arg.pairs, me)
    },
    statement: (_?: PCData) => `
あなたは「(※1)」に思いを寄せている。

ただ、あなたは「報われぬ恋」について、思うところがある。
報われる可能性がどんなに小さくとも、チャンスは与えられるべきではないかと。
そして、(※1)がそのような恋に身を置いているのならば、
あなた自身のことは置いて、そのチャンスを与えてやりたい。
それはきっと、あなたの失ったものより大切なことだ。

あなたの【本当の使命】は、「(※1)とペアになる」ことだが、
(※1)が片想いをしている場合に限り、
あなたの【本当の使命】は「(※1)がその想い人とペアになる」ことに変更される。
`,
  },
  F: {
    target: except,
    extra: [],
    name: "F両",
    index: "候補(F)",
    detail:
      "\n[この中に両想いがいる]→両想いの2人組を可能な限り作る。\n[いない]→想い人とペアになる。",
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
      return coupled.length === Math.min(both.length, arg.pairs.length);
    },
    statement: (_?: PCData) => `
あなたは「(※1)」に思いを寄せている。

けれど、あなたは知っている。
想いが通じ合うことの難しさと、奇跡のような両想いがどれほど尊いかを。
ならば、夢の中で救われるべきは、そういう2人なのだと思う。

あなたの【本当の使命】は「(※1)とペアになる」ことだが、
この中に両想いの2人組がいれば、あなたの【本当の使命】は
「両想いの2人組によるペアを、可能な限り多く作る」ことに変更される。

両想いを重視するあなたは、自分と(※1)との関係にも敏感である。
あなたは(※1)の好きな人を把握している。
(メインフェイズ開始後、GMから通達される)
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
    statement: (_?: PCData) => `
あなたは「(※1)」に思いを寄せている。

しかし、あなたには自信がない。
自分の気持ちを伝えれば、嫌われてしまう気がしてならない。

このチケットは、ひとりで使えば、自分の望む夢が見られるという。
夢の中でだけなら、(※1)が自分を好いてくれる世界があるのではないか。

ひとりで見る夢では、何も取り戻すことはできない？
そんなことは分かっている。でも、これでいいんだ。
たった一夜、望む夢で、望む人に会えさえすれば。

あなたの【本当の使命】は、
「自分1人だけのペアを作る」ことである。
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
    statement: (p?: PCData) => {
      const pre_st = `
あなたは「(※1)」に思いを寄せている。

だが、あなたの心は揺れている。「(※2)」の視線が気になるからだ。
もしかしたら、(※2)はあなたを想ってくれているのではないか？
`;
      const mid_st_diff = `
(※1)が自分を想ってくれるなら迷いはないが、
もしそうでないなら――(※2)の手を取ることも悪くはないと思っている。

あなたの【本当の使命】は「(※1)とペアになる」ことだが、
(※1)の想い人があなたでなく、(※2)の想い人があなたならば、
あなたの【本当の使命】は「(※2)とペアになる」ことに変更される。
`;
      const mid_st_same = `
もしそうであれば――(※2)の手を取ることも悪くはないと思っている。
そう、これは(※2)があなたを好きだからそうするのだ。
勘違いしないでほしい。

あなたの【本当の使命】は「(※2)とペアになる」ことだが、
(※2)の想い人があなたならば、
あなたの【本当の使命】は変更…されず、やはり「(※2)とペアになる」ことである。
`;
      if (p && p.target === p.secret.extra[0]) {
        return pre_st + mid_st_same;
      } else {
        return pre_st + mid_st_diff;
      }
    },
  },
} as const;
export const get_secret_text = (data: PCData) => {
  return (
    secret_prefix(data.myCharacter.name) +
    data.secret.extra.reduce(
      (s, c, i) => s.replaceAll(`(※${i + 2})`, c.name),
      secrets[data.secret.key].statement(data).replaceAll("(※1)", data.target.name)
    )
  );
};
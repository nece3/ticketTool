export const vs_variation = {
  vs: {
    id: "vs",
    name: "対立型",
    detail: "何人かずつの陣営に分かれた状態。",
    valid: true,
    className: "bt_vs",
  },
  coop: {
    id: "coop",
    name: "協力型",
    detail: "1人の陣営と、その他全員からなる陣営に分かれた状態。",
    valid: true,
    className: "bt_coop",
  },
  br: {
    id: "br",
    name: "BR型",
    detail: "上位1人を決めるために、全員が対等に争う状態。",
    valid: true,
    className: "bt_br",
  },
  sp_vs: {
    id: "sp_vs",
    name: "変則対立型",
    detail: "何人かずつの陣営に分かれた状態。所属できる陣営には自由度がある。",
    valid: true,
    className: "bt_sp_vs",
  },
  sp_br: {
    id: "sp_br",
    name: "変則BR型",
    detail: "上位何人かを決めるために、全員が対等に争う状態。",
    valid: true,
    className: "bt_sp_br",
  },
  apr_err: {
    id: "apr_err",
    name: "自由度不備",
    detail: "陣営選択の自由度に差がある。",
    valid: false,
    className: "",
  },
  str_err: {
    id: "str_err",
    name: "戦力不備",
    detail: "戦力に差がある。",
    valid: false,
    className: "",
  },
  grp1_err: {
    id: "grp1_err",
    name: "陣営数不備",
    detail: "陣営が1つしかない。",
    valid: false,
    className: "",
  },
} as const;

export const ticketType = {
  one: { name:"1", pairs: 1 },
  two: { name:"2", pairs: 2 }
} as const;

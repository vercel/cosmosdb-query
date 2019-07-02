export type Token = {
  // the value of the _rid field
  RID: string;

  // the page number
  RT: number;

  // offset
  TRC: number;

  // offset for joined items which has the same "_rid"
  SRC?: number;

  // the value for the ORDER BY clause
  RTD?: any;
};

function encodeAny(RTD: any) {
  return Buffer.from(JSON.stringify(RTD)).toString("base64");
}

function decodeAny(RTD: string) {
  return JSON.parse(Buffer.from(RTD, "base64").toString());
}

export const encode = (t: Token) => {
  return `+RID:${t.RID}#RT:${t.RT}${t.SRC ? `#SRC:${t.SRC}` : ""}#TRC:${t.TRC}${
    typeof t.RTD !== "undefined" ? `#RTD:${encodeAny(t.RTD)}` : ""
  }`;
};

export const decode = (token: string) => {
  return token
    .slice(1)
    .split("#")
    .reduce(
      (o, s) => {
        const i = s.indexOf(":");
        const key = s.slice(0, i);
        let value: any = s.slice(i + 1);
        switch (key) {
          case "RT":
          case "SRC":
          case "TRC":
            value = parseInt(value, 10);
            break;
          case "RTD":
            value = decodeAny(value);
            break;
          default:
          // noop
        }
        // eslint-disable-next-line no-param-reassign
        o[key] = value;
        return o;
      },
      {} as { [x: string]: any }
    ) as Token;
};

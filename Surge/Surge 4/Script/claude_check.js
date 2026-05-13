/*
 * Claude 可用性检测
 * 通过 claude.ai CDN 节点获取出口 IP 的地区，结合 Anthropic 服务政策判断 Claude 是否可用。
 *
 * 自定义 icon、iconerr 及 icon-color，利用 argument 参数传递，不同参数用 & 连接：
 *   icon          — 可用时的 SF Symbol 图标名
 *   iconerr       — 不可用时的 SF Symbol 图标名
 *   icon-color    — 可用时图标颜色（HEX）
 *   iconerr-color — 不可用时图标颜色（HEX）
 *
 * 示例：
 *   argument=icon=sparkle&iconerr=xmark.seal.fill&icon-color=#CC785C&iconerr-color=#D65C51
 */

// Claude 当前支持的国家 / 地区（基于 Anthropic 服务条款，可按需更新）
const tf = [
  "T1",
  // 北美
  "US","CA","MX","PR","VI","GU","AS","MP",
  // 欧洲
  "GB","IE","DE","FR","IT","ES","NL","BE","CH","AT","SE","NO","DK","FI",
  "PL","PT","CZ","HU","RO","GR","BG","HR","SK","SI","LT","LV","EE",
  "CY","LU","MT","IS","LI","MC","SM","AD","VA",
  "UA","GE","AM","AZ","MD","RS","BA","ME","MK","AL",
  // 亚太
  "JP","KR","SG","HK","TW","AU","NZ","IN","TH","MY","ID","PH","VN",
  "BD","PK","LK","NP","MM","KH","BT","MV","LA","MN","FJ","PG","WS","TO","SB","VU",
  // 中东 / 非洲
  "AE","SA","QA","KW","BH","OM","JO","IL","TR",
  "EG","MA","ZA","NG","KE","GH","TZ","SN","CI","ET","RW","UG","MU","TN","DZ",
  // 拉丁美洲
  "BR","AR","CL","CO","PE","UY","CR","EC","GT","PA","DO","BO","PY","HN","SV","NI","JM","TT",
  // 中亚
  "KZ","UZ","KG","TJ"
];

// 解析 argument 参数
let titlediy, icon, iconerr, iconColor, iconerrColor;
if (typeof $argument !== "undefined") {
  const args = $argument.split("&");
  for (let i = 0; i < args.length; i++) {
    const eq = args[i].indexOf("=");
    if (eq === -1) continue;
    const key = args[i].slice(0, eq);
    const value = args[i].slice(eq + 1);
    if (key === "title")         titlediy   = value;
    else if (key === "icon")          icon       = value;
    else if (key === "iconerr")       iconerr    = value;
    else if (key === "icon-color")    iconColor  = value;
    else if (key === "iconerr-color") iconerrColor = value;
  }
}

// 通过 claude.ai Cloudflare 节点获取出口 IP 信息
$httpClient.get(
  {
    url: "https://claude.ai/cdn-cgi/trace",
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 6
  },
  function (error, response, data) {
    if (error || !data) {
      $done({
        title: titlediy || "Claude",
        content: "检测失败",
        icon: iconerr || undefined,
        "icon-color": iconerrColor || undefined
      });
      return;
    }

    // 解析 Cloudflare trace 键值对
    const cf = data.split("\n").reduce((acc, line) => {
      const idx = line.indexOf("=");
      if (idx !== -1) acc[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      return acc;
    }, {});

    const loc = cf.loc || "XX";
    const flag = getCountryFlagEmoji(loc);
    const available = tf.indexOf(loc) !== -1;

    $done({
      title: titlediy || "Claude",
      content: `${available ? "可用" : "不可用"} | 地区: ${flag} ${loc}`,
      icon: available ? (icon || undefined) : (iconerr || undefined),
      "icon-color": available ? (iconColor || undefined) : (iconerrColor || undefined)
    });
  }
);

// 生成国旗 Emoji（TW 映射为 CN 旗帜）
function getCountryFlagEmoji(countryCode) {
  if (countryCode.toUpperCase() === "TW") countryCode = "CN";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

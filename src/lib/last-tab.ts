/**
 * The tab the user was on before opening Yemekler (the search tab), so its back button
 * returns there instead of always jumping home.
 */
const TABS = ['/', '/gunluk', '/sor', '/ben'];
let last = '/';

export function rememberTab(path: string) {
  if (TABS.includes(path)) last = path;
}

export function lastTab() {
  return last;
}

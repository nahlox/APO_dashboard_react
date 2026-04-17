// French month name → calendar number
const MOIS_NUM = {
  janvier: 1, février: 2, mars: 3, avril: 4,
  mai: 5, juin: 6, juillet: 7, août: 8,
  septembre: 9, octobre: 10, novembre: 11, décembre: 12,
}

/** 'janvier' → 'Janvier' */
export function cap(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/** 'Janvier' — from data._etl.mois */
export function monthLabel(data) {
  return cap(data._etl.mois)
}

/** 'Janvier 2026' — from data._etl */
export function monthFull(data) {
  return `${cap(data._etl.mois)} ${data._etl.annee}`
}

/** 'Jan' — 3-char abbreviation */
export function monthShort(data) {
  return cap(data._etl.mois).slice(0, 3)
}

/** Last calendar day of the month: 31, 28, etc. */
export function monthLastDay(data) {
  const num  = MOIS_NUM[data._etl.mois] ?? 1
  const year = data._etl.annee ?? new Date().getFullYear()
  return new Date(year, num, 0).getDate()
}

/** 'dd/mm' end-of-month date string: '31/01', '28/02', etc. */
export function monthEndDate(data) {
  const num = MOIS_NUM[data._etl.mois] ?? 1
  const day = monthLastDay(data)
  return `${String(day).padStart(2, '0')}/${String(num).padStart(2, '0')}`
}

/** 'Jan–Mars' range label from first to last entry of MONTH_DATA */
export function rangeLabel(monthDataArr) {
  if (!monthDataArr.length) return ''
  const first = monthDataArr[0].data
  const last  = monthDataArr.at(-1).data
  if (monthDataArr.length === 1) return monthShort(first)
  return `${monthShort(first)}–${monthLabel(last)}`
}

/** 'Jan + Fév + Mars' cumulative sum label */
export function sumLabel(monthDataArr) {
  return monthDataArr.map(m => monthShort(m.data)).join(' + ')
}

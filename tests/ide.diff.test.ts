import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lineDiff, lcsDiff, diffRows, diffStats, wordSegments } from '../app/ide/diff'

function rebuild(ops: Array<{ type: string; value: string }>, side: 'a' | 'b'): string[] {
  return ops.filter(o => o.type === 'eq' || o.type === (side === 'a' ? 'del' : 'add')).map(o => o.value)
}

test('identical text yields only eq ops', () => {
  const { ops } = lineDiff('a\nb\nc', 'a\nb\nc')
  assert.deepEqual(ops.map(o => o.type), ['eq', 'eq', 'eq'])
})

test('diff reconstructs both sides', () => {
  const a = 'one\ntwo\nthree\nfour\nfive'
  const b = 'one\n2\nthree\nfive\nsix'
  const { ops } = lineDiff(a, b)
  assert.deepEqual(rebuild(ops, 'a'), a.split('\n'))
  assert.deepEqual(rebuild(ops, 'b'), b.split('\n'))
  assert.deepEqual(diffStats(ops), { added: 2, removed: 2, same: 3 })
})

test('empty sides', () => {
  assert.deepEqual(lineDiff('', '').ops, [{ type: 'eq', value: '' }])
  assert.deepEqual(rebuild(lineDiff('', 'x\ny').ops, 'b'), ['x', 'y'])
  assert.deepEqual(rebuild(lineDiff('x\ny', '').ops, 'a'), ['x', 'y'])
})

test('LCS is optimal on a classic case', () => {
  const { ops } = lcsDiff('ABCBDAB'.split(''), 'BDCABA'.split(''))
  assert.equal(ops.filter(o => o.type === 'eq').length, 4)
})

test('randomised round trip: both sides always reconstruct', () => {
  let seed = 7
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
  for (let n = 0; n < 200; n++) {
    const mk = () => Array.from({ length: Math.floor(rnd() * 12) }, () => String(Math.floor(rnd() * 4)))
    const a = mk(), b = mk()
    const { ops } = lcsDiff(a, b)
    assert.deepEqual(rebuild(ops, 'a'), a)
    assert.deepEqual(rebuild(ops, 'b'), b)
  }
})

test('huge middle falls back to a coarse replace without hanging', () => {
  const a = Array.from({ length: 3000 }, (_, i) => `a${i}`).join('\n')
  const b = Array.from({ length: 3000 }, (_, i) => `b${i}`).join('\n')
  const t = Date.now()
  const r = lineDiff(a, b)
  assert.equal(r.coarse, true)
  assert.ok(Date.now() - t < 500)
  assert.deepEqual(rebuild(r.ops, 'a'), a.split('\n'))
  assert.deepEqual(rebuild(r.ops, 'b'), b.split('\n'))
})

test('word segments mark only the changed words', () => {
  const s = wordSegments('Built the API quickly', 'Built the API in Go')
  assert.equal(s.before.filter(x => x.changed).map(x => x.text).join(''), 'quickly')
  assert.equal(s.after.filter(x => x.changed).map(x => x.text).join('').trim(), 'in Go')
  assert.equal(s.before.map(x => x.text).join(''), 'Built the API quickly')
  assert.equal(s.after.map(x => x.text).join(''), 'Built the API in Go')
})

test('diffRows pairs removed and added lines with segments', () => {
  const { rows, stats } = diffRows('keep\nold line here\nend', 'keep\nnew line here\nend')
  assert.deepEqual(rows.map(r => r.type), ['eq', 'del', 'add', 'eq'])
  assert.ok(rows[1].segs && rows[2].segs)
  assert.equal(stats.added, 1)
  assert.equal(stats.removed, 1)
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pageFraction, pageCount, formatPages, breakOffsetsIn, fitScale, CONTENT_H_PX } from '../app/ide/paging'

test('page counts from measured height', () => {
  assert.equal(pageCount(0), 0)
  assert.equal(pageCount(NaN), 0)
  assert.equal(pageCount(100), 1)
  assert.equal(pageCount(CONTENT_H_PX), 1)
  assert.equal(pageCount(CONTENT_H_PX + 2), 1) // sub-pixel noise
  assert.equal(pageCount(CONTENT_H_PX * 1.2), 2)
  assert.equal(pageCount(CONTENT_H_PX * 2), 2)
  assert.equal(pageCount(CONTENT_H_PX * 2.01), 3)
})

test('formatting never shows an overflow as 1.0', () => {
  assert.equal(formatPages(0), '0 pages')
  assert.equal(formatPages(CONTENT_H_PX), '1 page')
  assert.equal(formatPages(CONTENT_H_PX * 0.5), '0.5 pages')
  assert.equal(formatPages(CONTENT_H_PX * 1.2), '1.2 pages')
  assert.equal(formatPages(CONTENT_H_PX * 1.01), '1.1 pages')
  assert.equal(formatPages(CONTENT_H_PX * 2), '2.0 pages')
})

test('break offsets sit at the content height multiples', () => {
  assert.deepEqual(breakOffsetsIn(100), [])
  assert.deepEqual(breakOffsetsIn(CONTENT_H_PX * 2.5), [10.5, 20.5])
  assert.equal(pageFraction(-5), 0)
})

test('fitScale clamps', () => {
  assert.equal(fitScale(2000), 1)
  assert.ok(fitScale(500) < 1 && fitScale(500) > 0.5)
  assert.equal(fitScale(10), 0.3)
  assert.equal(fitScale(0), 1)
})

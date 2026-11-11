/**
 * Portable, line-based unified-style diff. Bounded inputs prevent excessive memory
 * use and accidental dumping of very large existing profile READMEs.
 */
export function diffText(before, after, options = {}) {
  const oldLines = String(before || '').replace(/\r\n/g, '\n').split('\n');
  const newLines = String(after || '').replace(/\r\n/g, '\n').split('\n');
  const cap = options.maxLines ?? 600;
  if (oldLines.length > cap || newLines.length > cap) {
    return 'README exceeds ' + cap + ' lines. Generate a local draft and compare in your editor.\n';
  }
  const n = oldLines.length;
  const m = newLines.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = oldLines[i] === newLines[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && oldLines[i] === newLines[j]) {
      ops.push({ kind: ' ', value: oldLines[i] }); i++; j++;
    } else if (j < m && (i === n || dp[i][j + 1] >= dp[i + 1][j])) {
      ops.push({ kind: '+', value: newLines[j++] });
    } else {
      ops.push({ kind: '-', value: oldLines[i++] });
    }
  }
  if (!ops.some((op) => op.kind !== ' ')) return 'No changes.\n';
  const context = Math.max(0, Math.min(10, options.context ?? 3));
  const kept = new Set();
  for (let k = 0; k < ops.length; k++) {
    if (ops[k].kind === ' ') continue;
    for (let x = Math.max(0, k - context); x <= Math.min(ops.length - 1, k + context); x++) {
      kept.add(x);
    }
  }
  const result = ['--- existing profile README', '+++ proposed profile README'];
  let previous = -2;
  for (let k = 0; k < ops.length; k++) {
    if (!kept.has(k)) continue;
    if (k > previous + 1) result.push('@@');
    result.push(ops[k].kind + ops[k].value);
    previous = k;
  }
  return result.join('\n') + '\n';
}

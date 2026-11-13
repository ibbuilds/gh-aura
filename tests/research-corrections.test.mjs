import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { correctVisualCollector,collectorExpression } from '../scripts/research-corrections.mjs';

const expression=`(()=>{const imgs=[...document.querySelectorAll('img')].filter(x=>{const r=x.getBoundingClientRect();return r.width>2&&r.height>2&&r.bottom>0&&r.top<innerWidth&&r.left<innerWidth&&r.right>0&&r.top<innerHeight;});return {visibleImages:imgs.length,brokenVisibleImages:imgs.filter(x=>x.complete&&x.naturalWidth===0).length};})()`;
const source='const expression='+JSON.stringify(expression)+';\n';
const image=(left,top,{width=20,height=20,broken=false}={})=>({complete:true,naturalWidth:broken?0:20,getBoundingClientRect:()=>({left,top,width,height,right:left+width,bottom:top+height})});

test('the viewport correction detects a broken image in the lower half of 390 × 844',()=>{
  const context={innerWidth:390,innerHeight:844,document:{querySelectorAll:()=>[image(10,100),image(10,600,{broken:true})]}};
  const old=runInNewContext(collectorExpression(source),context);assert.equal(old.visibleImages,1);assert.equal(old.brokenVisibleImages,0);
  const fixed=correctVisualCollector(source),result=runInNewContext(collectorExpression(fixed.source),context);
  assert.equal(result.visibleImages,2);assert.equal(result.brokenVisibleImages,1);assert.equal(fixed.correction.historicalResultsRecomputed,false);assert.equal(fixed.correction.editorialAcceptance,false);
});

test('the repaired predicate retains width, height and viewport intersection guards',()=>{
  const fixed=correctVisualCollector(source),context={innerWidth:390,innerHeight:844,document:{querySelectorAll:()=>[
    image(10,600),image(400,100),image(-50,100),image(10,850),image(10,-50),image(10,100,{width:1}),image(10,100,{height:1})]}};
  assert.equal(runInNewContext(collectorExpression(fixed.source),context).visibleImages,1);
  assert.notEqual(fixed.correction.beforeSha256,fixed.correction.afterSha256);
  assert.throws(()=>correctVisualCollector(fixed.source),/Unexpected/);assert.throws(()=>correctVisualCollector(source+source),/Unexpected/);
});

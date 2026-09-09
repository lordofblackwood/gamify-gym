import { LIFTS, shiftDate, monday } from '../../public/shared/history.mjs';
export const FORMS = [
  ['Base Form',0,'Saiyan','#b5c3d9'],['Kaioken',300,'Kaioken','#f1777e'],['Kaioken ×3',375,'Kaioken','#f1777e'],['Kaioken ×4',450,'Kaioken','#f1777e'],['Kaioken ×10',525,'Kaioken','#fb6b71'],['Super Saiyan 1',600,'Saiyan','#f8d375'],['Super Saiyan Grade 2',700,'Saiyan','#f8d375'],['Super Saiyan Grade 3',775,'Saiyan','#f8d375'],['Full Power Super Saiyan',825,'Saiyan','#f8d375'],['Super Saiyan 2',900,'Saiyan','#f8d375'],['Super Saiyan 3',1050,'Saiyan','#f8d375'],['Super Saiyan God',1200,'Divine','#ff828b'],['Super Saiyan Blue',1350,'Divine','#7cd9ff'],['Blue Kaioken ×10',1450,'Divine','#a5afff'],['Blue Kaioken ×20',1550,'Divine','#a5afff'],['Blue Evolution',1650,'Divine','#679aff'],['Ultra Instinct Sign',1800,'Instinct','#c5d1f1'],['Mastered Ultra Instinct',1950,'Instinct','#edf4ff'],['True Ultra Instinct',2100,'Instinct','#edf4ff'],
  ['Great Ape',300,'GT & primal','#cfaa89'],['Golden Great Ape',750,'GT & primal','#f4c26c'],['Super Saiyan 4',1050,'GT & primal','#f67d8c'],['Full Power SSJ4',1200,'GT & primal','#ed5e81'],['Super Full Power Saiyan 4 Limit Breaker',1500,'GT & primal','#ee88cf'],['Super Saiyan 4 · DAIMA',1300,'GT & primal','#ff696e'],
  ['Kaioken ×20',700,'Kaioken','#f65475'],['Potential Unleashed',850,'Beyond Saiyan','#e0e3ec'],['Ultimate Gohan',1050,'Beyond Saiyan','#eff3ff'],['Beast',1850,'Beyond Saiyan','#ddd4ff'],['Ultra Ego',1850,'Beyond Saiyan','#be85ef'],['Super Saiyan Rage',1100,'Beyond Saiyan','#a8e1fa'],['Super Saiyan Rosé',1350,'Beyond Saiyan','#f19dc6'],['Legendary Super Saiyan',1150,'Beyond Saiyan','#b7ed7a'],['Wrathful Broly',900,'Beyond Saiyan','#8fbd6f'],['Full Power Super Saiyan Broly',1500,'Beyond Saiyan','#a5ed72'],['Berserker Kale',1150,'Beyond Saiyan','#b9f080'],['Super Saiyan Controlled Berserk',1300,'Beyond Saiyan','#b9f080'],
  ['Potential Unleashed Piccolo',950,'Namekian','#b5eb91'],['Orange Piccolo',1400,'Namekian','#ffae68'],['Giant Orange Piccolo',1650,'Namekian','#ffb781'],
  ['Frieza · First Form',300,'Rivals','#d4b8f7'],['Frieza · Second Form',450,'Rivals','#d4b8f7'],['Frieza · Third Form',525,'Rivals','#d4b8f7'],['Frieza · Final Form',600,'Rivals','#dad7e5'],['Frieza · Full Power',900,'Rivals','#dad7e5'],['Golden Frieza',1400,'Rivals','#e6ca7b'],['Black Frieza',2100,'Rivals','#b3a8cd'],['Imperfect Cell',600,'Rivals','#a3d77d'],['Semi-Perfect Cell',825,'Rivals','#a3d77d'],['Perfect Cell',1050,'Rivals','#a3d77d'],['Super Perfect Cell',1200,'Rivals','#afd88b'],['Majin Buu',900,'Rivals','#efa5ce'],['Evil Buu',1000,'Rivals','#b7a8c8'],['Super Buu',1150,'Rivals','#ed93c0'],['Buutenks',1300,'Rivals','#ef90c8'],['Buuhan',1450,'Rivals','#ef90c8'],['Kid Buu',1200,'Rivals','#efa5ce'],
  ['Super Vegito',1250,'Fusion','#e7d77f'],['Vegito Blue',1700,'Fusion','#82cfff'],['Super Gogeta',1250,'Fusion','#e7d77f'],['Gogeta Blue',1800,'Fusion','#82cfff'],['Gogeta Super Saiyan 4',1750,'Fusion','#f57b83'],['Kefla Super Saiyan',1300,'Fusion','#b5df7d'],['Kefla Super Saiyan 2',1450,'Fusion','#b5df7d'],['Gotenks Super Saiyan 3',1150,'Fusion','#f5d083']
].map(([name,threshold,family,color],i)=>({id:`form-${i}`,name,threshold,family,color,main:i<19}));
export const RANKS=[['Iron',0,'#a6a9b8'],['Bronze',15,'#c6947b'],['Silver',30,'#c5d0df'],['Gold',45,'#e9c875'],['Platinum',60,'#7fc9c9'],['Emerald',70,'#79dcb4'],['Diamond',85,'#c1a0ff'],['Master',95,'#dd98eb'],['Grandmaster',98,'#fa888e'],['Challenger',100,'#f7d78b']].map(([name,min,color],i)=>({name,min,color,index:i}));
export function strength(events) {
 const records=Object.fromEntries(Object.keys(LIFTS).map(k=>[k,null]));
 for(const e of events) if(e.source==='bulgarian' && e.singleCompleted && e.exercise in records && (records[e.exercise]?.weight??-1)<e.weight) records[e.exercise]=e;
 const known=Object.values(records).filter(Boolean); const total=known.reduce((s,e)=>s+e.weight,0); const complete=known.length===3;
 const form=FORMS.filter(f=>f.main && f.threshold<=total).at(-1);
 const next=FORMS.find(f=>f.main && f.threshold>total);
 return {records,total,complete,known:known.length,form:complete?form:null,next:complete?next:null,unlocked:complete?FORMS.filter(f=>f.threshold<=total):[],progress:next?Math.max(0,(total-(form?.threshold??0))/(next.threshold-(form?.threshold??0))*100):100};
}
export function consistency(events,today,target=4) {
 const days=[...new Set(events.filter(e=>e.countsDay&&e.date<=today).map(e=>e.date))].sort(); const set=new Set(days); const week=monday(today);
 // Only completed calendar weeks affect rank; partial current weeks never punish rest days.
 const weeks=Array.from({length:12},(_,i)=>{const start=shiftDate(week,-7*(12-i));const count=Array.from({length:7},(_,j)=>shiftDate(start,j)).filter(d=>set.has(d)).length;return {start,count,credit:Math.min(count,target)/target};});
 const score=weeks.reduce((n,w)=>n+w.credit,0)/12*100;
 const rank=RANKS.filter(r=>r.min<=score+1e-8).at(-1); const next=RANKS[rank.index+1];
 const progress=next?Math.max(0,Math.min(100,(score-rank.min)/(next.min-rank.min)*100)):100;
 const division=rank.index<7?['IV','III','II','I'][Math.min(3,Math.floor(progress/25))]:'';
 const lp=rank.index<7?Math.min(99,Math.floor((progress%25)*4)):Math.floor(progress);
 let streak=0;for(const w of [...weeks].reverse()){if(w.count<target)break;streak++;}
 const thisWeek=days.filter(d=>d>=week&&d<=today).length;
 return {days,set,weeks,score,rank,next,division,lp,progress,streak,thisWeek,target,totalDays:days.length,ranked:days.length>0};
}
export function dashboard(snapshots,today,target=4) {
 const all=Object.values(snapshots).flatMap(s=>s?.events||[]);const future=all.filter(e=>e.date>today).length;const events=all.filter(e=>e.date<=today).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
 const accessories=new Map();for(const e of [...events].reverse()) if(e.source==='accessory'&&e.success){const key=`${e.exercise}:${e.unit}`;const previous=accessories.get(key);if(!previous||e.weight>previous.weight||(e.weight===previous.weight&&(e.sets||0)*(e.reps||0)>(previous.sets||0)*(previous.reps||0)))accessories.set(key,e);}
 return {events,future,strength:strength(events),consistency:consistency(events,today,target),accessories:[...accessories.values()]};
}

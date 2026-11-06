// Tab-local generation only; never automatically adopt a newer generation over old drafts.
let currentRevision:number|null=null;
export function dataHeaders(extra:Record<string,string>={}):Record<string,string>{
 return {...extra,...(currentRevision===null?{}:{'X-Parcours-Data-Revision':String(currentRevision)})};
}
export function observeDataRevision(revision:unknown){
 if(typeof revision!=='number'||!Number.isSafeInteger(revision)||revision<0)return;
 if(currentRevision!==null&&currentRevision!==revision)throw new Error('学习数据已被清理。请刷新页面后继续，旧页面内容不会自动恢复到账号中。');
 currentRevision=revision;
}
export function knownDataRevision(){return currentRevision}

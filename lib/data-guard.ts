export class DataRevisionError extends Error {
 constructor(){super('学习数据已被清理或页面已过期。请刷新页面后继续，旧请求不会重新写入。')}
}
export async function dataRevision(db:D1Database,userId:string){
 const row=await db.prepare('SELECT revision FROM app_data_controls WHERE user_id = ?').bind(userId).first<{revision:number}>();
 return row?.revision??0;
}
export function checkRequestRevision(request:Request,revision:number){
 const header=request.headers.get('X-Parcours-Data-Revision');
 if(header!==null){if(header!==String(revision))throw new DataRevisionError()}
 else if(request.method!=='GET'&&revision!==0)throw new DataRevisionError();
}
export function guardStatement(db:D1Database,userId:string,revision:number,id:string){
 return db.prepare('INSERT INTO app_data_guards(id,expected_revision,actual_revision) VALUES(?,?,COALESCE((SELECT revision FROM app_data_controls WHERE user_id=?),0))').bind(id,revision,userId);
}
export function isRevisionFailure(error:unknown):boolean {
 if(error instanceof DataRevisionError)return true;
 if(!(error instanceof Error))return false;
 return error.message.includes('app_data_guard_revision') || (error.cause!==undefined && error.cause!==error && isRevisionFailure(error.cause));
}
// Every operation and batch is guarded in the same transaction as its SQL.
// In-flight ASR/TTS responses therefore cannot save into a new data generation.
export function guardedDatabase(raw:D1Database,userId:string,revision:number):D1Database {
 const statements=new WeakMap<object,D1PreparedStatement>();
 async function batch<T=Record<string,unknown>>(input:D1PreparedStatement[]):Promise<D1Result<T>[]> {
  const id=crypto.randomUUID();
  const native=input.map(statement=>{const found=statements.get(statement);if(!found)throw new Error('Foreign database statement');return found});
  try{
   const results=await raw.batch<T>([guardStatement(raw,userId,revision,id),...native,raw.prepare('DELETE FROM app_data_guards WHERE id=?').bind(id)]);
   return results.slice(1,-1);
  }catch(error){if(isRevisionFailure(error))throw new DataRevisionError();throw error}
 }
 function wrap(native:D1PreparedStatement):D1PreparedStatement {
  const statement={
   bind(...values:unknown[]){return wrap(native.bind(...values))},
   async all<T=Record<string,unknown>>(){return (await batch<T>([statement as D1PreparedStatement]))[0]},
   async run<T=Record<string,unknown>>(){return (await batch<T>([statement as D1PreparedStatement]))[0]},
   async first<T=Record<string,unknown>>(column?:string){
    const result=await statement.all<Record<string,unknown>>(),row=result.results[0];
    if(!row)return null;
    if(column!==undefined){if(!Object.hasOwn(row,column))throw new Error('Unknown selected column');return row[column] as T}
    return row as T;
   },
   async raw(){throw new Error('Use guarded all() for raw result access')},
  };
  statements.set(statement,native);return statement as D1PreparedStatement;
 }
 return {prepare:(sql:string)=>wrap(raw.prepare(sql)),batch,
  exec:()=>{throw new Error('Unprepared SQL is not allowed in user operations')},
  dump:()=>{throw new Error('Database dumps are not user exports')},
  withSession:()=>{throw new Error('Use the guarded request database')},
 } as unknown as D1Database;
}

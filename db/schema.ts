import {sqliteTable,text,integer,primaryKey} from 'drizzle-orm/sqlite-core';
export const profiles=sqliteTable('profiles',{userId:text('user_id').primaryKey(),name:text('name').notNull().default(''),dailyGoal:integer('daily_goal').notNull().default(20)});
export const progress=sqliteTable('lesson_progress',{userId:text('user_id').notNull(),lessonId:text('lesson_id').notNull(),score:integer('score').notNull(),completedAt:integer('completed_at').notNull()},t=>[primaryKey({columns:[t.userId,t.lessonId]})]);
export const activity=sqliteTable('study_activity',{userId:text('user_id').notNull(),attemptId:text('attempt_id').notNull(),lessonId:text('lesson_id').notNull(),seconds:integer('seconds').notNull(),createdAt:integer('created_at').notNull()},t=>[primaryKey({columns:[t.userId,t.attemptId]})]);
export const reviews=sqliteTable('reviews',{userId:text('user_id').notNull(),wordId:text('word_id').notNull(),dueAt:integer('due_at').notNull(),interval:integer('interval_days').notNull().default(0),repetitions:integer('repetitions').notNull().default(0)},t=>[primaryKey({columns:[t.userId,t.wordId]})]);
export const drafts=sqliteTable('writing_drafts',{userId:text('user_id').notNull(),lessonId:text('lesson_id').notNull(),body:text('body').notNull(),updatedAt:integer('updated_at').notNull()},t=>[primaryKey({columns:[t.userId,t.lessonId]})]);
export const assessments=sqliteTable('assessments',{userId:text('user_id').primaryKey(),result:text('result').notNull(),updatedAt:integer('updated_at').notNull()});
export const reports=sqliteTable('content_reports',{id:text('id').primaryKey(),userId:text('user_id').notNull(),lessonId:text('lesson_id').notNull(),body:text('body').notNull(),createdAt:integer('created_at').notNull()});

